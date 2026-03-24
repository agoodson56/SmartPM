// ═══════════════════════════════════════════════════════════════
// GET/POST /api/projects/:id/wbs — Work Breakdown Structure
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
  const { env, params, data } = context;
  const projectId = params.id;

  try {
    // Get all WBS tasks for this project
    const tasks = await env.DB.prepare(`
      SELECT * FROM wbs_tasks WHERE project_id = ? ORDER BY sort_order ASC
    `).bind(projectId).all();

    const allTasks = tasks.results || [];

    // Build tree structure
    const taskMap = {};
    const roots = [];

    for (const t of allTasks) {
      taskMap[t.id] = { ...t, children: [] };
    }
    for (const t of allTasks) {
      if (t.parent_id && taskMap[t.parent_id]) {
        taskMap[t.parent_id].children.push(taskMap[t.id]);
      } else {
        roots.push(taskMap[t.id]);
      }
    }

    // Calculate rollup totals
    const totals = {
      total_tasks: allTasks.length,
      phases: allTasks.filter(t => t.task_type === 'phase').length,
      location_tasks: allTasks.filter(t => t.task_type === 'location_task').length,
      leaf_tasks: allTasks.filter(t => t.task_type === 'task').length,
      budgeted_material: allTasks.filter(t => t.task_type === 'phase').reduce((s, t) => s + (t.budgeted_material || 0), 0),
      budgeted_labor_hrs: allTasks.filter(t => t.task_type === 'phase').reduce((s, t) => s + (t.budgeted_labor_hrs || 0), 0),
      budgeted_total: allTasks.filter(t => t.task_type === 'phase').reduce((s, t) => s + (t.budgeted_total || 0), 0),
      actual_material: allTasks.filter(t => t.task_type === 'phase').reduce((s, t) => s + (t.actual_material || 0), 0),
      actual_labor_hrs: allTasks.filter(t => t.task_type === 'phase').reduce((s, t) => s + (t.actual_labor_hrs || 0), 0),
      actual_total: allTasks.filter(t => t.task_type === 'phase').reduce((s, t) => s + (t.actual_total || 0), 0),
      not_started: allTasks.filter(t => t.status === 'not_started').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      complete: allTasks.filter(t => t.status === 'complete').length,
    };

    // Overall progress: weighted average by budgeted_total
    const totalBudget = allTasks.filter(t => !t.parent_id).reduce((s, t) => s + (t.budgeted_total || 0), 0);
    totals.overall_progress = totalBudget > 0
      ? Math.round(allTasks.filter(t => !t.parent_id).reduce((s, t) => s + (t.progress_pct || 0) * (t.budgeted_total || 0), 0) / totalBudget * 10) / 10
      : 0;

    // Health
    const matPct = totals.budgeted_material > 0 ? (totals.actual_material / totals.budgeted_material) * 100 : 0;
    const labPct = totals.budgeted_labor_hrs > 0 ? (totals.actual_labor_hrs / totals.budgeted_labor_hrs) * 100 : 0;
    totals.material_health = matPct > 100 ? 'red' : matPct >= 80 ? 'yellow' : 'green';
    totals.labor_health = labPct > 100 ? 'red' : labPct >= 80 ? 'yellow' : 'green';
    totals.overall_health = totals.material_health === 'red' || totals.labor_health === 'red' ? 'red'
      : totals.material_health === 'yellow' || totals.labor_health === 'yellow' ? 'yellow' : 'green';

    return Response.json({ tasks: roots, flat: allTasks, totals });
  } catch (err) {
    console.error('WBS GET error:', err);
    return Response.json({ error: 'Failed to load WBS: ' + err.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { env, params, request, data } = context;
  const projectId = params.id;

  try {
    const body = await request.json();
    const id = crypto.randomUUID().replace(/-/g, '');

    await env.DB.prepare(`
      INSERT INTO wbs_tasks (id, project_id, parent_id, location_id, wbs_code, title, description,
        phase, task_type, sort_order,
        budgeted_material, budgeted_labor_hrs, budgeted_labor_cost, budgeted_total,
        planned_start, planned_end, assigned_to, notes, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, 'manual')
    `).bind(
      id, projectId,
      body.parent_id || null,
      body.location_id || null,
      body.wbs_code || 'NEW',
      body.title || 'New Task',
      body.description || null,
      body.phase || null,
      body.task_type || 'task',
      body.sort_order || 0,
      body.budgeted_material || 0,
      body.budgeted_labor_hrs || 0,
      body.budgeted_labor_cost || 0,
      body.budgeted_total || 0,
      body.planned_start || null,
      body.planned_end || null,
      body.assigned_to || null,
      body.notes || null,
    ).run();

    return Response.json({ id, success: true }, { status: 201 });
  } catch (err) {
    console.error('WBS POST error:', err);
    return Response.json({ error: 'Failed to create WBS task: ' + err.message }, { status: 500 });
  }
}
