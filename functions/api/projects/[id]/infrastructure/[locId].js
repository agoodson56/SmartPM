// ═══════════════════════════════════════════════════════════════
// GET    /api/projects/:id/infrastructure/:locId — Full location detail
// PUT    /api/projects/:id/infrastructure/:locId — Update location
// DELETE /api/projects/:id/infrastructure/:locId — Delete location
// POST   /api/projects/:id/infrastructure/:locId — Add item/run/labor (action-based)
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params } = context;
    try {
        const loc = await env.DB.prepare(
            `SELECT * FROM locations WHERE id = ? AND project_id = ?`
        ).bind(params.locId, params.id).first();

        if (!loc) return Response.json({ error: 'Location not found' }, { status: 404 });

        const [itemsRes, runsRes, laborRes] = await Promise.all([
            env.DB.prepare(`SELECT * FROM location_items WHERE location_id = ? ORDER BY category, item_name`).bind(params.locId).all(),
            env.DB.prepare(`SELECT * FROM cable_runs WHERE source_location_id = ? ORDER BY cable_type, destination`).bind(params.locId).all(),
            env.DB.prepare(`SELECT * FROM location_labor WHERE location_id = ? ORDER BY task_type, date_worked DESC`).bind(params.locId).all(),
        ]);

        const items = itemsRes.results || [];
        const runs = runsRes.results || [];
        const labor = laborRes.results || [];

        // Compute summaries
        const budgetedMaterial = items.reduce((s, i) => s + (i.budgeted_cost || 0), 0);
        const actualMaterial = items.reduce((s, i) => s + (i.actual_cost || 0), 0);
        const budgetedCableFt = runs.reduce((s, r) => s + (r.budgeted_qty || 0), 0);
        const installedCableFt = runs.reduce((s, r) => s + (r.installed_qty || 0), 0);
        const budgetedLabor = labor.reduce((s, l) => s + (l.budgeted_hours || 0), 0) +
            runs.reduce((s, r) => s + (r.budgeted_labor_hrs || 0), 0);
        const actualLabor = labor.reduce((s, l) => s + (l.actual_hours || 0), 0) +
            runs.reduce((s, r) => s + (r.actual_labor_hrs || 0), 0);

        return Response.json({
            location: loc,
            items,
            runs,
            labor,
            summary: {
                budgeted_material: budgetedMaterial,
                actual_material: actualMaterial,
                material_variance: actualMaterial - budgetedMaterial,
                material_over: actualMaterial > budgetedMaterial && budgetedMaterial > 0,
                budgeted_cable_ft: budgetedCableFt,
                installed_cable_ft: installedCableFt,
                budgeted_labor: budgetedLabor,
                actual_labor: actualLabor,
                labor_variance: actualLabor - budgetedLabor,
                labor_over: actualLabor > budgetedLabor && budgetedLabor > 0,
            },
        });
    } catch (err) {
        console.error('Get location error:', err);
        return Response.json({ error: 'Failed to load location' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        const action = body.action;
        const id = crypto.randomUUID().replace(/-/g, '');

        if (action === 'add_item') {
            if (!body.item_name || !body.category) {
                return Response.json({ error: 'Item name and category required' }, { status: 400 });
            }
            const budgetedCost = (body.budgeted_qty || 0) * (body.unit_cost || 0);
            await env.DB.prepare(`
              INSERT INTO location_items (id, location_id, project_id, category, item_name, model, unit,
                budgeted_qty, installed_qty, unit_cost, budgeted_cost, actual_cost, status, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                id, params.locId, params.id,
                body.category, body.item_name, body.model || null,
                body.unit || 'ea',
                body.budgeted_qty || 0, body.installed_qty || 0,
                body.unit_cost || 0,
                body.budgeted_cost || budgetedCost,
                body.actual_cost || 0,
                body.status || 'planned',
                body.notes || null,
            ).run();
            return Response.json({ id, success: true }, { status: 201 });
        }

        if (action === 'add_run') {
            if (!body.cable_type || !body.destination) {
                return Response.json({ error: 'Cable type and destination required' }, { status: 400 });
            }
            await env.DB.prepare(`
              INSERT INTO cable_runs (id, source_location_id, project_id, run_label, cable_type,
                destination, destination_floor, pathway, budgeted_qty, installed_qty,
                budgeted_labor_hrs, actual_labor_hrs, status, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                id, params.locId, params.id,
                body.run_label || null,
                body.cable_type,
                body.destination,
                body.destination_floor || null,
                body.pathway || null,
                body.budgeted_qty || 0, body.installed_qty || 0,
                body.budgeted_labor_hrs || 0, body.actual_labor_hrs || 0,
                body.status || 'planned',
                body.notes || null,
            ).run();
            return Response.json({ id, success: true }, { status: 201 });
        }

        if (action === 'add_labor') {
            if (!body.task_type) {
                return Response.json({ error: 'Task type is required' }, { status: 400 });
            }
            await env.DB.prepare(`
              INSERT INTO location_labor (id, location_id, project_id, task_type, description,
                budgeted_hours, actual_hours, worker_count, date_worked, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                id, params.locId, params.id,
                body.task_type,
                body.description || null,
                body.budgeted_hours || 0, body.actual_hours || 0,
                body.worker_count || 1,
                body.date_worked || null,
                body.notes || null,
            ).run();
            return Response.json({ id, success: true }, { status: 201 });
        }

        if (action === 'update_item') {
            if (!body.item_id) return Response.json({ error: 'item_id required' }, { status: 400 });
            const sets = [];
            const vals = [];
            for (const key of ['installed_qty', 'actual_cost', 'status', 'notes', 'budgeted_qty', 'unit_cost', 'budgeted_cost']) {
                if (body[key] !== undefined) { sets.push(`${key} = ?`); vals.push(body[key]); }
            }
            if (sets.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });
            sets.push(`updated_at = datetime('now')`);
            vals.push(body.item_id, params.locId);
            await env.DB.prepare(`UPDATE location_items SET ${sets.join(', ')} WHERE id = ? AND location_id = ?`).bind(...vals).run();
            return Response.json({ success: true });
        }

        if (action === 'update_run') {
            if (!body.run_id) return Response.json({ error: 'run_id required' }, { status: 400 });
            const sets = [];
            const vals = [];
            for (const key of ['installed_qty', 'actual_labor_hrs', 'status', 'notes', 'budgeted_qty', 'budgeted_labor_hrs']) {
                if (body[key] !== undefined) { sets.push(`${key} = ?`); vals.push(body[key]); }
            }
            if (sets.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });
            sets.push(`updated_at = datetime('now')`);
            vals.push(body.run_id, params.locId);
            await env.DB.prepare(`UPDATE cable_runs SET ${sets.join(', ')} WHERE id = ? AND source_location_id = ?`).bind(...vals).run();
            return Response.json({ success: true });
        }

        if (action === 'update_labor') {
            if (!body.labor_id) return Response.json({ error: 'labor_id required' }, { status: 400 });
            const sets = [];
            const vals = [];
            for (const key of ['actual_hours', 'budgeted_hours', 'worker_count', 'notes', 'date_worked']) {
                if (body[key] !== undefined) { sets.push(`${key} = ?`); vals.push(body[key]); }
            }
            if (sets.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });
            sets.push(`updated_at = datetime('now')`);
            vals.push(body.labor_id, params.locId);
            await env.DB.prepare(`UPDATE location_labor SET ${sets.join(', ')} WHERE id = ? AND location_id = ?`).bind(...vals).run();
            return Response.json({ success: true });
        }

        if (action === 'delete_item') {
            if (!body.item_id) return Response.json({ error: 'item_id required' }, { status: 400 });
            await env.DB.prepare(`DELETE FROM location_items WHERE id = ? AND location_id = ?`).bind(body.item_id, params.locId).run();
            return Response.json({ success: true });
        }

        if (action === 'delete_run') {
            if (!body.run_id) return Response.json({ error: 'run_id required' }, { status: 400 });
            await env.DB.prepare(`DELETE FROM cable_runs WHERE id = ? AND source_location_id = ?`).bind(body.run_id, params.locId).run();
            return Response.json({ success: true });
        }

        if (action === 'delete_labor') {
            if (!body.labor_id) return Response.json({ error: 'labor_id required' }, { status: 400 });
            await env.DB.prepare(`DELETE FROM location_labor WHERE id = ? AND location_id = ?`).bind(body.labor_id, params.locId).run();
            return Response.json({ success: true });
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err) {
        console.error('Location action error:', err);
        return Response.json({ error: 'Failed to process action' }, { status: 500 });
    }
}

export async function onRequestPut(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        await env.DB.prepare(`
          UPDATE locations SET name = ?, type = ?, floor = ?, room_number = ?, building = ?,
            description = ?, sort_order = ?, updated_at = datetime('now')
          WHERE id = ? AND project_id = ?
        `).bind(
            body.name, body.type || 'idf',
            body.floor || null, body.room_number || null, body.building || null,
            body.description || null, body.sort_order || 0,
            params.locId, params.id,
        ).run();
        return Response.json({ success: true });
    } catch (err) {
        console.error('Update location error:', err);
        return Response.json({ error: 'Failed to update location' }, { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { env, params, data } = context;
    try {
        await env.DB.prepare(`DELETE FROM locations WHERE id = ? AND project_id = ?`).bind(params.locId, params.id).run();
        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
             VALUES (?, ?, 'delete', 'location', ?, 'Deleted location')`
        ).bind(params.id, data.user.id, params.locId).run();
        return Response.json({ success: true });
    } catch (err) {
        console.error('Delete location error:', err);
        return Response.json({ error: 'Failed to delete location' }, { status: 500 });
    }
}
