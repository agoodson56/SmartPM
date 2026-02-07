// ═══════════════════════════════════════════════════════════════
// GET /api/projects — List all projects
// POST /api/projects — Create new project
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    try {
        let query = `SELECT * FROM projects WHERE 1=1`;
        const binds = [];

        if (status) {
            query += ` AND status = ?`;
            binds.push(status);
        }

        query += ` ORDER BY updated_at DESC`;

        const stmt = env.DB.prepare(query);
        const result = binds.length > 0 ? await stmt.bind(...binds).all() : await stmt.all();

        return Response.json({ projects: result.results || [] });
    } catch (err) {
        console.error('List projects error:', err);
        return Response.json({ error: 'Failed to load projects' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, data } = context;

    try {
        const body = await request.json();
        if (!body.name) {
            return Response.json({ error: 'Project name is required' }, { status: 400 });
        }

        const id = crypto.randomUUID().replace(/-/g, '');

        await env.DB.prepare(`
      INSERT INTO projects (id, project_number, name, status, type,
        client_name, client_contact, client_email, client_phone,
        gc_name, gc_contact, gc_email, gc_phone,
        address, city, state, zip, jurisdiction,
        bid_date, award_date, start_date, substantial_completion, final_completion,
        original_contract_value, current_contract_value, retainage_pct,
        disciplines, pricing_tier, regional_multiplier, prevailing_wage, work_shift,
        markup_material, markup_labor, markup_equipment, markup_subcontractor,
        labor_rates, burden_rate, include_burden,
        notes, created_by)
      VALUES (?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?)
    `).bind(
            id,
            body.project_number || null,
            body.name,
            body.status || 'active',
            body.type || null,
            body.client_name || null,
            body.client_contact || null,
            body.client_email || null,
            body.client_phone || null,
            body.gc_name || null,
            body.gc_contact || null,
            body.gc_email || null,
            body.gc_phone || null,
            body.address || null,
            body.city || null,
            body.state || null,
            body.zip || null,
            body.jurisdiction || null,
            body.bid_date || null,
            body.award_date || null,
            body.start_date || null,
            body.substantial_completion || null,
            body.final_completion || null,
            body.original_contract_value || 0,
            body.current_contract_value || body.original_contract_value || 0,
            body.retainage_pct || 10,
            body.disciplines ? JSON.stringify(body.disciplines) : null,
            body.pricing_tier || 'mid',
            body.regional_multiplier || 'national_average',
            body.prevailing_wage || '',
            body.work_shift || '',
            body.markup_material || 25,
            body.markup_labor || 30,
            body.markup_equipment || 15,
            body.markup_subcontractor || 10,
            body.labor_rates ? JSON.stringify(body.labor_rates) : null,
            body.burden_rate || 35,
            body.include_burden !== undefined ? (body.include_burden ? 1 : 0) : 1,
            body.notes || null,
            data.user.id,
        ).run();

        // Log activity
        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'create', 'project', ?, ?)`
        ).bind(id, data.user.id, id, `Created project: ${body.name}`).run();

        return Response.json({ id, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create project error:', err);
        return Response.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
