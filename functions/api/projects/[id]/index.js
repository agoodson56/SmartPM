// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id — Get single project
// PUT /api/projects/:id — Update project
// DELETE /api/projects/:id — Delete project
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params } = context;
    const id = params.id;

    try {
        const project = await env.DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(id).first();
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Get summary counts
        const [rfis, cos, punch] = await Promise.all([
            env.DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('draft','submitted') THEN 1 ELSE 0 END) as open FROM rfis WHERE project_id = ?`).bind(id).first(),
            env.DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END) as approved_value FROM change_orders WHERE project_id = ?`).bind(id).first(),
            env.DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('open','in_progress') THEN 1 ELSE 0 END) as open FROM punch_items WHERE project_id = ?`).bind(id).first(),
        ]);

        return Response.json({
            project,
            summary: {
                rfis: { total: rfis.total, open: rfis.open },
                changeOrders: { total: cos.total, pending: cos.pending, approvedValue: cos.approved_value },
                punchItems: { total: punch.total, open: punch.open },
            },
        });
    } catch (err) {
        console.error('Get project error:', err);
        return Response.json({ error: 'Failed to load project' }, { status: 500 });
    }
}

export async function onRequestPut(context) {
    const { env, request, params, data } = context;
    const id = params.id;

    try {
        const body = await request.json();

        // Build dynamic UPDATE
        const fields = [];
        const values = [];
        const allowed = [
            'project_number', 'name', 'status', 'type',
            'client_name', 'client_contact', 'client_email', 'client_phone',
            'gc_name', 'gc_contact', 'gc_email', 'gc_phone',
            'address', 'city', 'state', 'zip', 'jurisdiction',
            'bid_date', 'award_date', 'start_date', 'substantial_completion', 'final_completion',
            'original_contract_value', 'current_contract_value', 'total_billed', 'total_paid',
            'retainage_pct', 'retainage_held',
            'pricing_tier', 'regional_multiplier', 'prevailing_wage', 'work_shift',
            'markup_material', 'markup_labor', 'markup_equipment', 'markup_subcontractor',
            'burden_rate', 'include_burden', 'notes',
        ];

        for (const key of allowed) {
            if (body[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(body[key]);
            }
        }

        // Handle JSON fields
        if (body.disciplines !== undefined) {
            fields.push('disciplines = ?');
            values.push(JSON.stringify(body.disciplines));
        }
        if (body.labor_rates !== undefined) {
            fields.push('labor_rates = ?');
            values.push(JSON.stringify(body.labor_rates));
        }

        if (fields.length === 0) {
            return Response.json({ error: 'No fields to update' }, { status: 400 });
        }

        fields.push(`updated_at = datetime('now')`);
        values.push(id);

        await env.DB.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

        // Log activity
        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'update', 'project', ?, 'Updated project settings')`
        ).bind(id, data.user.id, id).run();

        return Response.json({ success: true });
    } catch (err) {
        console.error('Update project error:', err);
        return Response.json({ error: 'Failed to update project' }, { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { env, params, data } = context;
    const id = params.id;

    try {
        // Disable FK constraints for clean cascade delete
        await env.DB.prepare(`PRAGMA foreign_keys = OFF`).run();

        // Hard delete — remove project and ALL associated data
        await env.DB.prepare(`DELETE FROM wbs_tasks WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM location_items WHERE location_id IN (SELECT id FROM locations WHERE project_id = ?)`).bind(id).run();
        await env.DB.prepare(`DELETE FROM cable_runs WHERE location_id IN (SELECT id FROM locations WHERE project_id = ?)`).bind(id).run();
        await env.DB.prepare(`DELETE FROM location_labor WHERE location_id IN (SELECT id FROM locations WHERE project_id = ?)`).bind(id).run();
        await env.DB.prepare(`DELETE FROM locations WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM sov_items WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM billing_line_items WHERE billing_period_id IN (SELECT id FROM billing_periods WHERE project_id = ?)`).bind(id).run();
        await env.DB.prepare(`DELETE FROM billing_periods WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM change_orders WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM rfis WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM submittals WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM daily_logs WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM punch_items WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM documents WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM activity_log WHERE project_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM projects WHERE id = ?`).bind(id).run();

        // Re-enable FK constraints
        await env.DB.prepare(`PRAGMA foreign_keys = ON`).run();

        return Response.json({ success: true });
    } catch (err) {
        console.error('Delete project error:', err);
        return Response.json({ error: 'Failed to delete project: ' + err.message }, { status: 500 });
    }
}
