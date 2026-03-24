// ═══════════════════════════════════════════════════════════════
// GET  /api/projects/:id/documents — List documents
// POST /api/projects/:id/documents — Upload a document
// ═══════════════════════════════════════════════════════════════

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit for D1 storage

export async function onRequestGet(context) {
    const { env, params, request } = context;
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    try {
        let query = `SELECT id, project_id, category, filename, original_name, file_size, mime_type, description, uploaded_by, created_at FROM documents WHERE project_id = ?`;
        const binds = [params.id];

        if (category) { query += ` AND category = ?`; binds.push(category); }

        query += ` ORDER BY created_at DESC`;

        const result = await env.DB.prepare(query).bind(...binds).all();

        const summary = await env.DB.prepare(`
            SELECT
                COUNT(*) as total,
                COALESCE(SUM(file_size), 0) as total_size,
                COUNT(DISTINCT category) as categories
            FROM documents WHERE project_id = ?
        `).bind(params.id).first();

        return Response.json({ documents: result.results || [], summary });
    } catch (err) {
        console.error('Get documents error:', err);
        return Response.json({ error: 'Failed to load documents' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();

        if (!body.name || !body.category) {
            return Response.json({ error: 'Name and category are required' }, { status: 400 });
        }

        if (!body.base64Data) {
            return Response.json({ error: 'File data is required' }, { status: 400 });
        }

        // Validate file size (base64 is ~33% larger than raw, so check decoded size)
        const estimatedSize = body.size || Math.ceil(body.base64Data.length * 0.75);
        if (estimatedSize > MAX_FILE_SIZE) {
            return Response.json({ error: `File too large. Maximum size is 5 MB for D1 storage.` }, { status: 400 });
        }

        const id = crypto.randomUUID().replace(/-/g, '');
        const mimeType = body.type || 'application/octet-stream';

        // Insert document metadata
        await env.DB.prepare(`
            INSERT INTO documents (id, project_id, category, filename, original_name, file_size, mime_type, description, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id,
            params.id,
            body.category,
            body.name,
            body.name,
            estimatedSize,
            mimeType,
            body.description || null,
            data.user.id,
        ).run();

        // Store file content as base64 in companion table
        await env.DB.prepare(`
            INSERT INTO document_content (document_id, data) VALUES (?, ?)
        `).bind(id, body.base64Data).run();

        // Activity log
        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
             VALUES (?, ?, 'create', 'document', ?, ?)`
        ).bind(params.id, data.user.id, id, `Uploaded: ${body.name}`).run();

        return Response.json({ id, success: true }, { status: 201 });
    } catch (err) {
        console.error('Upload document error:', err);
        return Response.json({ error: 'Failed to upload document' }, { status: 500 });
    }
}
