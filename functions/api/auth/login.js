// ═══════════════════════════════════════════════════════════════
// POST /api/auth/login — HARDENED v2.0
// Security: PBKDF2 password hashing + login rate limiting
// Backward compatible: auto-upgrades legacy SHA-256 hashes
// ═══════════════════════════════════════════════════════════════

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;

// ── PBKDF2 Hashing with Salt ────────────────────────────────────
async function hashPBKDF2(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial, 256
    );
    return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt() {
    const salt = new Uint8Array(SALT_BYTES);
    crypto.getRandomValues(salt);
    return salt;
}

function saltToHex(salt) {
    return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToSalt(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
}

// ── Legacy SHA-256 (for backward compatibility) ─────────────────
async function hashSHA256(password) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { username, password } = await request.json();
        if (!username || !password) {
            return Response.json({ error: 'Username and password are required' }, { status: 400 });
        }

        // ── Rate Limiting — prevent brute force ─────────────────────
        // Create rate_limits table if it doesn't exist (safe, idempotent)
        try {
            await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS rate_limits (
                    key TEXT PRIMARY KEY,
                    attempts INTEGER DEFAULT 0,
                    locked_until TEXT,
                    updated_at TEXT DEFAULT (datetime('now'))
                )
            `).run();
        } catch (e) { /* table already exists, ignore */ }

        const rateLimitKey = `login:${username.toLowerCase()}`;
        const rateCheck = await env.DB.prepare(
            `SELECT attempts, locked_until FROM rate_limits WHERE key = ?`
        ).bind(rateLimitKey).first();

        // Check if account is locked
        if (rateCheck && rateCheck.locked_until) {
            const lockExpiry = new Date(rateCheck.locked_until);
            if (lockExpiry > new Date()) {
                const minsLeft = Math.ceil((lockExpiry - new Date()) / 60000);
                return Response.json(
                    { error: `Account temporarily locked. Try again in ${minsLeft} minute${minsLeft > 1 ? 's' : ''}.` },
                    { status: 429 }
                );
            }
            // Lockout expired — reset
            await env.DB.prepare(
                `UPDATE rate_limits SET attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE key = ?`
            ).bind(rateLimitKey).run();
        }

        // ── Find user ───────────────────────────────────────────────
        // Ensure password_salt column exists (one-time migration check)
        // Uses SELECT probe instead of ALTER TABLE on every login to avoid race conditions
        try {
            await env.DB.prepare(`SELECT password_salt FROM users LIMIT 0`).run();
        } catch (e) {
            try {
                await env.DB.prepare(`ALTER TABLE users ADD COLUMN password_salt TEXT`).run();
            } catch (e2) { /* concurrent migration or column exists — safe to ignore */ }
        }

        const user = await env.DB.prepare(
            `SELECT id, username, password_hash, password_salt, display_name, email, role FROM users WHERE username = ?`
        ).bind(username).first();

        if (!user) {
            // Record failed attempt even for non-existent users (prevents username enumeration timing)
            await recordFailedAttempt(env.DB, rateLimitKey, rateCheck?.attempts || 0);
            return Response.json({ error: 'Invalid username or password' }, { status: 401 });
        }

        // ── Verify password — try PBKDF2 first, fallback to SHA-256 ─
        let isValid = false;
        let needsUpgrade = false;

        if (user.password_salt) {
            // Modern PBKDF2 hash with salt
            const salt = hexToSalt(user.password_salt);
            const hash = await hashPBKDF2(password, salt);
            isValid = (hash === user.password_hash);
        } else {
            // Legacy SHA-256 hash (no salt) — auto-upgrade on success
            const legacyHash = await hashSHA256(password);
            isValid = (legacyHash === user.password_hash);
            if (isValid) needsUpgrade = true;
        }

        if (!isValid) {
            const attempts = await recordFailedAttempt(env.DB, rateLimitKey, rateCheck?.attempts || 0);
            const remaining = MAX_ATTEMPTS - attempts;
            const msg = remaining > 0
                ? `Invalid username or password. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
                : `Account locked for ${LOCKOUT_MINUTES} minutes due to too many failed attempts.`;
            return Response.json({ error: msg }, { status: 401 });
        }

        // ── Login successful — reset rate limit ─────────────────────
        await env.DB.prepare(
            `DELETE FROM rate_limits WHERE key = ?`
        ).bind(rateLimitKey).run();

        // ── Auto-upgrade SHA-256 → PBKDF2 (seamless migration) ──────
        if (needsUpgrade) {
            try {
                // password_salt column already verified above (line ~92)

                const newSalt = generateSalt();
                const newHash = await hashPBKDF2(password, newSalt);
                await env.DB.prepare(
                    `UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?`
                ).bind(newHash, saltToHex(newSalt), user.id).run();
                console.log(`[Auth] Auto-upgraded password hash for ${username} to PBKDF2`);
            } catch (upgradeErr) {
                // Non-critical — login still works with old hash
                console.warn('[Auth] Password upgrade failed (non-critical):', upgradeErr.message);
            }
        }

        // ── Cleanup expired sessions ────────────────────────────────
        await env.DB.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`).run();

        // ── Limit concurrent sessions: keep only last 4 per user ────
        const existingSessions = await env.DB.prepare(
            `SELECT token FROM sessions WHERE user_id = ? ORDER BY created_at DESC`
        ).bind(user.id).all();
        const stale = (existingSessions.results || []).slice(4);
        for (const s of stale) {
            await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(s.token).run();
        }

        // ── Create session token (256-bit CSPRNG) ───────────────────
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

        // 24-hour expiry
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await env.DB.prepare(
            `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
        ).bind(token, user.id, expiresAt).run();

        // Update last login
        await env.DB.prepare(
            `UPDATE users SET last_login = datetime('now') WHERE id = ?`
        ).bind(user.id).run();

        return Response.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return Response.json({ error: 'Login failed' }, { status: 500 });
    }
}

// ── Record failed login attempt and lock if threshold exceeded ───
async function recordFailedAttempt(db, key, currentAttempts) {
    const newAttempts = currentAttempts + 1;
    const lockUntil = newAttempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
        : null;

    await db.prepare(`
        INSERT INTO rate_limits (key, attempts, locked_until, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
            attempts = ?,
            locked_until = ?,
            updated_at = datetime('now')
    `).bind(key, newAttempts, lockUntil, newAttempts, lockUntil).run();

    return newAttempts;
}
