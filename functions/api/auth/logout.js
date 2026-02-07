// ═══════════════════════════════════════════════════════════════
// POST /api/auth/logout
// ═══════════════════════════════════════════════════════════════

export async function onRequestPost(context) {
    const { env, data } = context;

    try {
        if (data.token) {
            await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(data.token).run();
        }
        return Response.json({ success: true });
    } catch (err) {
        console.error('Logout error:', err);
        return Response.json({ error: 'Logout failed' }, { status: 500 });
    }
}
