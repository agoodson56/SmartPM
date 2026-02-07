// ═══════════════════════════════════════════════════════════════
// SMARTPM — AUTH MIDDLEWARE
// Validates session tokens for all /api/* routes (except login)
// ═══════════════════════════════════════════════════════════════

const PUBLIC_PATHS = ['/api/auth/login'];

export async function onRequest(context) {
    const { request, env, data } = context;
    const url = new URL(request.url);

    // Allow public routes
    if (PUBLIC_PATHS.includes(url.pathname)) {
        return context.next();
    }

    // Extract token
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate session
    try {
        const session = await env.DB.prepare(
            `SELECT s.user_id, s.expires_at, u.username, u.display_name, u.email, u.role
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
        ).bind(token).first();

        if (!session) {
            return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
        }

        // Attach user to context
        data.user = {
            id: session.user_id,
            username: session.username,
            display_name: session.display_name,
            email: session.email,
            role: session.role,
        };
        data.token = token;

        return context.next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
