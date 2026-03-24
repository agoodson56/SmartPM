// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id/submittals — List submittals
// POST /api/projects/:id/submittals — Create submittal
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params } = context;
    try {
        const result = await env.DB.prepare(
            `SELECT * FROM submittals WHERE project_id = ? ORDER BY submittal_number ASC`
        ).bind(params.id).all();
        return Response.json({ submittals: result.results || [] });
    } catch (err) {
        console.error('Get submittals error:', err);
        return Response.json({ error: 'Failed to load submittals' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        if (!body.title) return Response.json({ error: 'Title is required' }, { status: 400 });

        const id = crypto.randomUUID().replace(/-/g, '');
        const submittalNumber = body.submittal_number || `SUB-${Date.now().toString(36).toUpperCase()}`;

        await env.DB.prepare(`
      INSERT INTO submittals (id, project_id, submittal_number, title, spec_section, description,
        status, due_date, discipline, category, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            id, params.id, submittalNumber,
            body.title, body.spec_section || null, body.description || null,
            body.status || 'in_preparation', body.due_date || null,
            body.discipline || null, body.category || null,
            body.notes || null, data.user.id,
        ).run();

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'create', 'submittal', ?, ?)`
        ).bind(params.id, data.user.id, id, `Submittal ${submittalNumber}: ${body.title}`).run();

        return Response.json({ id, submittalNumber, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create submittal error:', err);
        return Response.json({ error: 'Failed to create submittal' }, { status: 500 });
    }
}
