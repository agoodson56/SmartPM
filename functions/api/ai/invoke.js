// ═══════════════════════════════════════════════════════════════
// SMARTPM — Server-Side Gemini AI Proxy v1.0
// Powered by Gemini 3.1 Pro Preview
// Authenticated — requires valid session token
// ═══════════════════════════════════════════════════════════════

export async function onRequestPost(context) {
    const { env, request, data } = context;

    // User is already authenticated via _middleware.js
    if (!data.user) {
        return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const model = body._model || 'gemini-3.1-pro-preview';

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

        // Forward to Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        return new Response(geminiResponse.body, {
            status: geminiResponse.status,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return Response.json(
            { error: 'AI proxy error: ' + err.message },
            { status: 500 }
        );
    }
}
