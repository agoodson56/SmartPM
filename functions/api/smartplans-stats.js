// ═══════════════════════════════════════════════════════════════
// SMARTPM — SMARTPLANS USAGE STATS API (DEPRECATED)
// This endpoint is no longer used — SmartPlans now has its own
// /api/usage-stats endpoint with its own D1 database.
// Kept for backward compatibility but all new functionality
// routes through SmartPlans' own API.
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
    'https://smartpm.pages.dev',
    'https://smartpm.3dtechnologyservices.com',
    'https://3dtechnologyservices.com',
];

function isAllowedOrigin(origin) {
    if (!origin) return false;
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    if (origin.endsWith('.pages.dev')) return true;
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return true;
    return false;
}

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    return {
        'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function onRequestOptions(context) {
    return new Response(null, { status: 204, headers: getCorsHeaders(context.request) });
}

// GET — Return current stats (read-only, kept for legacy clients)
export async function onRequestGet(context) {
    const { env, request } = context;
    const corsHeaders = getCorsHeaders(request);

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
        }, { headers: corsHeaders });
    } catch (err) {
        console.error('Stats GET error:', err);
        return Response.json({ error: 'Failed to load stats' }, { status: 500, headers: corsHeaders });
    }
}

// POST and DELETE removed — no longer accepting writes
export async function onRequestPost(context) {
    const corsHeaders = getCorsHeaders(context.request);
    return Response.json({
        error: 'This endpoint is deprecated. SmartPlans now uses its own /api/usage-stats.',
    }, { status: 410, headers: corsHeaders });
}

export async function onRequestDelete(context) {
    const corsHeaders = getCorsHeaders(context.request);
    return Response.json({
        error: 'This endpoint is deprecated. SmartPlans now uses its own /api/usage-stats.',
    }, { status: 410, headers: corsHeaders });
}
