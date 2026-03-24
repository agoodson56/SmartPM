// ═══════════════════════════════════════════════════════════════
// PUT /api/contacts/:id — Update contact
// DELETE /api/contacts/:id — Delete contact
// ═══════════════════════════════════════════════════════════════

export async function onRequestPut(context) {
    const { env, request, params } = context;
    try {
        const body = await request.json();
        const fields = [];
        const values = [];
        const allowed = ['name', 'company', 'role', 'email', 'phone', 'notes', 'project_id'];

        for (const key of allowed) {
            if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
        }
        if (fields.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

        values.push(params.id);
        await env.DB.prepare(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
        return Response.json({ success: true });
    } catch (err) {
        console.error('Update contact error:', err);
        return Response.json({ error: 'Failed to update contact' }, { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { env, params } = context;
    try {
        await env.DB.prepare(`DELETE FROM contacts WHERE id = ?`).bind(params.id).run();
        return Response.json({ success: true });
    } catch (err) {
        console.error('Delete contact error:', err);
        return Response.json({ error: 'Failed to delete contact' }, { status: 500 });
    }
}
