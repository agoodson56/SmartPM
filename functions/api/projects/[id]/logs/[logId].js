// ═══════════════════════════════════════════════════════════════
// PUT /api/projects/:id/logs/:logId — Update daily log
// ═══════════════════════════════════════════════════════════════

export async function onRequestPut(context) {
    const { env, request, params } = context;
    try {
        const body = await request.json();
        const fields = [];
        const values = [];
        const allowed = ['weather', 'temperature_high', 'temperature_low', 'site_conditions',
            'crew_size', 'hours_worked', 'work_performed', 'areas_worked',
            'delays', 'safety_incidents', 'visitor_log',
            'materials_received', 'materials_installed', 'notes'];

        for (const key of allowed) {
            if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
        }
        if (fields.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

        fields.push(`updated_at = datetime('now')`);
        values.push(params.logId);

        await env.DB.prepare(`UPDATE daily_logs SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
        return Response.json({ success: true });
    } catch (err) {
        console.error('Update daily log error:', err);
        return Response.json({ error: 'Failed to update daily log' }, { status: 500 });
    }
}
