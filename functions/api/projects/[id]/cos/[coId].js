// ═══════════════════════════════════════════════════════════════
// PUT /api/projects/:id/cos/:coId — Update change order
// ═══════════════════════════════════════════════════════════════

export async function onRequestPut(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        const fields = [];
        const values = [];
        const allowed = ['title', 'description', 'status', 'type',
            'material_cost', 'labor_hours', 'labor_cost', 'equipment_cost', 'sub_cost',
            'markup_pct', 'total_amount', 'schedule_impact_days',
            'requested_by', 'requested_date', 'submitted_date',
            'approved_date', 'approved_by', 'rfi_reference', 'revision', 'notes'];

        for (const key of allowed) {
            if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
        }
        if (fields.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

        fields.push(`updated_at = datetime('now')`);
        values.push(params.coId);

        await env.DB.prepare(`UPDATE change_orders SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

        // If approved, update project contract value
        if (body.status === 'approved') {
            const coTotal = await env.DB.prepare(
                `SELECT COALESCE(SUM(total_amount), 0) as total FROM change_orders WHERE project_id = ? AND status = 'approved'`
            ).bind(params.id).first();

            const project = await env.DB.prepare(
                `SELECT original_contract_value FROM projects WHERE id = ?`
            ).bind(params.id).first();

            await env.DB.prepare(
                `UPDATE projects SET current_contract_value = ?, updated_at = datetime('now') WHERE id = ?`
            ).bind((project?.original_contract_value || 0) + (coTotal?.total || 0), params.id).run();
        }

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'update', 'co', ?, ?)`
        ).bind(params.id, data.user.id, params.coId, `Updated CO${body.status ? ' — ' + body.status : ''}`).run();

        return Response.json({ success: true });
    } catch (err) {
        console.error('Update CO error:', err);
        return Response.json({ error: 'Failed to update change order' }, { status: 500 });
    }
}
