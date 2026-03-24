// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id/cos — List change orders
// POST /api/projects/:id/cos — Create change order
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params } = context;
    try {
        const result = await env.DB.prepare(
            `SELECT * FROM change_orders WHERE project_id = ? ORDER BY co_number ASC`
        ).bind(params.id).all();

        const summary = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END), 0) as approved_total,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_total
      FROM change_orders WHERE project_id = ?
    `).bind(params.id).first();

        return Response.json({ changeOrders: result.results || [], summary });
    } catch (err) {
        console.error('Get COs error:', err);
        return Response.json({ error: 'Failed to load change orders' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        if (!body.title) return Response.json({ error: 'Title is required' }, { status: 400 });

        // Auto-number
        const last = await env.DB.prepare(
            `SELECT MAX(co_number) as maxNum FROM change_orders WHERE project_id = ?`
        ).bind(params.id).first();
        const coNumber = (last?.maxNum || 0) + 1;

        // Calculate total with markup
        const subtotal = (body.material_cost || 0) + (body.labor_cost || 0) +
            (body.equipment_cost || 0) + (body.sub_cost || 0);
        const markupAmount = subtotal * ((body.markup_pct || 0) / 100);
        const totalAmount = body.total_amount || (subtotal + markupAmount);

        const id = crypto.randomUUID().replace(/-/g, '');

        await env.DB.prepare(`
      INSERT INTO change_orders (id, project_id, co_number, title, description, status, type,
        material_cost, labor_hours, labor_cost, equipment_cost, sub_cost,
        markup_pct, total_amount, schedule_impact_days,
        requested_by, requested_date, rfi_reference, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?)
    `).bind(
            id, params.id, coNumber,
            body.title, body.description || null,
            body.status || 'pending', body.type || 'addition',
            body.material_cost || 0, body.labor_hours || 0, body.labor_cost || 0,
            body.equipment_cost || 0, body.sub_cost || 0,
            body.markup_pct || 0, totalAmount, body.schedule_impact_days || 0,
            body.requested_by || null, body.requested_date || null,
            body.rfi_reference || null, body.notes || null, data.user.id,
        ).run();

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'create', 'co', ?, ?)`
        ).bind(params.id, data.user.id, id, `CO #${coNumber}: ${body.title}`).run();

        return Response.json({ id, coNumber, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create CO error:', err);
        return Response.json({ error: 'Failed to create change order' }, { status: 500 });
    }
}
