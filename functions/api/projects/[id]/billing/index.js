// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id/billing — List billing periods
// POST /api/projects/:id/billing — Create billing period
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params, data } = context;
    try {
        const project = await data.verifyProjectAccess(params.id);
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        const result = await env.DB.prepare(
            `SELECT * FROM billing_periods WHERE project_id = ? ORDER BY period_number DESC`
        ).bind(params.id).all();
        return Response.json({ periods: result.results || [] });
    } catch (err) {
        console.error('Get billing error:', err);
        return Response.json({ error: 'Failed to load billing periods' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const projectAccess = await data.verifyProjectAccess(params.id);
        if (!projectAccess) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        const body = await request.json();

        // Auto-determine period number
        const last = await env.DB.prepare(
            `SELECT MAX(period_number) as maxNum FROM billing_periods WHERE project_id = ?`
        ).bind(params.id).first();
        const periodNumber = (last?.maxNum || 0) + 1;

        // Get project financials
        const projectData = await env.DB.prepare(
            `SELECT original_contract_value, current_contract_value, retainage_pct FROM projects WHERE id = ?`
        ).bind(params.id).first();

        // Get approved COs total
        const coTotal = await env.DB.prepare(
            `SELECT COALESCE(SUM(total_amount), 0) as total FROM change_orders WHERE project_id = ? AND status = 'approved'`
        ).bind(params.id).first();

        // Auto-calculate less_previous_payments from prior approved/paid periods
        const prevPayments = await env.DB.prepare(
            `SELECT COALESCE(SUM(current_payment_due), 0) as total FROM billing_periods
             WHERE project_id = ? AND status IN ('approved', 'paid')`
        ).bind(params.id).first();
        const lessPreviousPayments = prevPayments?.total || 0;

        const id = crypto.randomUUID().replace(/-/g, '');

        await env.DB.prepare(`
      INSERT INTO billing_periods (id, project_id, period_number, period_start, period_end, status,
        original_contract, net_change_orders, contract_sum_to_date, less_previous_payments, notes, created_by)
      VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)
    `).bind(
            id, params.id, periodNumber,
            body.period_start || new Date().toISOString().split('T')[0],
            body.period_end || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            projectData?.original_contract_value || 0,
            coTotal?.total || 0,
            (projectData?.original_contract_value || 0) + (coTotal?.total || 0),
            lessPreviousPayments,
            body.notes || null,
            data.user.id,
        ).run();

        // Create billing line items from SOV, copying current cumulative values as "previous" snapshot
        const sovItems = await env.DB.prepare(
            `SELECT * FROM sov_items WHERE project_id = ? ORDER BY sort_order ASC`
        ).bind(params.id).all();

        for (const sov of (sovItems.results || [])) {
            const lineId = crypto.randomUUID().replace(/-/g, '');
            // The SOV item's current cumulative % and $ become this period's "previous" baseline
            const prevPct = sov.total_completed_pct || 0;
            const prevVal = sov.total_completed_value || 0;
            await env.DB.prepare(`
        INSERT INTO billing_line_items (id, billing_period_id, sov_item_id,
          previous_completed_pct, previous_completed_value,
          total_completed_pct, total_completed_value, total_stored, retainage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
                lineId, id, sov.id,
                prevPct,
                prevVal,
                prevPct,
                prevVal,
                sov.stored_material || 0,
                sov.retainage || 0,
            ).run();
        }

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'create', 'billing', ?, ?)`
        ).bind(params.id, data.user.id, id, `Created billing period #${periodNumber}`).run();

        return Response.json({ id, periodNumber, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create billing error:', err);
        return Response.json({ error: 'Failed to create billing period' }, { status: 500 });
    }
}
