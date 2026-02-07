// ═══════════════════════════════════════════════════════════════
// PUT /api/projects/:id/sov/:itemId — Update SOV item
// DELETE /api/projects/:id/sov/:itemId — Delete SOV item
// ═══════════════════════════════════════════════════════════════

export async function onRequestPut(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        const fields = [];
        const values = [];
        const allowed = ['item_number', 'description', 'division', 'category',
            'scheduled_value', 'material_cost', 'labor_cost', 'equipment_cost', 'sub_cost',
            'total_completed_pct', 'total_completed_value', 'stored_material', 'retainage', 'sort_order'];

        for (const key of allowed) {
            if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
        }
        if (fields.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

        fields.push(`updated_at = datetime('now')`);
        values.push(params.itemId);

        await env.DB.prepare(`UPDATE sov_items SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
        return Response.json({ success: true });
    } catch (err) {
        console.error('Update SOV error:', err);
        return Response.json({ error: 'Failed to update SOV item' }, { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { env, params, data } = context;
    try {
        await env.DB.prepare(`DELETE FROM sov_items WHERE id = ? AND project_id = ?`).bind(params.itemId, params.id).run();
        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'delete', 'sov', ?, 'Deleted SOV item')`
        ).bind(params.id, data.user.id, params.itemId).run();
        return Response.json({ success: true });
    } catch (err) {
        console.error('Delete SOV error:', err);
        return Response.json({ error: 'Failed to delete SOV item' }, { status: 500 });
    }
}
