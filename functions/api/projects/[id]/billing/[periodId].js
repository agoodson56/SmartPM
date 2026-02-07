// ═══════════════════════════════════════════════════════════════
// GET /api/projects/:id/billing/:periodId — Get billing period with line items
// PUT /api/projects/:id/billing/:periodId — Update billing period
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params } = context;
    try {
        const period = await env.DB.prepare(
            `SELECT * FROM billing_periods WHERE id = ? AND project_id = ?`
        ).bind(params.periodId, params.id).first();

        if (!period) return Response.json({ error: 'Billing period not found' }, { status: 404 });

        const lines = await env.DB.prepare(`
      SELECT bl.*, s.item_number, s.description, s.scheduled_value, s.division, s.category
      FROM billing_line_items bl
      JOIN sov_items s ON bl.sov_item_id = s.id
      WHERE bl.billing_period_id = ?
      ORDER BY s.sort_order ASC
    `).bind(params.periodId).all();

        return Response.json({ period, lineItems: lines.results || [] });
    } catch (err) {
        console.error('Get billing period error:', err);
        return Response.json({ error: 'Failed to load billing period' }, { status: 500 });
    }
}

export async function onRequestPut(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();

        // Update period header
        if (body.period) {
            const fields = [];
            const values = [];
            const allowed = ['status', 'period_start', 'period_end', 'submitted_date',
                'approved_date', 'paid_date', 'paid_amount', 'notes',
                'total_completed_stored', 'retainage', 'total_earned_less_retainage',
                'less_previous_payments', 'current_payment_due'];

            for (const key of allowed) {
                if (body.period[key] !== undefined) { fields.push(`${key} = ?`); values.push(body.period[key]); }
            }
            if (fields.length > 0) {
                fields.push(`updated_at = datetime('now')`);
                values.push(params.periodId);
                await env.DB.prepare(`UPDATE billing_periods SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
            }
        }

        // Update line items
        if (body.lineItems && Array.isArray(body.lineItems)) {
            for (const line of body.lineItems) {
                if (!line.id) continue;
                await env.DB.prepare(`
          UPDATE billing_line_items SET
            work_completed_this_period = ?,
            stored_material_this_period = ?,
            total_completed_pct = ?,
            total_completed_value = ?,
            total_stored = ?,
            retainage = ?
          WHERE id = ?
        `).bind(
                    line.work_completed_this_period || 0,
                    line.stored_material_this_period || 0,
                    line.total_completed_pct || 0,
                    line.total_completed_value || 0,
                    line.total_stored || 0,
                    line.retainage || 0,
                    line.id,
                ).run();

                // Update SOV cumulative values
                if (line.sov_item_id) {
                    await env.DB.prepare(`
            UPDATE sov_items SET
              total_completed_pct = ?,
              total_completed_value = ?,
              stored_material = ?,
              retainage = ?,
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(
                        line.total_completed_pct || 0,
                        line.total_completed_value || 0,
                        line.total_stored || 0,
                        line.retainage || 0,
                        line.sov_item_id,
                    ).run();
                }
            }
        }

        // If billing is approved/paid, update project total_billed
        if (body.period?.status === 'approved' || body.period?.status === 'paid') {
            const allPeriods = await env.DB.prepare(
                `SELECT COALESCE(SUM(current_payment_due), 0) as total FROM billing_periods
         WHERE project_id = ? AND status IN ('approved', 'paid')`
            ).bind(params.id).first();

            await env.DB.prepare(
                `UPDATE projects SET total_billed = ?, updated_at = datetime('now') WHERE id = ?`
            ).bind(allPeriods?.total || 0, params.id).run();
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error('Update billing error:', err);
        return Response.json({ error: 'Failed to update billing period' }, { status: 500 });
    }
}
