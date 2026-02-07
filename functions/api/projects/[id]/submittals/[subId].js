// ═══════════════════════════════════════════════════════════════
// PUT /api/projects/:id/submittals/:subId — Update submittal
// ═══════════════════════════════════════════════════════════════

export async function onRequestPut(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        const fields = [];
        const values = [];
        const allowed = ['title', 'spec_section', 'description', 'status',
            'submitted_date', 'returned_date', 'due_date', 'revision',
            'discipline', 'category', 'notes'];

        for (const key of allowed) {
            if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
        }
        if (fields.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

        fields.push(`updated_at = datetime('now')`);
        values.push(params.subId);

        await env.DB.prepare(`UPDATE submittals SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
        return Response.json({ success: true });
    } catch (err) {
        console.error('Update submittal error:', err);
        return Response.json({ error: 'Failed to update submittal' }, { status: 500 });
    }
}
