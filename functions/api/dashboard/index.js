// ═══════════════════════════════════════════════════════════════
// GET /api/dashboard — Portfolio-level metrics
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env } = context;

    try {
        // Project counts by status
        const projectStats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'punch_list' THEN 1 ELSE 0 END) as punch_list,
        SUM(CASE WHEN status = 'bidding' THEN 1 ELSE 0 END) as bidding,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as complete
      FROM projects WHERE status != 'cancelled'
    `).first();

        // Financial summary
        const financials = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(current_contract_value), 0) as total_contract,
        COALESCE(SUM(total_billed), 0) as total_billed,
        COALESCE(SUM(total_paid), 0) as total_paid,
        COALESCE(SUM(retainage_held), 0) as total_retainage
      FROM projects WHERE status IN ('active', 'punch_list')
    `).first();

        // Open RFIs across all projects
        const rfiStats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('draft', 'submitted') THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN due_date < date('now') AND status NOT IN ('closed', 'void') THEN 1 ELSE 0 END) as overdue
      FROM rfis
    `).first();

        // Pending COs across all projects
        const coStats = await env.DB.prepare(`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_value
      FROM change_orders
    `).first();

        // Recent activity
        const activity = await env.DB.prepare(`
      SELECT a.*, u.display_name as user_name, p.name as project_name
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN projects p ON a.project_id = p.id
      ORDER BY a.created_at DESC
      LIMIT 20
    `).all();

        return Response.json({
            projects: projectStats,
            financials,
            rfis: rfiStats,
            changeOrders: coStats,
            recentActivity: activity.results || [],
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        return Response.json({ error: 'Failed to load dashboard' }, { status: 500 });
    }
}
