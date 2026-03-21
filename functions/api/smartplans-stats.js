// ═══════════════════════════════════════════════════════════════
// SMARTPM — SMARTPLANS USAGE STATS API
// Public GET (no auth), POST to increment, DELETE to reset (admin only)
// Used by SmartPlans to track cumulative API spend across all devices
// ═══════════════════════════════════════════════════════════════

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET — Return current stats (public, no auth required)
export async function onRequestGet(context) {
    const { env } = context;

    try {
        // Ensure table exists
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS smartplans_stats (
                id TEXT PRIMARY KEY DEFAULT 'global',
                total_cost REAL DEFAULT 0,
                bid_count INTEGER DEFAULT 0,
                last_bid_at TEXT,
                last_reset_at TEXT,
                reset_by TEXT
            )
        `).run();

        let row = await env.DB.prepare(
            `SELECT total_cost, bid_count, last_bid_at, last_reset_at, reset_by FROM smartplans_stats WHERE id = 'global'`
        ).first();

        if (!row) {
            await env.DB.prepare(
                `INSERT INTO smartplans_stats (id, total_cost, bid_count) VALUES ('global', 0, 0)`
            ).run();
            row = { total_cost: 0, bid_count: 0, last_bid_at: null, last_reset_at: null, reset_by: null };
        }

        return Response.json({
            total_cost: row.total_cost,
            bid_count: row.bid_count,
            last_bid_at: row.last_bid_at,
            last_reset_at: row.last_reset_at,
            reset_by: row.reset_by,
        }, { headers: CORS_HEADERS });
    } catch (err) {
        console.error('Stats GET error:', err);
        return Response.json({ error: 'Failed to load stats' }, { status: 500, headers: CORS_HEADERS });
    }
}

// POST — Increment stats after a bid is processed (no auth — called from SmartPlans)
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const cost = parseFloat(body.cost) || 0;
        const project_name = body.project_name || 'Unknown';

        // Ensure table exists
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS smartplans_stats (
                id TEXT PRIMARY KEY DEFAULT 'global',
                total_cost REAL DEFAULT 0,
                bid_count INTEGER DEFAULT 0,
                last_bid_at TEXT,
                last_reset_at TEXT,
                reset_by TEXT
            )
        `).run();

        // Upsert the stats row
        await env.DB.prepare(`
            INSERT INTO smartplans_stats (id, total_cost, bid_count, last_bid_at)
            VALUES ('global', ?, 1, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                total_cost = total_cost + ?,
                bid_count = bid_count + 1,
                last_bid_at = datetime('now')
        `).bind(cost, cost).run();

        // Also log individual bid for audit trail
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS smartplans_bid_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_name TEXT,
                cost REAL,
                input_tokens INTEGER,
                output_tokens INTEGER,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        await env.DB.prepare(`
            INSERT INTO smartplans_bid_log (project_name, cost, input_tokens, output_tokens)
            VALUES (?, ?, ?, ?)
        `).bind(
            project_name,
            cost,
            body.input_tokens || 0,
            body.output_tokens || 0
        ).run();

        const updated = await env.DB.prepare(
            `SELECT total_cost, bid_count FROM smartplans_stats WHERE id = 'global'`
        ).first();

        return Response.json({
            total_cost: updated.total_cost,
            bid_count: updated.bid_count,
            message: 'Stats updated'
        }, { headers: CORS_HEADERS });
    } catch (err) {
        console.error('Stats POST error:', err);
        return Response.json({ error: 'Failed to update stats' }, { status: 500, headers: CORS_HEADERS });
    }
}

// DELETE — Reset stats (requires admin auth via query param key)
export async function onRequestDelete(context) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const adminKey = url.searchParams.get('key');

        // Simple shared secret for admin reset from SmartPlans
        // In production this would use proper auth
        const ADMIN_RESET_KEY = env.SMARTPLANS_ADMIN_KEY || 'sp-admin-2026';

        if (adminKey !== ADMIN_RESET_KEY) {
            return Response.json({ error: 'Unauthorized — admin key required' }, { status: 403, headers: CORS_HEADERS });
        }

        const body = await request.json().catch(() => ({}));
        const reset_by = body.reset_by || 'admin';

        await env.DB.prepare(`
            UPDATE smartplans_stats SET
                total_cost = 0,
                bid_count = 0,
                last_reset_at = datetime('now'),
                reset_by = ?
            WHERE id = 'global'
        `).bind(reset_by).run();

        return Response.json({
            total_cost: 0,
            bid_count: 0,
            message: 'Stats reset successfully'
        }, { headers: CORS_HEADERS });
    } catch (err) {
        console.error('Stats DELETE error:', err);
        return Response.json({ error: 'Failed to reset stats' }, { status: 500, headers: CORS_HEADERS });
    }
}
