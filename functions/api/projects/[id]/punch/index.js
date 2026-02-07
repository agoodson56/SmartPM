// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id/punch — List punch items
// POST /api/projects/:id/punch — Create punch item
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params, request } = context;
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    try {
        let query = `SELECT * FROM punch_items WHERE project_id = ?`;
        const binds = [params.id];

        if (status) { query += ` AND status = ?`; binds.push(status); }
        query += ` ORDER BY item_number ASC`;

        const result = await env.DB.prepare(query).bind(...binds).all();

        const summary = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as complete,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified
      FROM punch_items WHERE project_id = ?
    `).bind(params.id).first();

        return Response.json({ items: result.results || [], summary });
    } catch (err) {
        console.error('Get punch items error:', err);
        return Response.json({ error: 'Failed to load punch items' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        if (!body.location || !body.description) {
            return Response.json({ error: 'Location and description are required' }, { status: 400 });
        }

        const last = await env.DB.prepare(
            `SELECT MAX(item_number) as maxNum FROM punch_items WHERE project_id = ?`
        ).bind(params.id).first();
        const itemNumber = (last?.maxNum || 0) + 1;

        const id = crypto.randomUUID().replace(/-/g, '');

        await env.DB.prepare(`
      INSERT INTO punch_items (id, project_id, item_number, location, description,
        discipline, status, priority, assigned_to, due_date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            id, params.id, itemNumber,
            body.location, body.description,
            body.discipline || null, body.status || 'open',
            body.priority || 'normal', body.assigned_to || null,
            body.due_date || null, body.notes || null, data.user.id,
        ).run();

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'create', 'punch', ?, ?)`
        ).bind(params.id, data.user.id, id, `Punch #${itemNumber}: ${body.description.substring(0, 50)}`).run();

        return Response.json({ id, itemNumber, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create punch item error:', err);
        return Response.json({ error: 'Failed to create punch item' }, { status: 500 });
    }
}
