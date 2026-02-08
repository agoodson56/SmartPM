// ═══════════════════════════════════════════════════════════════
// GET  /api/projects/:id/infrastructure — List locations with summaries
// POST /api/projects/:id/infrastructure — Create location
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
    const { env, params } = context;
    try {
        const locs = await env.DB.prepare(
            `SELECT * FROM locations WHERE project_id = ? ORDER BY sort_order ASC, type ASC, name ASC`
        ).bind(params.id).all();

        const locations = locs.results || [];

        // Build summaries for each location
        const enriched = await Promise.all(locations.map(async (loc) => {
            const [itemsRes, runsRes, laborRes] = await Promise.all([
                env.DB.prepare(`SELECT
                    COUNT(*) as total_items,
                    SUM(budgeted_cost) as budgeted_material,
                    SUM(actual_cost) as actual_material,
                    SUM(CASE WHEN status = 'installed' OR status = 'tested' THEN 1 ELSE 0 END) as installed_items
                  FROM location_items WHERE location_id = ?`).bind(loc.id).first(),
                env.DB.prepare(`SELECT
                    COUNT(*) as total_runs,
                    SUM(budgeted_qty) as budgeted_cable_ft,
                    SUM(installed_qty) as installed_cable_ft,
                    SUM(budgeted_labor_hrs) as budgeted_run_labor,
                    SUM(actual_labor_hrs) as actual_run_labor,
                    SUM(CASE WHEN status IN ('tested','labeled') THEN 1 ELSE 0 END) as complete_runs
                  FROM cable_runs WHERE source_location_id = ?`).bind(loc.id).first(),
                env.DB.prepare(`SELECT
                    SUM(budgeted_hours) as budgeted_labor,
                    SUM(actual_hours) as actual_labor
                  FROM location_labor WHERE location_id = ?`).bind(loc.id).first(),
            ]);

            const budgetedMaterial = itemsRes?.budgeted_material || 0;
            const actualMaterial = itemsRes?.actual_material || 0;
            const budgetedLabor = (laborRes?.budgeted_labor || 0) + (runsRes?.budgeted_run_labor || 0);
            const actualLabor = (laborRes?.actual_labor || 0) + (runsRes?.actual_run_labor || 0);

            return {
                ...loc,
                summary: {
                    total_items: itemsRes?.total_items || 0,
                    installed_items: itemsRes?.installed_items || 0,
                    total_runs: runsRes?.total_runs || 0,
                    complete_runs: runsRes?.complete_runs || 0,
                    budgeted_cable_ft: runsRes?.budgeted_cable_ft || 0,
                    installed_cable_ft: runsRes?.installed_cable_ft || 0,
                    budgeted_material: budgetedMaterial,
                    actual_material: actualMaterial,
                    material_variance: actualMaterial - budgetedMaterial,
                    budgeted_labor: budgetedLabor,
                    actual_labor: actualLabor,
                    labor_variance: actualLabor - budgetedLabor,
                    material_over: actualMaterial > budgetedMaterial && budgetedMaterial > 0,
                    labor_over: actualLabor > budgetedLabor && budgetedLabor > 0,
                },
            };
        }));

        // Project-level totals
        const totals = enriched.reduce((acc, loc) => {
            acc.budgeted_material += loc.summary.budgeted_material;
            acc.actual_material += loc.summary.actual_material;
            acc.budgeted_labor += loc.summary.budgeted_labor;
            acc.actual_labor += loc.summary.actual_labor;
            acc.total_items += loc.summary.total_items;
            acc.installed_items += loc.summary.installed_items;
            acc.total_runs += loc.summary.total_runs;
            acc.complete_runs += loc.summary.complete_runs;
            return acc;
        }, { budgeted_material: 0, actual_material: 0, budgeted_labor: 0, actual_labor: 0, total_items: 0, installed_items: 0, total_runs: 0, complete_runs: 0 });

        const mdfCount = locations.filter(l => l.type === 'mdf').length;
        const idfCount = locations.filter(l => l.type === 'idf').length;
        const trCount = locations.filter(l => l.type === 'tr').length;

        return Response.json({
            locations: enriched,
            totals: {
                ...totals,
                material_variance: totals.actual_material - totals.budgeted_material,
                labor_variance: totals.actual_labor - totals.budgeted_labor,
                material_over: totals.actual_material > totals.budgeted_material && totals.budgeted_material > 0,
                labor_over: totals.actual_labor > totals.budgeted_labor && totals.budgeted_labor > 0,
                mdf_count: mdfCount,
                idf_count: idfCount,
                tr_count: trCount,
            },
        });
    } catch (err) {
        console.error('Get infrastructure error:', err);
        return Response.json({ error: 'Failed to load infrastructure' }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { env, request, params, data } = context;
    try {
        const body = await request.json();
        if (!body.name) {
            return Response.json({ error: 'Location name is required' }, { status: 400 });
        }

        const id = crypto.randomUUID().replace(/-/g, '');
        await env.DB.prepare(`
          INSERT INTO locations (id, project_id, name, type, floor, room_number, building, description, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, params.id,
            body.name,
            body.type || 'idf',
            body.floor || null,
            body.room_number || null,
            body.building || null,
            body.description || null,
            body.sort_order || 0,
        ).run();

        await env.DB.prepare(
            `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
             VALUES (?, ?, 'create', 'location', ?, ?)`
        ).bind(params.id, data.user.id, id, `Added ${(body.type || 'idf').toUpperCase()}: ${body.name}`).run();

        return Response.json({ id, success: true }, { status: 201 });
    } catch (err) {
        console.error('Create location error:', err);
        return Response.json({ error: 'Failed to create location' }, { status: 500 });
    }
}
