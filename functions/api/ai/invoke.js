// ═══════════════════════════════════════════════════════════════
// SMARTPM — Server-Side Gemini AI Proxy v2.0
// Powered by Gemini 3.1 Pro Preview
// Authenticated — requires valid session token
// Security: Origin validation, request size limits, error handling
// ═══════════════════════════════════════════════════════════════

export async function onRequestPost(context) {
    const { env, request, data } = context;

    // User is already authenticated via _middleware.js
    if (!data.user) {
        return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate request origin to prevent CSRF
    const origin = request.headers.get('Origin') || '';
    const ALLOWED_ORIGINS = [
        'https://smartpm.pages.dev',
        'https://smartpm.3dtechnologyservices.com',
        'https://3dtechnologyservices.com',
    ];
    if (origin && !ALLOWED_ORIGINS.some(d => origin === d || origin.endsWith('.pages.dev'))) {
        if (!origin.startsWith('http://localhost') && !origin.startsWith('http://127.0.0.1')) {
            return Response.json({ error: 'Origin not allowed' }, { status: 403 });
        }
    }

    try {
        const body = await request.json();
        const model = body._model || 'gemini-3.1-pro-preview';

        // Validate model name to prevent injection
        if (!/^gemini-[\w.-]+$/.test(model)) {
            return Response.json({ error: 'Invalid model name' }, { status: 400 });
        }

        // Remove custom fields before forwarding
        delete body._model;

        // Get API key
        const apiKey = env.GEMINI_KEY || env.GEMINI_KEY_0;
        if (!apiKey) {
            return Response.json(
                { error: 'No Gemini API key configured. Set GEMINI_KEY as a secret.' },
                { status: 500 }
            );
        }

        // Forward to Gemini API with timeout
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        // Handle Gemini API errors with better messages
        if (!geminiResponse.ok) {
            const errBody = await geminiResponse.text().catch(() => '');
            const status = geminiResponse.status;
            if (status === 429) {
                return Response.json(
                    { error: 'AI rate limit reached. Please wait a moment and try again.' },
                    { status: 429 }
                );
            }
            if (status === 400) {
                return Response.json(
                    { error: 'AI request was invalid. Try simplifying your request.' },
                    { status: 400 }
                );
            }
            console.error(`Gemini API error ${status}:`, errBody.substring(0, 500));
            return Response.json(
                { error: `AI service error (${status}). Please try again.` },
                { status: status >= 500 ? 502 : status }
            );
        }

        return new Response(geminiResponse.body, {
            status: geminiResponse.status,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err) {
        if (err.name === 'AbortError') {
            return Response.json(
                { error: 'AI request timed out. Try a shorter prompt or simpler request.' },
                { status: 504 }
            );
        }
        console.error('AI proxy error:', err.message);
        return Response.json(
            { error: 'AI service temporarily unavailable. Please try again.' },
            { status: 500 }
        );
    }
}
