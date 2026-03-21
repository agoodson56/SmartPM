// ═══════════════════════════════════════════════════════════════
// SMARTPM — SMARTPLANS USAGE STATS API (DEPRECATED)
// This endpoint is no longer used — SmartPlans now has its own
// /api/usage-stats endpoint with its own D1 database.
// Kept for backward compatibility but all new functionality
// routes through SmartPlans' own API.
// ═══════════════════════════════════════════════════════════════

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET — Return current stats (read-only, kept for legacy clients)
export async function onRequestGet(context) {
    const { env } = context;

    try {
        let row = await env.DB.prepare(
            `SELECT total_cost, bid_count, last_bid_at, last_reset_at FROM smartplans_stats WHERE id = 'global'`
        ).first();

        if (!row) {
            row = { total_cost: 0, bid_count: 0, last_bid_at: null, last_reset_at: null };
        }

        return Response.json({
            total_cost: row.total_cost,
            bid_count: row.bid_count,
            last_bid_at: row.last_bid_at,
            last_reset_at: row.last_reset_at,
            _deprecated: true,
            _message: 'This endpoint is deprecated. SmartPlans now uses its own /api/usage-stats.',
        }, { headers: CORS_HEADERS });
    } catch (err) {
        console.error('Stats GET error:', err);
        return Response.json({ error: 'Failed to load stats' }, { status: 500, headers: CORS_HEADERS });
    }
}

// POST and DELETE removed — no longer accepting writes
export async function onRequestPost() {
    return Response.json({
        error: 'This endpoint is deprecated. SmartPlans now uses its own /api/usage-stats.',
    }, { status: 410, headers: CORS_HEADERS });
}

export async function onRequestDelete() {
    return Response.json({
        error: 'This endpoint is deprecated. SmartPlans now uses its own /api/usage-stats.',
    }, { status: 410, headers: CORS_HEADERS });
}
