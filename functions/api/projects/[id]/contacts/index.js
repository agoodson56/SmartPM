// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id/contacts — List contacts for a project
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params, data } = context;
    try {
        const project = await data.verifyProjectAccess(params.id);
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        const result = await env.DB.prepare(
            `SELECT * FROM contacts WHERE project_id = ? OR project_id IS NULL ORDER BY role ASC, name ASC`
        ).bind(params.id).all();
        return Response.json({ contacts: result.results || [] });
    } catch (err) {
        console.error('Get project contacts error:', err);
        return Response.json({ error: 'Failed to load contacts' }, { status: 500 });
    }
}
