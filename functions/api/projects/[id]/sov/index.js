// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id/sov — List SOV items
// POST /api/projects/:id/sov — Create SOV item
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params } = context;
    try {
        const result = await env.DB.prepare(
            `SELECT * FROM sov_items WHERE project_id = ? ORDER BY sort_order ASC, item_number ASC`
        ).bind(params.id).all();

        // Get project contract value for balance check
        const project = await env.DB.prepare(
            `SELECT current_contract_value FROM projects WHERE id = ?`
        ).bind(params.id).first();

        const items = result.results || [];
        const totalScheduled = items.reduce((s, i) => s + (i.scheduled_value || 0), 0);

        return Response.json({
            items,
            balance: {
                totalScheduled,
                contractValue: project?.current_contract_value || 0,
                difference: (project?.current_contract_value || 0) - totalScheduled,
                balanced: Math.abs((project?.current_contract_value || 0) - totalScheduled) < 0.01,
            },
        });
    } catch (err) {
        console.error('Get SOV error:', err);
        return Response.json({ error: 'Failed to load SOV' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        if (!body.item_number || !body.description) {
            return Response.json({ error: 'Item number and description are required' }, { status: 400 });
        }

        const id = crypto.randomUUID().replace(/-/g, '');
        const scheduledValue = (body.material_cost || 0) + (body.labor_cost || 0) +
            (body.equipment_cost || 0) + (body.sub_cost || 0);

        await env.DB.prepare(`
      INSERT INTO sov_items (id, project_id, item_number, description, division, category,
        scheduled_value, material_cost, labor_cost, equipment_cost, sub_cost, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            id, params.id,
            body.item_number, body.description,
            body.division || null, body.category || 'material',
            body.scheduled_value || scheduledValue,
            body.material_cost || 0, body.labor_cost || 0,
            body.equipment_cost || 0, body.sub_cost || 0,
            body.sort_order || 999,
        ).run();

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'create', 'sov', ?, ?)`
        ).bind(params.id, data.user.id, id, `Added SOV item: ${body.item_number}`).run();

        return Response.json({ id, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create SOV error:', err);
        return Response.json({ error: 'Failed to create SOV item' }, { status: 500 });
    }
}
