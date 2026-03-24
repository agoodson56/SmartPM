// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id/rfis — List RFIs
// POST /api/projects/:id/rfis — Create RFI
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params, request } = context;
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const discipline = url.searchParams.get('discipline');

    try {
        let query = `SELECT * FROM rfis WHERE project_id = ?`;
        const binds = [params.id];

        if (status) { query += ` AND status = ?`; binds.push(status); }
        if (discipline) { query += ` AND discipline = ?`; binds.push(discipline); }

        query += ` ORDER BY rfi_number ASC`;

        const result = await env.DB.prepare(query).bind(...binds).all();

        const summary = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('draft','submitted') THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'responded' THEN 1 ELSE 0 END) as responded,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN due_date < date('now') AND status NOT IN ('closed','void') THEN 1 ELSE 0 END) as overdue
      FROM rfis WHERE project_id = ?
    `).bind(params.id).first();

        return Response.json({ rfis: result.results || [], summary });
    } catch (err) {
        console.error('Get RFIs error:', err);
        return Response.json({ error: 'Failed to load RFIs' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        if (!body.subject || !body.question) {
            return Response.json({ error: 'Subject and question are required' }, { status: 400 });
        }

        const last = await env.DB.prepare(
            `SELECT MAX(rfi_number) as maxNum FROM rfis WHERE project_id = ?`
        ).bind(params.id).first();
        const rfiNumber = (last?.maxNum || 0) + 1;

        const id = crypto.randomUUID().replace(/-/g, '');

        await env.DB.prepare(`
      INSERT INTO rfis (id, project_id, rfi_number, subject, question, detail,
        discipline, status, priority,
        submitted_to, due_date,
        cost_impact, schedule_impact,
        source, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?)
    `).bind(
            id, params.id, rfiNumber,
            body.subject, body.question, body.detail || null,
            body.discipline || null, body.status || 'draft', body.priority || 'normal',
            body.submitted_to || null, body.due_date || null,
            body.cost_impact ? 1 : 0, body.schedule_impact ? 1 : 0,
            body.source || 'manual', body.notes || null, data.user.id,
        ).run();

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'create', 'rfi', ?, ?)`
        ).bind(params.id, data.user.id, id, `RFI #${rfiNumber}: ${body.subject}`).run();

        return Response.json({ id, rfiNumber, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create RFI error:', err);
        return Response.json({ error: 'Failed to create RFI' }, { status: 500 });
    }
}
