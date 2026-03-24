// ═══════════════════════════════════════════════════════════════
// GET /api/contacts — List all contacts (global)
// POST /api/contacts — Create contact
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env } = context;
    try {
        const result = await env.DB.prepare(
            `SELECT c.*, p.name as project_name FROM contacts c
       LEFT JOIN projects p ON c.project_id = p.id
       ORDER BY c.role ASC, c.name ASC`
        ).all();
        return Response.json({ contacts: result.results || [] });
    } catch (err) {
        console.error('Get contacts error:', err);
        return Response.json({ error: 'Failed to load contacts' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json();
        if (!body.name) return Response.json({ error: 'Name is required' }, { status: 400 });

        const id = crypto.randomUUID().replace(/-/g, '');

        await env.DB.prepare(`
      INSERT INTO contacts (id, project_id, name, company, role, email, phone, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            id, body.project_id || null,
            body.name, body.company || null, body.role || null,
            body.email || null, body.phone || null, body.notes || null,
        ).run();

        return Response.json({ id, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create contact error:', err);
        return Response.json({ error: 'Failed to create contact' }, { status: 500 });
    }
}
