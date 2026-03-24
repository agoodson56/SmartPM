// ═══════════════════════════════════════════════════════════════
// PUT /api/projects/:id/rfis/:rfiId — Update RFI
// ═══════════════════════════════════════════════════════════════

export async function onRequestPut(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        const fields = [];
        const values = [];
        const allowed = ['subject', 'question', 'detail', 'discipline', 'status', 'priority',
            'submitted_to', 'submitted_date', 'response', 'responded_by', 'response_date', 'due_date',
            'cost_impact', 'schedule_impact', 'change_order_id', 'revision', 'category', 'notes'];

        for (const key of allowed) {
            if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
        }
        if (fields.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

        fields.push(`updated_at = datetime('now')`);
        values.push(params.rfiId);

        await env.DB.prepare(`UPDATE rfis SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'update', 'rfi', ?, ?)`
        ).bind(params.id, data.user.id, params.rfiId, `Updated RFI${body.status ? ' — ' + body.status : ''}`).run();

        return Response.json({ success: true });
    } catch (err) {
        console.error('Update RFI error:', err);
        return Response.json({ error: 'Failed to update RFI' }, { status: 500 });
    }
}
