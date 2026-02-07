// ═══════════════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════════

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { username, password } = await request.json();
        if (!username || !password) {
            return Response.json({ error: 'Username and password are required' }, { status: 400 });
        }

        // Hash password with SHA-256
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Find user
        const user = await env.DB.prepare(
            `SELECT id, username, display_name, email, role FROM users WHERE username = ? AND password_hash = ?`
        ).bind(username, passwordHash).first();

        if (!user) {
            return Response.json({ error: 'Invalid username or password' }, { status: 401 });
        }

        // Create session token
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
