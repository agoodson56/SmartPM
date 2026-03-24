// ═══════════════════════════════════════════════════════════════
// GET    /api/projects/:id/documents/:docId — Download or get metadata
// DELETE /api/projects/:id/documents/:docId — Delete a document
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params, request, data } = context;
    const url = new URL(request.url);
    const metaOnly = url.searchParams.get('meta') === 'true';

    try {
        const project = await data.verifyProjectAccess(params.id);
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        const doc = await env.DB.prepare(
            `SELECT id, project_id, category, filename, original_name, file_size, mime_type, description, uploaded_by, created_at
             FROM documents WHERE id = ? AND project_id = ?`
        ).bind(params.docId, params.id).first();

        if (!doc) {
            return Response.json({ error: 'Document not found' }, { status: 404 });
        }

        // Return just metadata if requested
        if (metaOnly) {
            return Response.json({ document: doc });
        }

        // Fetch file content
        const content = await env.DB.prepare(
            `SELECT data FROM document_content WHERE document_id = ?`
        ).bind(params.docId).first();

        if (!content || !content.data) {
            return Response.json({ error: 'Document content not found' }, { status: 404 });
        }

        // Return as JSON with base64 data (client will decode)
        return Response.json({
            document: doc,
            base64Data: content.data,
        });
    } catch (err) {
        console.error('Get document error:', err);
        return Response.json({ error: 'Failed to retrieve document' }, { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { env, params, data } = context;
    try {
        const project = await data.verifyProjectAccess(params.id);
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        const doc = await env.DB.prepare(
            `SELECT id, original_name FROM documents WHERE id = ? AND project_id = ?`
        ).bind(params.docId, params.id).first();

        if (!doc) {
            return Response.json({ error: 'Document not found' }, { status: 404 });
        }

        // Delete content first (cascade should handle this, but be explicit)
        await env.DB.prepare(`DELETE FROM document_content WHERE document_id = ?`).bind(params.docId).run();
        await env.DB.prepare(`DELETE FROM documents WHERE id = ?`).bind(params.docId).run();

        // Activity log
        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
             VALUES (?, ?, 'delete', 'document', ?, ?)`
        ).bind(params.id, data.user.id, params.docId, `Deleted: ${doc.original_name}`).run();

        return Response.json({ success: true });
    } catch (err) {
        console.error('Delete document error:', err);
        return Response.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
