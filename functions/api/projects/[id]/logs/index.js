// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id/logs — List daily logs
// POST /api/projects/:id/logs — Create daily log
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params, request } = context;
    const url = new URL(request.url);
    const month = url.searchParams.get('month'); // format: YYYY-MM

    try {
        let query = `SELECT * FROM daily_logs WHERE project_id = ?`;
        const binds = [params.id];

        if (month) {
            query += ` AND log_date LIKE ?`;
            binds.push(`${month}%`);
        }

        query += ` ORDER BY log_date DESC`;

        const result = await env.DB.prepare(query).bind(...binds).all();
        return Response.json({ logs: result.results || [] });
    } catch (err) {
        console.error('Get daily logs error:', err);
        return Response.json({ error: 'Failed to load daily logs' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        const logDate = body.log_date || new Date().toISOString().split('T')[0];

        // Check for duplicate date
        const existing = await env.DB.prepare(
            `SELECT id FROM daily_logs WHERE project_id = ? AND log_date = ?`
        ).bind(params.id, logDate).first();
        if (existing) {
            return Response.json({ error: 'A log entry already exists for this date' }, { status: 409 });
        }

        const id = crypto.randomUUID().replace(/-/g, '');

        await env.DB.prepare(`
      INSERT INTO daily_logs (id, project_id, log_date,
        weather, temperature_high, temperature_low, site_conditions,
        crew_size, hours_worked, work_performed, areas_worked,
        delays, safety_incidents, visitor_log,
        materials_received, materials_installed, notes, created_by)
      VALUES (?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?)
    `).bind(
            id, params.id, logDate,
            body.weather || null, body.temperature_high || null, body.temperature_low || null,
            body.site_conditions || null,
            body.crew_size || 0, body.hours_worked || 0,
            body.work_performed || null, body.areas_worked || null,
            body.delays || null, body.safety_incidents || null, body.visitor_log || null,
            body.materials_received || null, body.materials_installed || null,
            body.notes || null, data.user.id,
        ).run();

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'create', 'daily_log', ?, ?)`
        ).bind(params.id, data.user.id, id, `Daily log for ${logDate}`).run();

        return Response.json({ id, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create daily log error:', err);
        return Response.json({ error: 'Failed to create daily log' }, { status: 500 });
    }
}
