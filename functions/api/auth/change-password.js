// ═══════════════════════════════════════════════════════════════
// PUT /api/auth/change-password — HARDENED v2.0
// Uses PBKDF2 (100K iterations + salt) for new passwords
// Role-based password management:
//   admin   → can change any user's password
//   ops_mgr → can change PM password only
//   pm/viewer → cannot change passwords
// ═══════════════════════════════════════════════════════════════

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;

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

export async function onRequestPost(context) {
    const { request, env, data } = context;
    const callerRole = data.user.role;

    try {
        const { target_username, new_password } = await request.json();

        if (!target_username || !new_password) {
            return Response.json({ error: 'Target username and new password are required' }, { status: 400 });
        }

        if (new_password.length < 8) {
            return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // Look up target user
        const targetUser = await env.DB.prepare(
            `SELECT id, username, role FROM users WHERE username = ?`
        ).bind(target_username).first();

        if (!targetUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Enforce role-based permissions
        if (callerRole === 'admin') {
            // Admin can change anyone's password
        } else if (callerRole === 'ops_mgr') {
            // Ops Manager can only change PM passwords
            if (targetUser.role !== 'pm') {
                return Response.json({ error: 'Ops Manager can only change PM passwords' }, { status: 403 });
            }
        } else {
            return Response.json({ error: 'You do not have permission to change passwords' }, { status: 403 });
        }

        // Ensure password_salt column exists (safe, idempotent)
        try {
            await env.DB.prepare(`ALTER TABLE users ADD COLUMN password_salt TEXT`).run();
        } catch (e) { /* column already exists */ }

        // Hash new password with PBKDF2 + salt
        const salt = generateSalt();
        const passwordHash = await hashPBKDF2(new_password, salt);

        // Update password with new PBKDF2 hash and salt
        await env.DB.prepare(
            `UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?`
        ).bind(passwordHash, saltToHex(salt), targetUser.id).run();

        console.log(`[Auth] Password changed for ${target_username} by ${data.user.username} (PBKDF2)`);

        try {
            await env.DB.prepare(
                `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
                 VALUES (NULL, ?, 'password_change', 'user', ?, ?)`
            ).bind(data.user.id, targetUser.id, `Password changed for ${target_username} by ${data.user.username}`).run();
        } catch (e) { /* audit log failure shouldn't block the operation */ }

        return Response.json({ success: true, message: `Password updated for ${target_username}` });
    } catch (err) {
        console.error('Change password error:', err);
        return Response.json({ error: 'Failed to change password' }, { status: 500 });
    }
}
