// ═══════════════════════════════════════════════════════════════
// PUT/DELETE /api/projects/:id/wbs/:taskId — Update/Delete WBS task
// ═══════════════════════════════════════════════════════════════

export async function onRequestPut(context) {
  const { env, params, request, data } = context;
  const { id: projectId, taskId } = params;

  try {
    const body = await request.json();

    // Build dynamic UPDATE statement based on provided fields
    const fields = [];
    const values = [];

    // PM-editable fields (actuals and progress)
    if (body.actual_material !== undefined) { fields.push('actual_material = ?'); values.push(body.actual_material); }
    if (body.actual_labor_hrs !== undefined) { fields.push('actual_labor_hrs = ?'); values.push(body.actual_labor_hrs); }
    if (body.actual_labor_cost !== undefined) { fields.push('actual_labor_cost = ?'); values.push(body.actual_labor_cost); }
    if (body.actual_equipment !== undefined) { fields.push('actual_equipment = ?'); values.push(body.actual_equipment); }
    if (body.actual_total !== undefined) { fields.push('actual_total = ?'); values.push(body.actual_total); }
    if (body.progress_pct !== undefined) { fields.push('progress_pct = ?'); values.push(Math.min(100, Math.max(0, body.progress_pct))); }
    if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
    if (body.actual_start !== undefined) { fields.push('actual_start = ?'); values.push(body.actual_start); }
    if (body.actual_end !== undefined) { fields.push('actual_end = ?'); values.push(body.actual_end); }
    if (body.assigned_to !== undefined) { fields.push('assigned_to = ?'); values.push(body.assigned_to); }
    if (body.notes !== undefined) { fields.push('notes = ?'); values.push(body.notes); }

    // Admin-only fields (budgets)
    if (body.budgeted_material !== undefined) { fields.push('budgeted_material = ?'); values.push(body.budgeted_material); }
    if (body.budgeted_labor_hrs !== undefined) { fields.push('budgeted_labor_hrs = ?'); values.push(body.budgeted_labor_hrs); }
    if (body.budgeted_labor_cost !== undefined) { fields.push('budgeted_labor_cost = ?'); values.push(body.budgeted_labor_cost); }
    if (body.budgeted_total !== undefined) { fields.push('budgeted_total = ?'); values.push(body.budgeted_total); }
    if (body.planned_start !== undefined) { fields.push('planned_start = ?'); values.push(body.planned_start); }
    if (body.planned_end !== undefined) { fields.push('planned_end = ?'); values.push(body.planned_end); }
    if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
    if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }

    if (fields.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push("updated_at = datetime('now')");
    values.push(taskId);
    values.push(projectId);

    await env.DB.prepare(
      `UPDATE wbs_tasks SET ${fields.join(', ')} WHERE id = ? AND project_id = ?`
    ).bind(...values).run();

    // Auto-update parent progress when a child is updated
    if (body.progress_pct !== undefined || body.status !== undefined) {
      const task = await env.DB.prepare(
        `SELECT parent_id FROM wbs_tasks WHERE id = ? AND project_id = ?`
      ).bind(taskId, projectId).first();

      if (task && task.parent_id) {
        // Calculate parent's progress as weighted average of children
        const siblings = await env.DB.prepare(
          `SELECT progress_pct, budgeted_total FROM wbs_tasks WHERE parent_id = ? AND project_id = ?`
        ).bind(task.parent_id, projectId).all();

        const children = siblings.results || [];
        const totalWeight = children.reduce((s, c) => s + (c.budgeted_total || 1), 0);
        const weightedPct = totalWeight > 0
          ? children.reduce((s, c) => s + (c.progress_pct || 0) * (c.budgeted_total || 1), 0) / totalWeight
          : 0;

        // Determine parent status
        const allComplete = children.every(c => c.progress_pct >= 100);
        const anyStarted = children.some(c => c.progress_pct > 0);
        const parentStatus = allComplete ? 'complete' : anyStarted ? 'in_progress' : 'not_started';

        await env.DB.prepare(
          `UPDATE wbs_tasks SET progress_pct = ?, status = ?, updated_at = datetime('now') WHERE id = ? AND project_id = ?`
        ).bind(
          Math.round(weightedPct * 10) / 10,
          parentStatus,
          task.parent_id,
          projectId,
        ).run();

        // Also propagate to grandparent (phase level)
        const parent = await env.DB.prepare(
          `SELECT parent_id FROM wbs_tasks WHERE id = ? AND project_id = ?`
        ).bind(task.parent_id, projectId).first();

        if (parent && parent.parent_id) {
          const uncles = await env.DB.prepare(
            `SELECT progress_pct, budgeted_total FROM wbs_tasks WHERE parent_id = ? AND project_id = ?`
          ).bind(parent.parent_id, projectId).all();

          const uncleChildren = uncles.results || [];
          const uncleWeight = uncleChildren.reduce((s, c) => s + (c.budgeted_total || 1), 0);
          const unclePct = uncleWeight > 0
            ? uncleChildren.reduce((s, c) => s + (c.progress_pct || 0) * (c.budgeted_total || 1), 0) / uncleWeight
            : 0;
          const allDone = uncleChildren.every(c => (c.progress_pct || 0) >= 100);
          const anyDoing = uncleChildren.some(c => (c.progress_pct || 0) > 0);

          await env.DB.prepare(
            `UPDATE wbs_tasks SET progress_pct = ?, status = ?, updated_at = datetime('now') WHERE id = ? AND project_id = ?`
          ).bind(
            Math.round(unclePct * 10) / 10,
            allDone ? 'complete' : anyDoing ? 'in_progress' : 'not_started',
            parent.parent_id,
            projectId,
          ).run();
        }
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('WBS PUT error:', err);
    return Response.json({ error: 'Failed to update task: ' + err.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, params, data } = context;
  const { id: projectId, taskId } = params;

  try {
    // Delete the task (CASCADE will delete children)
    await env.DB.prepare(
      `DELETE FROM wbs_tasks WHERE id = ? AND project_id = ?`
    ).bind(taskId, projectId).run();

    return Response.json({ success: true });
  } catch (err) {
    console.error('WBS DELETE error:', err);
    return Response.json({ error: 'Failed to delete task: ' + err.message }, { status: 500 });
  }
}
