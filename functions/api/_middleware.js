// ═══════════════════════════════════════════════════════════════
// SMARTPM — AUTH MIDDLEWARE
// Validates session tokens for all /api/* routes (except login)
// ═══════════════════════════════════════════════════════════════

// Routes that skip auth. Everything else (including /api/migrations) requires
// a valid session. Admin-only enforcement for POST /api/migrations is handled
// inside the migrations endpoint itself.
const PUBLIC_PATHS = ['/api/auth/login', '/api/smartplans-stats', '/api/health'];

export async function onRequest(context) {
    const { request, env, data } = context;
    const url = new URL(request.url);

    // Allow public routes
    if (PUBLIC_PATHS.includes(url.pathname)) {
        return context.next();
    }

    // Extract token
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate session
    try {
        const session = await env.DB.prepare(
            `SELECT s.user_id, s.expires_at, u.username, u.display_name, u.email, u.role
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
        ).bind(token).first();

        if (!session) {
            return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
        }

        // Attach user to context
        data.user = {
            id: session.user_id,
            username: session.username,
            display_name: session.display_name,
            email: session.email,
            role: session.role,
        };
        data.token = token;

        // DB retry helper for transient D1 failures
        data.dbRetry = async (preparedStmt, maxRetries = 2) => {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return await preparedStmt;
                } catch (err) {
                    if (attempt === maxRetries || !err.message?.includes('D1_')) throw err;
                    await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt)));
                }
            }
        };

        // Rate limiting for write operations (POST/PUT/DELETE)
        if (['POST', 'PUT', 'DELETE'].includes(request.method) && data.user) {
            // Determine rate limit key and threshold based on endpoint
            let rateLimitKey = `write:${data.user.id}`;
            let maxAttempts = 60; // Default: 60 writes per minute

            if (url.pathname === '/api/ai/invoke') {
                rateLimitKey = `ai:${data.user.id}`;
                maxAttempts = 10;
            } else if (url.pathname === '/api/projects/import') {
                rateLimitKey = `import:${data.user.id}`;
                maxAttempts = 5;
            } else if (url.pathname.match(/^\/api\/projects\/[^/]+\/reimport$/)) {
                rateLimitKey = `reimport:${data.user.id}`;
                maxAttempts = 5;
            } else if (url.pathname.match(/^\/api\/projects\/[^/]+\/documents$/)) {
                rateLimitKey = `docupload:${data.user.id}`;
                maxAttempts = 20;
            }

            try {
                await env.DB.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
                    key TEXT PRIMARY KEY,
                    attempts INTEGER DEFAULT 0,
                    locked_until TEXT,
                    updated_at TEXT DEFAULT (datetime('now'))
                )`).run();
            } catch (e) { /* table already exists */ }

            const check = await env.DB.prepare(
                'SELECT attempts, locked_until, updated_at FROM rate_limits WHERE key = ?'
            ).bind(rateLimitKey).first();

            const now = new Date();
            if (check && check.updated_at) {
                const lastWrite = new Date(check.updated_at);
                if (now - lastWrite > 60000) {
                    // Reset counter — last write was > 1 minute ago
                    await env.DB.prepare(
                        'UPDATE rate_limits SET attempts = 1, locked_until = NULL, updated_at = datetime("now") WHERE key = ?'
                    ).bind(rateLimitKey).run();
                } else if (check.attempts >= maxAttempts) {
                    return Response.json({
                        error: 'Rate limit exceeded. Please wait a moment before making more changes.',
                        retryAfter: 60
                    }, { status: 429, headers: { 'Retry-After': '60' } });
                } else {
                    await env.DB.prepare(
                        'UPDATE rate_limits SET attempts = attempts + 1, updated_at = datetime("now") WHERE key = ?'
                    ).bind(rateLimitKey).run();
                }
            } else {
                await env.DB.prepare(
                    'INSERT OR REPLACE INTO rate_limits (key, attempts, updated_at) VALUES (?, 1, datetime("now"))'
                ).bind(rateLimitKey).run();
            }

            // Probabilistic cleanup of stale rate limit records (1 in 100 requests)
            if (Math.random() < 0.01) {
                env.DB.prepare("DELETE FROM rate_limits WHERE updated_at < datetime('now', '-1 hour')").run().catch(() => {});
            }
        }

        const response = await context.next();

        // ETag-based caching for GET JSON responses
        if (request.method === 'GET' && response.ok &&
            (response.headers.get('Content-Type') || '').includes('application/json')) {
            const body = await response.text();
            const encoder = new TextEncoder();
            const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(body));
            const etag = '"' + Array.from(new Uint8Array(hashBuffer)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('') + '"';

            const ifNoneMatch = request.headers.get('If-None-Match');
            if (ifNoneMatch === etag) {
                return new Response(null, { status: 304 });
            }

            const headers = new Headers(response.headers);
            headers.set('ETag', etag);
            headers.set('Cache-Control', 'private, no-cache');
            return new Response(body, { status: response.status, headers });
        }

        return response;
    } catch (err) {
        console.error('Auth middleware error:', err);
        return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
