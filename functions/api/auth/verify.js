// ═══════════════════════════════════════════════════════════════
// GET /api/auth/verify
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    // If we reach here, middleware already validated the token
    return Response.json({ user: context.data.user });
}
