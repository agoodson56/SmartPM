// ═══════════════════════════════════════════════════════════════
// PUT /api/projects/:id/punch/:itemId — Update punch item
// ═══════════════════════════════════════════════════════════════

export async function onRequestPut(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        const fields = [];
        const values = [];
        const allowed = ['location', 'description', 'discipline', 'status', 'priority',
            'assigned_to', 'due_date', 'completed_date', 'verified_by', 'verified_date', 'notes'];

        for (const key of allowed) {
            if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
        }
        if (fields.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

        fields.push(`updated_at = datetime('now')`);
        values.push(params.itemId);

        await env.DB.prepare(`UPDATE punch_items SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
        return Response.json({ success: true });
    } catch (err) {
        console.error('Update punch item error:', err);
        return Response.json({ error: 'Failed to update punch item' }, { status: 500 });
    }
}
