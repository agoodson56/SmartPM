// ═══════════════════════════════════════════════════════════════
// SMARTPM — MODULE IMPLEMENTATIONS
// Full UI for all project management modules
// ═══════════════════════════════════════════════════════════════

// ─── WBS (Work Breakdown Structure) ────────────────────────────
// Auto-generated from SmartPlans bid — PM tracks progress by location/phase
App.renderWBS = async function (c) {
  const canBudget = this.Permissions.can('canEditInfraBudget');
  const canEdit = this.Permissions.can('canEditMaterialLabor');
  c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📐 Work Breakdown Structure</h1><p class="page-subtitle">Track every phase, location, and task from the original bid</p></div><div class="page-actions">${canBudget ? '<button class="btn btn-primary" id="btn-add-wbs">+ Add Task</button>' : ''}</div></div><div id="wbs-totals" class="metric-grid" style="margin-bottom:20px;"></div><div id="wbs-filter" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;"></div><div id="wbs-content"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-title">Loading WBS...</div></div></div>`;
  const pid = this.state.projectId;
  const res = await API.getWBS(pid);
  if (res.error) { this.toast(res.error, 'error'); return; }
  const tasks = res.tasks || [];
  const t = res.totals || {};

  // Render totals with traffic lights
  const overH = t.overall_health || 'green';
  const matH = t.material_health || 'green';
  const labH = t.labor_health || 'green';
  const overProg = t.overall_progress || 0;
  document.getElementById('wbs-totals').innerHTML = `
    <div class="metric-card ${healthCardClass(overH)}"><div class="metric-icon">${trafficLight(overH)}</div><div class="metric-value" style="font-size:22px;">${overH === 'green' ? 'ON TRACK' : overH === 'yellow' ? 'CAUTION' : 'OVER BUDGET'}</div><div class="metric-label">Project Health</div></div>
    <div class="metric-card metric-card--sky"><div class="metric-icon">📐</div><div class="metric-value">${t.total_tasks || 0}</div><div class="metric-label">Total WBS Tasks</div></div>
    <div class="metric-card metric-card--indigo"><div class="metric-icon">📊</div><div class="metric-value">${overProg.toFixed(1)}%</div><div class="metric-label">Overall Progress</div></div>
    <div class="metric-card ${healthCardClass(matH)}"><div class="metric-icon">${trafficLight(matH)}</div><div class="metric-value">$${formatMoney(t.actual_material)} / $${formatMoney(t.budgeted_material)}</div><div class="metric-label">Material Budget 🔒</div></div>
    <div class="metric-card ${healthCardClass(labH)}"><div class="metric-icon">${trafficLight(labH)}</div><div class="metric-value">${(t.actual_labor_hrs || 0).toFixed(1)} / ${(t.budgeted_labor_hrs || 0).toFixed(1)} hrs</div><div class="metric-label">Labor Budget 🔒</div></div>
    <div class="metric-card metric-card--emerald"><div class="metric-icon">✅</div><div class="metric-value">${t.complete || 0} / ${t.total_tasks || 0}</div><div class="metric-label">Tasks Complete</div></div>`;

  // Overall progress bar
  const progBar = document.createElement('div');
  progBar.innerHTML = `<div class="progress-bar" style="margin-bottom:20px;height:10px;"><div class="progress-fill" style="width:${Math.min(overProg, 100)}%;${overH === 'red' ? 'background:var(--error)' : overH === 'yellow' ? 'background:var(--warning)' : ''}"></div></div>`;
  document.getElementById('wbs-totals').after(progBar);

  // Filter buttons
  document.getElementById('wbs-filter').innerHTML = `
    <button class="btn btn-sm wbs-filter-btn active" data-filter="all">All Phases</button>
    <button class="btn btn-sm wbs-filter-btn" data-filter="rough-in">Rough-In</button>
    <button class="btn btn-sm wbs-filter-btn" data-filter="trim-out">Trim-Out</button>
    <button class="btn btn-sm wbs-filter-btn" data-filter="termination">Term & Test</button>
    <button class="btn btn-sm wbs-filter-btn" data-filter="closeout">Closeout</button>
    <span style="flex:1;"></span>
    <span style="font-size:12px;color:var(--text-muted);align-self:center;">${t.not_started || 0} not started · ${t.in_progress || 0} in progress · ${t.complete || 0} complete</span>`;

  const content = document.getElementById('wbs-content');
  if (tasks.length === 0) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📐</div><div class="empty-state-title">No WBS Tasks</div><div class="empty-state-desc">${canBudget ? 'Add tasks manually or import a SmartPlans estimate to auto-generate a WBS.' : 'WBS is auto-generated when a SmartPlans estimate is imported by an Admin/Ops Mgr.'}</div></div>`;
  } else {
    content.innerHTML = tasks.map(phase => this._renderWBSPhase(phase, canEdit, canBudget)).join('');
  }

  // Phase filter logic
  document.querySelectorAll('.wbs-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wbs-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.wbs-phase-card').forEach(card => {
        if (filter === 'all') { card.style.display = ''; }
        else { card.style.display = card.dataset.phase && card.dataset.phase.includes(filter.replace('-', '_')) ? '' : 'none'; }
      });
    });
  });

  // Expand/collapse logic
  document.querySelectorAll('.wbs-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = document.getElementById(btn.dataset.target);
      if (target) {
        const isHidden = target.style.display === 'none';
        target.style.display = isHidden ? '' : 'none';
        btn.textContent = isHidden ? '▼' : '▶';
      }
    });
  });

  // Add task button
  const addBtn = document.getElementById('btn-add-wbs');
  if (addBtn) addBtn.addEventListener('click', () => this.addWBSTask());
};

App._renderWBSPhase = function (phase, canEdit, canBudget) {
  const s = phase;
  const pPct = s.progress_pct || 0;
  const statClass = s.status === 'complete' ? 'active' : s.status === 'in_progress' ? 'amber' : 'draft';
  const matUsed = s.budgeted_material > 0 ? ((s.actual_material / s.budgeted_material) * 100).toFixed(0) : 0;
  const labUsed = s.budgeted_labor_hrs > 0 ? ((s.actual_labor_hrs / s.budgeted_labor_hrs) * 100).toFixed(0) : 0;

  const phaseMatH = localHealth(s.actual_material, s.budgeted_material);
  const phaseLabH = localHealth(s.actual_labor_hrs, s.budgeted_labor_hrs);
  const phaseH = phaseMatH === 'red' || phaseLabH === 'red' ? 'red' : phaseMatH === 'yellow' || phaseLabH === 'yellow' ? 'yellow' : 'green';

  let html = `<div class="card wbs-phase-card" data-phase="${esc(s.phase || '')}" style="margin-bottom:16px;border-left:4px solid ${healthColor(phaseH)};">`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="document.querySelector('[data-target=\\'wbs-children-${s.id}\\']').click()">`;
  html += `<div style="display:flex;align-items:center;gap:10px;">`;
  html += `<button class="wbs-toggle" data-target="wbs-children-${s.id}" style="background:none;border:none;font-size:14px;cursor:pointer;color:var(--text-secondary);padding:4px;">▼</button>`;
  html += `<span style="font-size:18px;">${trafficLight(phaseH)}</span>`;
  html += `<div><div style="font-weight:700;font-size:16px;">${esc(s.wbs_code)}. ${esc(s.title)}</div>`;
  html += `<div style="font-size:12px;color:var(--text-muted);">${esc(s.description || '')} · ${(s.children || []).length} locations</div></div>`;
  html += `</div>`;
  html += `<div style="display:flex;align-items:center;gap:12px;">`;
  html += `<div style="text-align:right;"><div style="font-size:20px;font-weight:700;">${pPct.toFixed(0)}%</div><div class="progress-bar" style="height:6px;width:80px;"><div class="progress-fill" style="width:${Math.min(pPct, 100)}%;${progressColor(phaseH)}"></div></div></div>`;
  html += `<span class="badge badge--${statClass}">${esc(formatStatus(s.status))}</span>`;
  html += `</div></div>`;

  // Phase budget summary row
  html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:12px;margin:12px 0 8px 32px;">`;
  html += `<div><div style="color:var(--text-muted);">Material ${trafficLight(phaseMatH)} 🔒</div><div style="font-weight:600;color:${healthColor(phaseMatH)}">$${formatMoney(s.actual_material)} / $${formatMoney(s.budgeted_material)} (${matUsed}%)</div></div>`;
  html += `<div><div style="color:var(--text-muted);">Labor ${trafficLight(phaseLabH)} 🔒</div><div style="font-weight:600;color:${healthColor(phaseLabH)}">${(s.actual_labor_hrs || 0).toFixed(1)} / ${(s.budgeted_labor_hrs || 0).toFixed(1)} hrs (${labUsed}%)</div></div>`;
  html += `<div><div style="color:var(--text-muted);">Budget Total 🔒</div><div style="font-weight:600;">$${formatMoney(s.budgeted_total)}</div></div>`;
  html += `<div><div style="color:var(--text-muted);">Actual Spend</div><div style="font-weight:600;color:${healthColor(phaseH)}">$${formatMoney(s.actual_total)}</div></div>`;
  html += `</div>`;

  // Children (location tasks)
  html += `<div id="wbs-children-${s.id}" style="margin-left:16px;">`;
  if (s.children && s.children.length > 0) {
    html += `<table class="data-table" style="margin-top:8px;"><thead><tr>`;
    html += `<th style="width:30px;"></th><th>WBS</th><th>Task</th><th style="text-align:right;">Material 🔒</th><th style="text-align:right;">Labor 🔒</th><th style="text-align:right;">Installed</th><th style="text-align:right;">Hrs Used</th><th style="text-align:right;">Progress</th><th>Status</th>`;
    if (canEdit) html += `<th></th>`;
    html += `</tr></thead><tbody>`;

    for (const locTask of s.children) {
      const ltH = localHealth(locTask.actual_material, locTask.budgeted_material);
      const ltLabH = localHealth(locTask.actual_labor_hrs, locTask.budgeted_labor_hrs);
      const ltOverH = ltH === 'red' || ltLabH === 'red' ? 'red' : ltH === 'yellow' || ltLabH === 'yellow' ? 'yellow' : 'green';
      const ltPct = locTask.progress_pct || 0;

      // Location task row (expandable)
      html += `<tr style="background:var(--bg-hover);cursor:pointer;" onclick="document.querySelector('[data-target=\\'wbs-sub-${locTask.id}\\']')?.click()">`;
      html += `<td><button class="wbs-toggle" data-target="wbs-sub-${locTask.id}" style="background:none;border:none;font-size:12px;cursor:pointer;color:var(--text-secondary);padding:2px;">${locTask.children && locTask.children.length > 0 ? '▼' : '·'}</button></td>`;
      html += `<td style="font-weight:600;">${esc(locTask.wbs_code)}</td>`;
      html += `<td><div style="font-weight:600;">${trafficLight(ltOverH)} ${esc(locTask.title)}</div></td>`;
      html += `<td style="text-align:right;color:${healthColor(ltH)}">${trafficLight(ltH)} $${formatMoney(locTask.actual_material)} / $${formatMoney(locTask.budgeted_material)}</td>`;
      html += `<td style="text-align:right;">${(locTask.budgeted_labor_hrs || 0).toFixed(1)} hrs</td>`;
      html += `<td style="text-align:right;font-weight:600;">${locTask.actual_qty_installed || 0} ${esc(locTask.unit || 'ea')}</td>`;
      html += `<td style="text-align:right;color:${healthColor(ltLabH)};font-weight:600;">${trafficLight(ltLabH)} ${(locTask.actual_labor_hrs || 0).toFixed(1)} / ${(locTask.budgeted_labor_hrs || 0).toFixed(1)}</td>`;
      html += `<td style="text-align:right;"><div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;"><div class="progress-bar" style="height:5px;width:60px;"><div class="progress-fill" style="width:${Math.min(ltPct, 100)}%;${progressColor(ltOverH)}"></div></div><span style="font-weight:600;font-size:12px;">${ltPct.toFixed(0)}%</span></div></td>`;
      html += `<td><span class="badge badge--${locTask.status === 'complete' ? 'active' : locTask.status === 'in_progress' ? 'amber' : 'draft'}">${esc(formatStatus(locTask.status))}</span></td>`;
      if (canEdit) html += `<td><button class="btn-icon" onclick="event.stopPropagation(); App.editWBSTask('${locTask.id}')">✏️</button></td>`;
      html += `</tr>`;

      // Sub-tasks (leaf tasks)
      if (locTask.children && locTask.children.length > 0) {
        html += `<tr id="wbs-sub-${locTask.id}"><td colspan="${canEdit ? 10 : 9}" style="padding:0;">`;
        html += `<table class="data-table" style="margin:0;border:none;"><tbody>`;
        for (const task of locTask.children) {
          const tH = localHealth(task.actual_material, task.budgeted_material);
          const tPct = task.progress_pct || 0;
          html += `<tr>`;
          html += `<td style="width:30px;padding-left:40px;"></td>`;
          html += `<td style="font-size:12px;color:var(--text-muted);">${esc(task.wbs_code)}</td>`;
          html += `<td style="font-size:13px;">${esc(task.title)}</td>`;
          html += `<td style="text-align:right;font-size:12px;">$${formatMoney(task.budgeted_material)}</td>`;
          html += `<td style="text-align:right;font-size:12px;">${(task.budgeted_labor_hrs || 0).toFixed(1)} hrs</td>`;
          html += `<td style="text-align:right;font-size:12px;font-weight:600;">${task.actual_qty_installed || 0} ${esc(task.unit || 'ea')}</td>`;
          html += `<td style="text-align:right;font-size:12px;font-weight:600;color:${healthColor(tH)}">${(task.actual_labor_hrs || 0).toFixed(1)}</td>`;
          html += `<td style="text-align:right;"><div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;"><div class="progress-bar" style="height:4px;width:50px;"><div class="progress-fill" style="width:${Math.min(tPct, 100)}%"></div></div><span style="font-size:11px;">${tPct.toFixed(0)}%</span></div></td>`;
          html += `<td><span class="badge badge--${task.status === 'complete' ? 'active' : task.status === 'in_progress' ? 'amber' : 'draft'}" style="font-size:10px;">${esc(formatStatus(task.status))}</span></td>`;
          if (canEdit) html += `<td><button class="btn-icon" onclick="event.stopPropagation(); App.editWBSTask('${task.id}')" style="font-size:12px;">✏️</button></td>`;
          html += `</tr>`;
        }
        html += `</tbody></table></td></tr>`;
      }
    }
    html += `</tbody></table>`;
  }
  html += `</div></div>`;
  return html;
};

// ── Edit WBS Task Modal ─────────────────────────────────────
App.editWBSTask = async function (taskId) {
  const pid = this.state.projectId;
  const res = await API.getWBS(pid);
  if (res.error) { this.toast(res.error, 'error'); return; }
  const task = (res.flat || []).find(t => t.id === taskId);
  if (!task) { this.toast('Task not found', 'error'); return; }
  const canBudget = this.Permissions.can('canEditInfraBudget');

  this.showModal(`Update Task: ${esc(task.title)}`, `<div class="form-grid">
    <div class="form-group form-full"><label class="form-label">Task</label><div style="font-weight:600;padding:8px 0;">${esc(task.wbs_code)} — ${esc(task.title)}</div></div>

    <div class="form-group form-full"><div style="padding:12px 16px;background:var(--bg-card);border-radius:8px;border:2px solid rgba(191,144,0,0.5);margin-bottom:4px;">
      <div style="font-weight:700;font-size:13px;color:var(--primary);margin-bottom:8px;">📊 Estimated from Bid (Read-Only)</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-size:13px;">
        <div><div style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Material Cost</div><div style="font-weight:700;font-size:16px;">$${formatMoney(task.budgeted_material)}</div></div>
        <div><div style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Labor Hours</div><div style="font-weight:700;font-size:16px;">${(task.budgeted_labor_hrs || 0).toFixed(1)} hrs</div></div>
        <div><div style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Total Budget</div><div style="font-weight:700;font-size:16px;">$${formatMoney(task.budgeted_total)}</div></div>
      </div>
    </div></div>

    <div class="form-group form-full"><div style="padding:10px 16px;background:rgba(13,148,136,0.04);border-radius:8px;border:1px solid rgba(13,148,136,0.2);font-size:13px;">
      <div style="font-weight:700;color:var(--primary);margin-bottom:6px;">✏️ Actual Progress — What was installed?</div>
      <div style="color:var(--text-secondary);font-size:12px;">Enter how much material was physically installed (in feet or each) and how many labor hours were spent. You do NOT need to enter costs.</div>
    </div></div>

    <div class="form-group"><label class="form-label">Qty Installed (ft or ea)</label><input class="form-input" id="wt-aqty" type="number" step="1" value="${task.actual_qty_installed || 0}" placeholder="e.g., 500 ft or 24 ea"></div>
    <div class="form-group"><label class="form-label">Unit</label><select class="form-select" id="wt-unit"><option value="ft" ${(task.unit || 'ea') === 'ft' ? 'selected' : ''}>Feet (ft)</option><option value="ea" ${(task.unit || 'ea') === 'ea' ? 'selected' : ''}>Each (ea)</option><option value="lot" ${(task.unit || '') === 'lot' ? 'selected' : ''}>Lot</option><option value="box" ${(task.unit || '') === 'box' ? 'selected' : ''}>Box</option></select></div>
    <div class="form-group"><label class="form-label">Actual Labor Hours</label><input class="form-input" id="wt-alhr" type="number" step="0.5" value="${task.actual_labor_hrs || 0}"></div>
    <div class="form-group"><label class="form-label">Progress %</label><div style="display:flex;align-items:center;gap:10px;"><input class="form-input" id="wt-pct" type="range" min="0" max="100" step="5" value="${task.progress_pct || 0}" style="flex:1;" oninput="document.getElementById('wt-pct-val').textContent=this.value+'%'"><span id="wt-pct-val" style="font-weight:700;min-width:40px;">${(task.progress_pct || 0).toFixed(0)}%</span></div></div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="wt-status"><option value="not_started" ${task.status === 'not_started' ? 'selected' : ''}>Not Started</option><option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option><option value="on_hold" ${task.status === 'on_hold' ? 'selected' : ''}>On Hold</option><option value="complete" ${task.status === 'complete' ? 'selected' : ''}>Complete</option></select></div>
    <div class="form-group"><label class="form-label">Actual Start</label><input class="form-input" id="wt-astart" type="date" value="${task.actual_start || ''}"></div>
    <div class="form-group"><label class="form-label">Actual End</label><input class="form-input" id="wt-aend" type="date" value="${task.actual_end || ''}"></div>
    <div class="form-group"><label class="form-label">Assigned To</label><input class="form-input" id="wt-assign" value="${esc(task.assigned_to || '')}"></div>
    <div class="form-group form-full"><label class="form-label">Notes</label><textarea class="form-input" id="wt-notes" rows="2">${esc(task.notes || '')}</textarea></div>
  </div>`, async () => {
    const pct = parseFloat(document.getElementById('wt-pct').value) || 0;
    const status = document.getElementById('wt-status').value;
    const actualQty = parseFloat(document.getElementById('wt-aqty').value) || 0;
    const actualLhr = parseFloat(document.getElementById('wt-alhr').value) || 0;
    const unit = document.getElementById('wt-unit').value;

    // Auto-calculate actual costs from qty (PM enters qty, system uses budgeted unit cost)
    const budgetedQty = task.budgeted_qty || 1;
    const unitCost = budgetedQty > 0 ? (task.budgeted_material / budgetedQty) : 0;
    const actualMat = actualQty * unitCost;
    const avgRate = 45; // default labor rate
    const actualLabCost = actualLhr * avgRate;
    const actualTotal = actualMat + actualLabCost;

    const r = await API.updateWBSTask(pid, taskId, {
      progress_pct: pct,
      status: status,
      actual_material: actualMat,
      actual_labor_hrs: actualLhr,
      actual_labor_cost: actualLabCost,
      actual_total: actualTotal,
      actual_qty_installed: actualQty,
      unit: unit,
      actual_start: document.getElementById('wt-astart').value || null,
      actual_end: document.getElementById('wt-aend').value || null,
      assigned_to: document.getElementById('wt-assign').value.trim(),
      notes: document.getElementById('wt-notes').value,
    });
    if (r.error) { this.toast(r.error, 'error'); return; }
    this.closeModal();
    this.toast('Task updated — progress auto-rolls up to phase', 'success');
    this.renderWBS(document.getElementById('project-content'));
  });
};

// ── Add WBS Task (Admin) ────────────────────────────────────
App.addWBSTask = async function () {
  if (!this.Permissions.can('canEditInfraBudget')) { this.toast('Only Admin/Ops Mgr can add WBS tasks', 'warning'); return; }
  const pid = this.state.projectId;

  // Get phases for parent selection
  const res = await API.getWBS(pid);
  const phases = (res.tasks || []);
  let parentOptions = '<option value="">Top Level (Phase)</option>';
  for (const p of phases) {
    parentOptions += `<option value="${p.id}">${esc(p.wbs_code)} — ${esc(p.title)}</option>`;
    for (const lt of (p.children || [])) {
      parentOptions += `<option value="${lt.id}">&nbsp;&nbsp;${esc(lt.wbs_code)} — ${esc(lt.title)}</option>`;
    }
  }

  this.showModal('Add WBS Task', `<div class="form-grid">
    <div class="form-group"><label class="form-label">Parent Task</label><select class="form-select" id="wn-parent">${parentOptions}</select></div>
    <div class="form-group"><label class="form-label">WBS Code *</label><input class="form-input" id="wn-code" placeholder="e.g. 2.3.1"></div>
    <div class="form-group form-full"><label class="form-label">Title *</label><input class="form-input" id="wn-title" placeholder="Task title"></div>
    <div class="form-group"><label class="form-label">Task Type</label><select class="form-select" id="wn-type"><option value="phase">Phase</option><option value="location_task">Location Task</option><option value="task" selected>Task</option></select></div>
    <div class="form-group"><label class="form-label">Phase</label><select class="form-select" id="wn-phase"><option value="rough-in">Rough-In</option><option value="trim-out">Trim-Out</option><option value="termination">Termination & Testing</option><option value="closeout">Closeout</option></select></div>
    <div class="form-group"><label class="form-label">Budgeted Material ($)</label><input class="form-input" id="wn-bmat" type="number" step="0.01" value="0"></div>
    <div class="form-group"><label class="form-label">Budgeted Labor (hrs)</label><input class="form-input" id="wn-blhr" type="number" step="0.5" value="0"></div>
    <div class="form-group form-full"><label class="form-label">Description</label><textarea class="form-input" id="wn-desc" rows="2"></textarea></div>
  </div>`, async () => {
    const code = document.getElementById('wn-code').value.trim();
    const title = document.getElementById('wn-title').value.trim();
    if (!code || !title) { this.toast('WBS code and title required', 'warning'); return; }
    const bMat = parseFloat(document.getElementById('wn-bmat').value) || 0;
    const bLhr = parseFloat(document.getElementById('wn-blhr').value) || 0;
    const r = await API.createWBSTask(pid, {
      parent_id: document.getElementById('wn-parent').value || null,
      wbs_code: code,
      title: title,
      description: document.getElementById('wn-desc').value,
      task_type: document.getElementById('wn-type').value,
      phase: document.getElementById('wn-phase').value,
      budgeted_material: bMat,
      budgeted_labor_hrs: bLhr,
      budgeted_labor_cost: bLhr * 45,
      budgeted_total: bMat + (bLhr * 45),
    });
    if (r.error) { this.toast(r.error, 'error'); return; }
    this.closeModal();
    this.toast('WBS task created', 'success');
    this.renderWBS(document.getElementById('project-content'));
  });
};


// ─── SOV (Schedule of Values) — AIA G703 ──────────────────────
App.renderSOV = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📋 Schedule of Values</h1><p class="page-subtitle">AIA G703 line items for progress billing</p></div><div class="page-actions">${AIAssistant.renderAIButton('sov-validate', this.state.projectId)}<button class="btn btn-primary" id="btn-add-sov">+ Add Line Item</button></div></div><div id="sov-balance" class="metric-grid" style="margin-bottom:20px;"></div><div class="card"><table class="data-table" id="sov-table"><thead><tr><th style="width:60px">Item #</th><th style="width:25%">Description</th><th style="text-align:right;width:10%">Scheduled Value</th><th style="text-align:right;width:9%">Material</th><th style="text-align:right;width:9%">Labor</th><th style="text-align:right;width:7%">% Complete</th><th style="text-align:right;width:10%">Prev. Billed</th><th style="text-align:right;width:9%">This Period</th><th style="text-align:right;width:10%">Balance</th><th style="width:70px">Actions</th></tr></thead><tbody id="sov-body"><tr><td colspan="10" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
    const pid = this.state.projectId;
    const res = await API.getSOV(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const items = res.items || [];
    const bal = res.balance || {};
    document.getElementById('sov-balance').innerHTML = `
    <div class="metric-card metric-card--sky"><div class="metric-icon">📋</div><div class="metric-value">$${formatMoney(bal.totalScheduled)}</div><div class="metric-label">Total Scheduled</div></div>
    <div class="metric-card metric-card--emerald"><div class="metric-icon">💰</div><div class="metric-value">$${formatMoney(bal.contractValue)}</div><div class="metric-label">Contract Value</div></div>
    <div class="metric-card ${bal.balanced ? 'metric-card--emerald' : 'metric-card--rose'}"><div class="metric-icon">${bal.balanced ? '✅' : '⚠️'}</div><div class="metric-value">$${formatMoney(Math.abs(bal.difference))}</div><div class="metric-label">${bal.balanced ? 'Balanced' : 'Difference'}</div></div>`;
    const tbody = document.getElementById('sov-body');

    // Helper to recalculate a single row's derived cells and update summary
    const _sovRecalcRow = (idx) => {
        const item = items[idx];
        const scheduled = item.scheduled_value || 0;
        const prevBilled = item.total_completed_value || 0;
        const pctInput = document.querySelector(`[data-sov-line="${idx}"][data-sov-field="pct"]`);
        const curPct = parseFloat(pctInput ? pctInput.value : (item.total_completed_pct || 0)) || 0;
        const thisPeriod = (curPct / 100 * scheduled) - prevBilled;
        const balance = scheduled - prevBilled - thisPeriod;
        const tpCell = document.querySelector(`[data-sov-line="${idx}"][data-sov-field="this-period"]`);
        const balCell = document.querySelector(`[data-sov-line="${idx}"][data-sov-field="balance"]`);
        if (tpCell) tpCell.textContent = '$' + formatMoney(thisPeriod);
        if (balCell) balCell.textContent = '$' + formatMoney(balance);
    };

    const _sovRecalcTotals = () => {
        let sumScheduled = 0, sumMaterial = 0, sumLabor = 0, sumPrevBilled = 0, sumThisPeriod = 0, sumBalance = 0;
        let weightedPctNumerator = 0;
        items.forEach((item, idx) => {
            const scheduled = item.scheduled_value || 0;
            const material = item.material_cost || 0;
            const labor = scheduled - material;
            const prevBilled = item.total_completed_value || 0;
            const pctInput = document.querySelector(`[data-sov-line="${idx}"][data-sov-field="pct"]`);
            const curPct = parseFloat(pctInput ? pctInput.value : (item.total_completed_pct || 0)) || 0;
            const thisPeriod = (curPct / 100 * scheduled) - prevBilled;
            const balance = scheduled - prevBilled - thisPeriod;
            sumScheduled += scheduled;
            sumMaterial += material;
            sumLabor += labor;
            sumPrevBilled += prevBilled;
            sumThisPeriod += thisPeriod;
            sumBalance += balance;
            weightedPctNumerator += curPct * scheduled;
        });
        const weightedPct = sumScheduled > 0 ? weightedPctNumerator / sumScheduled : 0;
        const totRow = document.getElementById('sov-totals-row');
        if (totRow) {
            totRow.querySelector('[data-sov-total="scheduled"]').textContent = '$' + formatMoney(sumScheduled);
            totRow.querySelector('[data-sov-total="material"]').textContent = '$' + formatMoney(sumMaterial);
            totRow.querySelector('[data-sov-total="labor"]').textContent = '$' + formatMoney(sumLabor);
            totRow.querySelector('[data-sov-total="pct"]').textContent = weightedPct.toFixed(1) + '%';
            totRow.querySelector('[data-sov-total="prev-billed"]').textContent = '$' + formatMoney(sumPrevBilled);
            totRow.querySelector('[data-sov-total="this-period"]').textContent = '$' + formatMoney(sumThisPeriod);
            totRow.querySelector('[data-sov-total="balance"]').textContent = '$' + formatMoney(sumBalance);
        }
    };

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:var(--text-muted)">No SOV items yet. Add line items or import from SmartPlans.</td></tr>`;
    } else {
        tbody.innerHTML = items.map((i, idx) => {
            const scheduled = i.scheduled_value || 0;
            const material = i.material_cost || 0;
            const labor = scheduled - material;
            const curPct = i.total_completed_pct || 0;
            const prevBilled = i.total_completed_value || 0;
            const thisPeriod = (curPct / 100 * scheduled) - prevBilled;
            const balance = scheduled - prevBilled - thisPeriod;
            return `<tr>` +
                `<td><strong>${esc(i.item_number)}</strong></td>` +
                `<td>${esc(i.description)}</td>` +
                `<td style="text-align:right">$${formatMoney(scheduled)}</td>` +
                `<td style="text-align:right">$${formatMoney(material)}</td>` +
                `<td style="text-align:right">$${formatMoney(labor)}</td>` +
                `<td style="text-align:right"><input class="form-input" style="width:72px;text-align:right;padding:4px 6px;" type="number" step="0.1" min="0" max="100" data-sov-line="${idx}" data-sov-field="pct" data-sov-id="${i.id}" value="${curPct.toFixed(1)}"></td>` +
                `<td style="text-align:right">$${formatMoney(prevBilled)}</td>` +
                `<td style="text-align:right" data-sov-line="${idx}" data-sov-field="this-period">$${formatMoney(thisPeriod)}</td>` +
                `<td style="text-align:right" data-sov-line="${idx}" data-sov-field="balance">$${formatMoney(balance)}</td>` +
                `<td><button class="btn-icon" onclick="App.editSOVItem('${i.id}')">✏️</button><button class="btn-icon" onclick="App.deleteSOVItem('${i.id}')">🗑️</button></td></tr>`;
        }).join('');

        // Compute initial totals for summary row
        let sumScheduled = 0, sumMaterial = 0, sumLabor = 0, sumPrevBilled = 0, sumThisPeriod = 0, sumBalance = 0, weightedPctNum = 0;
        items.forEach(i => {
            const scheduled = i.scheduled_value || 0;
            const material = i.material_cost || 0;
            const curPct = i.total_completed_pct || 0;
            const prevBilled = i.total_completed_value || 0;
            const thisPeriod = (curPct / 100 * scheduled) - prevBilled;
            const balance = scheduled - prevBilled - thisPeriod;
            sumScheduled += scheduled;
            sumMaterial += material;
            sumLabor += (scheduled - material);
            sumPrevBilled += prevBilled;
            sumThisPeriod += thisPeriod;
            sumBalance += balance;
            weightedPctNum += curPct * scheduled;
        });
        const weightedPct = sumScheduled > 0 ? weightedPctNum / sumScheduled : 0;
        tbody.innerHTML += `<tr id="sov-totals-row" style="font-weight:700;background:var(--bg-secondary);">` +
            `<td colspan="2">TOTALS</td>` +
            `<td style="text-align:right" data-sov-total="scheduled">$${formatMoney(sumScheduled)}</td>` +
            `<td style="text-align:right" data-sov-total="material">$${formatMoney(sumMaterial)}</td>` +
            `<td style="text-align:right" data-sov-total="labor">$${formatMoney(sumLabor)}</td>` +
            `<td style="text-align:right" data-sov-total="pct">${weightedPct.toFixed(1)}%</td>` +
            `<td style="text-align:right" data-sov-total="prev-billed">$${formatMoney(sumPrevBilled)}</td>` +
            `<td style="text-align:right" data-sov-total="this-period">$${formatMoney(sumThisPeriod)}</td>` +
            `<td style="text-align:right" data-sov-total="balance">$${formatMoney(sumBalance)}</td>` +
            `<td></td></tr>`;

        // Attach live-recalc and auto-save to % inputs
        document.querySelectorAll('[data-sov-field="pct"]').forEach(input => {
            let saveTimer = null;
            input.addEventListener('input', () => {
                const idx = parseInt(input.getAttribute('data-sov-line'));
                _sovRecalcRow(idx);
                _sovRecalcTotals();
                // Debounced auto-save
                clearTimeout(saveTimer);
                saveTimer = setTimeout(async () => {
                    const itemId = input.getAttribute('data-sov-id');
                    const curPct = parseFloat(input.value) || 0;
                    const scheduled = items[idx].scheduled_value || 0;
                    const prevBilled = items[idx].total_completed_value || 0;
                    const completedValue = curPct / 100 * scheduled;
                    const r = await API.updateSOVItem(pid, itemId, {
                        total_completed_pct: curPct,
                        total_completed_value: completedValue
                    });
                    if (r.error) { App.toast(r.error, 'error'); }
                }, 600);
            });
        });
    }
    document.getElementById('btn-add-sov').addEventListener('click', () => this.addSOVItem());
};
App.addSOVItem = function () {
    const pid = this.state.projectId;
    this.showModal('Add SOV Line Item', `<div class="form-grid"><div class="form-group"><label class="form-label">Item Number *</label><input class="form-input" id="sov-num" placeholder="e.g. 27-001"></div><div class="form-group"><label class="form-label">Division</label><select class="form-select" id="sov-div"><option value="">Select...</option><option value="Division 27">Division 27</option><option value="Division 28">Division 28</option><option value="Special Conditions">Special Conditions</option><option value="General Conditions">General Conditions</option></select></div><div class="form-group form-full"><label class="form-label">Description *</label><input class="form-input" id="sov-desc" placeholder="Line item description"></div><div class="form-group"><label class="form-label">Material Cost ($) *</label><input class="form-input" id="sov-mat" type="number" step="0.01" value="0" placeholder="Material portion"></div><div class="form-group"><label class="form-label">Labor Cost ($) *</label><input class="form-input" id="sov-lab" type="number" step="0.01" value="0" placeholder="Labor portion"></div><div class="form-group form-full"><label class="form-label">Scheduled Value ($)</label><input class="form-input" id="sov-val" type="number" step="0.01" value="0" readonly style="background:var(--bg-secondary);cursor:not-allowed;" placeholder="Auto-calculated: Material + Labor"></div></div>`, async () => {
        const num = document.getElementById('sov-num').value.trim();
        const desc = document.getElementById('sov-desc').value.trim();
        if (!num || !desc) { this.toast('Item number and description required', 'warning'); return; }
        const materialCost = parseFloat(document.getElementById('sov-mat').value) || 0;
        const laborCost = parseFloat(document.getElementById('sov-lab').value) || 0;
        const scheduledValue = materialCost + laborCost;
        const res = await API.createSOVItem(pid, { item_number: num, description: desc, division: document.getElementById('sov-div').value, scheduled_value: scheduledValue, material_cost: materialCost, labor_cost: laborCost });
        if (res.error) { this.toast(res.error, 'error'); return; }
        this.closeModal(); this.toast('SOV item added', 'success');
        this.renderSOV(document.getElementById('project-content'));
    });
    // Wire up auto-calc for Scheduled Value = Material + Labor
    const _sovAddRecalc = () => {
        const mat = parseFloat(document.getElementById('sov-mat').value) || 0;
        const lab = parseFloat(document.getElementById('sov-lab').value) || 0;
        document.getElementById('sov-val').value = (mat + lab).toFixed(2);
    };
    document.getElementById('sov-mat').addEventListener('input', _sovAddRecalc);
    document.getElementById('sov-lab').addEventListener('input', _sovAddRecalc);
};
App.editSOVItem = async function (itemId) {
    const pid = this.state.projectId;
    const res = await API.getSOV(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const item = (res.items || []).find(i => i.id === itemId);
    if (!item) { this.toast('Item not found', 'error'); return; }
    const matCost = item.material_cost || 0;
    const labCost = item.labor_cost || (item.scheduled_value || 0) - matCost;
    this.showModal('Edit SOV Item', `<div class="form-grid"><div class="form-group"><label class="form-label">Item Number</label><input class="form-input" id="se-num" value="${esc(item.item_number)}"></div><div class="form-group"><label class="form-label">Division</label><select class="form-select" id="se-div"><option value="">Select...</option><option value="Division 27" ${item.division === 'Division 27' ? 'selected' : ''}>Division 27</option><option value="Division 28" ${item.division === 'Division 28' ? 'selected' : ''}>Division 28</option><option value="Special Conditions" ${item.division === 'Special Conditions' ? 'selected' : ''}>Special Conditions</option><option value="General Conditions" ${item.division === 'General Conditions' ? 'selected' : ''}>General Conditions</option></select></div><div class="form-group form-full"><label class="form-label">Description</label><input class="form-input" id="se-desc" value="${esc(item.description)}"></div><div class="form-group"><label class="form-label">Material Cost ($)</label><input class="form-input" id="se-mat" type="number" step="0.01" value="${matCost}"></div><div class="form-group"><label class="form-label">Labor Cost ($)</label><input class="form-input" id="se-lab" type="number" step="0.01" value="${labCost}"></div><div class="form-group form-full"><label class="form-label">Scheduled Value ($)</label><input class="form-input" id="se-val" type="number" step="0.01" value="${item.scheduled_value || 0}" readonly style="background:var(--bg-secondary);cursor:not-allowed;"></div></div>`, async () => {
        const materialCost = parseFloat(document.getElementById('se-mat').value) || 0;
        const laborCost = parseFloat(document.getElementById('se-lab').value) || 0;
        const scheduledValue = materialCost + laborCost;
        const r = await API.updateSOVItem(pid, itemId, { item_number: document.getElementById('se-num').value.trim(), description: document.getElementById('se-desc').value.trim(), division: document.getElementById('se-div').value, scheduled_value: scheduledValue, material_cost: materialCost, labor_cost: laborCost });
        if (r.error) { this.toast(r.error, 'error'); return; }
        this.closeModal(); this.toast('SOV item updated', 'success');
        this.renderSOV(document.getElementById('project-content'));
    });
    // Wire up auto-calc for Scheduled Value = Material + Labor
    const _sovEditRecalc = () => {
        const mat = parseFloat(document.getElementById('se-mat').value) || 0;
        const lab = parseFloat(document.getElementById('se-lab').value) || 0;
        document.getElementById('se-val').value = (mat + lab).toFixed(2);
    };
    document.getElementById('se-mat').addEventListener('input', _sovEditRecalc);
    document.getElementById('se-lab').addEventListener('input', _sovEditRecalc);
};
App.deleteSOVItem = async function (itemId) {
    if (!confirm('Delete this SOV item?')) return;
    const res = await API.deleteSOVItem(this.state.projectId, itemId);
    if (res.error) { this.toast(res.error, 'error'); return; }
    this.toast('SOV item deleted', 'success');
    this.renderSOV(document.getElementById('project-content'));
};

// ─── BILLING — AIA G702/G703 ──────────────────────────────────
App.renderBilling = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">💰 Progress Billing</h1><p class="page-subtitle">AIA G702/G703 payment applications</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-billing">+ New Billing Period</button></div></div><div id="billing-list"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-title">Loading...</div></div></div>`;
    const pid = this.state.projectId;
    const res = await API.getBillingPeriods(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const periods = res.periods || [];
    const list = document.getElementById('billing-list');
    if (periods.length === 0) { list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💰</div><div class="empty-state-title">No Billing Periods</div><div class="empty-state-desc">Create your first billing period to start tracking progress payments.</div></div>`; }
    else { list.innerHTML = `<div class="card"><table class="data-table"><thead><tr><th>Period</th><th>Dates</th><th>Status</th><th style="text-align:right">Contract Sum</th><th style="text-align:right">Payment Due</th><th>Actions</th></tr></thead><tbody>${periods.map(p => `<tr><td><strong>#${p.period_number}</strong></td><td>${formatDate(p.period_start)} — ${formatDate(p.period_end)}</td><td><span class="badge badge--${p.status}">${esc(formatStatus(p.status))}</span></td><td style="text-align:right">$${formatMoney(p.contract_sum_to_date)}</td><td style="text-align:right">$${formatMoney(p.current_payment_due)}</td><td><button class="btn btn-sm" onclick="App.viewBillingPeriod('${p.id}')">View</button></td></tr>`).join('')}</tbody></table></div>`; }
    document.getElementById('btn-new-billing').addEventListener('click', async () => {
        const res = await API.createBillingPeriod(pid, {});
        if (res.error) { this.toast(res.error, 'error'); return; }
        this.toast(`Billing period #${res.periodNumber} created`, 'success');
        this.renderBilling(c);
    });
};
App.viewBillingPeriod = async function (periodId) {
    const pid = this.state.projectId;
    const res = await API.getBillingPeriod(pid, periodId);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const p = res.period; const lines = res.lineItems || [];
    const retainagePct = p.retainage_pct || 10;
    const lessPrevPayments = p.less_previous_payments || 0;
    const statuses = ['draft', 'submitted', 'approved', 'paid'];

    // Recalculate G702 summary from line items — fires on every % input change
    const _recalcSummary = () => {
        let totalCompletedStored = 0;
        lines.forEach((l, idx) => {
            const pctInput = document.querySelector(`[data-bp-line="${idx}"][data-bp-field="pct"]`);
            const curPct = parseFloat(pctInput ? pctInput.value : l.total_completed_pct) || 0;
            const scheduled = l.scheduled_value || 0;
            totalCompletedStored += scheduled * curPct / 100;
        });
        const retainage = totalCompletedStored * retainagePct / 100;
        const earnedLessRetainage = totalCompletedStored - retainage;
        const paymentDue = earnedLessRetainage - lessPrevPayments;
        const el = document.getElementById('bp-g702-summary');
        if (el) {
            el.querySelector('[data-g702="total-completed"]').textContent = '$' + formatMoney(totalCompletedStored);
            el.querySelector('[data-g702="retainage"]').textContent = '$' + formatMoney(retainage);
            el.querySelector('[data-g702="earned-less-ret"]').textContent = '$' + formatMoney(earnedLessRetainage);
            el.querySelector('[data-g702="less-prev-payments"]').textContent = '$' + formatMoney(lessPrevPayments);
            el.querySelector('[data-g702="payment-due"]').textContent = '$' + formatMoney(paymentDue);
        }
        // Update per-line "Previously Billed $", "This Period $", and "Total Completed $" cells
        lines.forEach((l, idx) => {
            const pctInput = document.querySelector(`[data-bp-line="${idx}"][data-bp-field="pct"]`);
            const curPct = parseFloat(pctInput ? pctInput.value : l.total_completed_pct) || 0;
            const prevPct = l.previous_completed_pct || 0;
            const scheduled = l.scheduled_value || 0;
            const prevBilledCell = document.querySelector(`[data-bp-line="${idx}"][data-bp-field="prev-amt"]`);
            const thisPeriodCell = document.querySelector(`[data-bp-line="${idx}"][data-bp-field="this-period"]`);
            const totalCompCell = document.querySelector(`[data-bp-line="${idx}"][data-bp-field="total-comp"]`);
            if (prevBilledCell) prevBilledCell.textContent = '$' + formatMoney(scheduled * prevPct / 100);
            if (thisPeriodCell) thisPeriodCell.textContent = '$' + formatMoney(scheduled * (curPct - prevPct) / 100);
            if (totalCompCell) totalCompCell.textContent = '$' + formatMoney(scheduled * curPct / 100);
        });
    };

    // Build initial summary values from current line item data
    const initTotalCompleted = lines.reduce((s, l) => s + ((l.scheduled_value || 0) * (l.total_completed_pct || 0) / 100), 0);
    const initRetainage = initTotalCompleted * retainagePct / 100;
    const initEarnedLessRet = initTotalCompleted - initRetainage;
    const initPaymentDue = initEarnedLessRet - lessPrevPayments;

    this.showModal(`Billing Period #${p.period_number} — AIA G702`, `
    <div id="bp-g702-summary" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:16px;padding:12px;background:var(--bg-secondary);border-radius:8px;font-size:0.875rem;">
      <div>Original Contract Sum: <strong>$${formatMoney(p.original_contract)}</strong></div>
      <div>Net Change Orders: <strong>$${formatMoney(p.net_change_orders)}</strong></div>
      <div>Contract Sum to Date: <strong>$${formatMoney(p.contract_sum_to_date)}</strong></div>
      <div>Total Completed & Stored: <strong data-g702="total-completed">$${formatMoney(initTotalCompleted)}</strong></div>
      <div>Retainage (${retainagePct}%): <strong data-g702="retainage">$${formatMoney(initRetainage)}</strong></div>
      <div>Total Earned Less Retainage: <strong data-g702="earned-less-ret">$${formatMoney(initEarnedLessRet)}</strong></div>
      <div>Less Previous Payments: <strong data-g702="less-prev-payments">$${formatMoney(lessPrevPayments)}</strong></div>
      <div style="font-size:1rem;">Current Payment Due: <strong style="color:var(--success)" data-g702="payment-due">$${formatMoney(initPaymentDue)}</strong></div>
    </div>
    <div style="margin-bottom:12px;display:flex;gap:12px;align-items:center;">
      <label class="form-label" style="margin:0;">Status:</label>
      <select class="form-select" id="bp-status" style="width:auto;">${statuses.map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${formatStatus(s)}</option>`).join('')}</select>
    </div>
    <div style="max-height:400px;overflow-y:auto;"><table class="data-table" style="font-size:0.8125rem;"><thead><tr><th>Item #</th><th>Description</th><th style="text-align:right">Scheduled Value</th><th style="text-align:right">Prev %</th><th style="text-align:right">Previously Billed</th><th style="text-align:right">Current %</th><th style="text-align:right">This Period $</th><th style="text-align:right">Total Completed $</th></tr></thead><tbody>${lines.map((l, idx) => {
        const prevPct = l.previous_completed_pct || 0;
        const scheduled = l.scheduled_value || 0;
        const prevBilledAmt = scheduled * prevPct / 100;
        const curPct = l.total_completed_pct || 0;
        const thisPeriodAmt = scheduled * (curPct - prevPct) / 100;
        const totalCompAmt = scheduled * curPct / 100;
        return `<tr><td>${esc(l.item_number)}</td><td>${esc(l.description)}</td><td style="text-align:right">$${formatMoney(scheduled)}</td><td style="text-align:right;color:var(--text-muted)">${prevPct.toFixed(1)}%</td><td style="text-align:right;color:var(--text-muted)" data-bp-line="${idx}" data-bp-field="prev-amt">$${formatMoney(prevBilledAmt)}</td><td style="text-align:right"><input class="form-input" style="width:72px;text-align:right;padding:4px 6px;" type="number" step="0.1" min="0" max="100" data-bp-line="${idx}" data-bp-field="pct" value="${curPct.toFixed(1)}"></td><td style="text-align:right" data-bp-line="${idx}" data-bp-field="this-period">$${formatMoney(thisPeriodAmt)}</td><td style="text-align:right" data-bp-line="${idx}" data-bp-field="total-comp">$${formatMoney(totalCompAmt)}</td></tr>`;
    }).join('')}</tbody></table></div>`, async () => {
        // Save: build updated line items from current % inputs
        const updatedLines = lines.map((l, idx) => {
            const pctInput = document.querySelector(`[data-bp-line="${idx}"][data-bp-field="pct"]`);
            const curPct = parseFloat(pctInput?.value) || 0;
            const prevPct = l.previous_completed_pct || 0;
            const scheduled = l.scheduled_value || 0;
            const completedValue = scheduled * curPct / 100;
            const thisPeriod = scheduled * (curPct - prevPct) / 100;
            return {
                id: l.id,
                sov_item_id: l.sov_item_id,
                total_completed_pct: curPct,
                total_completed_value: completedValue,
                work_completed_this_period: thisPeriod,
                total_stored: l.total_stored || 0,
                stored_material_this_period: l.stored_material_this_period || 0,
                retainage: completedValue * retainagePct / 100,
            };
        });
        const totalCompletedStored = updatedLines.reduce((s, l) => s + l.total_completed_value, 0);
        const retainage = totalCompletedStored * retainagePct / 100;
        const earnedLessRetainage = totalCompletedStored - retainage;
        const paymentDue = earnedLessRetainage - lessPrevPayments;
        const r = await API.updateBillingPeriod(pid, periodId, {
            period: {
                status: document.getElementById('bp-status').value,
                total_completed_stored: totalCompletedStored,
                retainage: retainage,
                total_earned_less_retainage: earnedLessRetainage,
                less_previous_payments: lessPrevPayments,
                current_payment_due: paymentDue,
            },
            lineItems: updatedLines,
        });
        if (r.error) { this.toast(r.error, 'error'); return; }
        this.closeModal(); this.toast('Billing period saved', 'success');
        this.renderBilling(document.getElementById('project-content'));
    });
    // Attach live-recalc listeners to % inputs
    document.querySelectorAll('[data-bp-field="pct"]').forEach(input => {
        input.addEventListener('input', _recalcSummary);
    });
};

// ─── CHANGE ORDERS ─────────────────────────────────────────────
App.renderChangeOrders = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📝 Change Orders</h1><p class="page-subtitle">Track scope changes and pricing impacts</p></div><div class="page-actions">${AIAssistant.renderAIButton('co-impact', this.state.projectId)}<button class="btn btn-primary" id="btn-new-co">+ New Change Order</button></div></div><div id="co-summary" class="metric-grid" style="margin-bottom:20px;"></div><div class="card"><table class="data-table"><thead><tr><th>CO #</th><th>Title</th><th>Type</th><th>Status</th><th style="text-align:right">Amount</th><th>Requested</th><th>Actions</th></tr></thead><tbody id="co-body"><tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
    const pid = this.state.projectId;
    const res = await API.getChangeOrders(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const cos = res.changeOrders || []; const sum = res.summary || {};
    document.getElementById('co-summary').innerHTML = `
    <div class="metric-card metric-card--amber"><div class="metric-icon">⏳</div><div class="metric-value">${sum.pending || 0}</div><div class="metric-label">Pending</div></div>
    <div class="metric-card metric-card--emerald"><div class="metric-icon">✅</div><div class="metric-value">${sum.approved || 0}</div><div class="metric-label">Approved</div></div>
    <div class="metric-card metric-card--sky"><div class="metric-icon">💰</div><div class="metric-value">$${formatMoney(sum.approved_total)}</div><div class="metric-label">Approved Value</div></div>
    <div class="metric-card metric-card--rose"><div class="metric-icon">📝</div><div class="metric-value">$${formatMoney(sum.pending_total)}</div><div class="metric-label">Pending Value</div></div>`;
    const tbody = document.getElementById('co-body');
    if (cos.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">No change orders yet.</td></tr>`; }
    else { tbody.innerHTML = cos.map(co => `<tr><td><strong>#${co.co_number}</strong></td><td>${esc(co.title)}</td><td>${esc(formatStatus(co.type))}</td><td><span class="badge badge--${co.status}">${esc(formatStatus(co.status))}</span></td><td style="text-align:right;font-weight:600;${co.type === 'deduction' ? 'color:var(--error)' : ''}">$${formatMoney(co.total_amount)}</td><td>${formatDate(co.requested_date)}</td><td><button class="btn btn-sm" onclick="App.editCO('${co.id}')">Edit</button></td></tr>`).join(''); }
    document.getElementById('btn-new-co').addEventListener('click', () => this.addCO());
};
App.addCO = function () {
    const pid = this.state.projectId;
    this.showModal('New Change Order', `<div class="form-grid"><div class="form-group form-full"><label class="form-label">Title *</label><input class="form-input" id="co-title" placeholder="Change order description"></div><div class="form-group"><label class="form-label">Type</label><select class="form-select" id="co-type"><option value="addition">Addition</option><option value="deduction">Deduction</option><option value="no_cost">No Cost</option></select></div><div class="form-group"><label class="form-label">Requested By</label><input class="form-input" id="co-by" placeholder="Name"></div><div class="form-group"><label class="form-label">Material ($)</label><input class="form-input" id="co-mat" type="number" step="0.01" value="0"></div><div class="form-group"><label class="form-label">Labor ($)</label><input class="form-input" id="co-lab" type="number" step="0.01" value="0"></div><div class="form-group"><label class="form-label">Equipment ($)</label><input class="form-input" id="co-eq" type="number" step="0.01" value="0"></div><div class="form-group"><label class="form-label">Markup %</label><input class="form-input" id="co-markup" type="number" step="0.1" value="25"></div><div class="form-group"><label class="form-label">Schedule Impact (days)</label><input class="form-input" id="co-days" type="number" value="0"></div><div class="form-group form-full"><label class="form-label">Description</label><textarea class="form-input" id="co-desc" rows="3"></textarea></div></div>`, async () => {
        const title = document.getElementById('co-title').value.trim();
        if (!title) { this.toast('Title is required', 'warning'); return; }
        const res = await API.createChangeOrder(pid, { title, type: document.getElementById('co-type').value, description: document.getElementById('co-desc').value, requested_by: document.getElementById('co-by').value.trim(), requested_date: new Date().toISOString().split('T')[0], material_cost: parseFloat(document.getElementById('co-mat').value) || 0, labor_cost: parseFloat(document.getElementById('co-lab').value) || 0, equipment_cost: parseFloat(document.getElementById('co-eq').value) || 0, markup_pct: parseFloat(document.getElementById('co-markup').value) || 0, schedule_impact_days: parseInt(document.getElementById('co-days').value) || 0 });
        if (res.error) { this.toast(res.error, 'error'); return; }
        this.closeModal(); this.toast(`CO #${res.coNumber} created`, 'success');
        this.renderChangeOrders(document.getElementById('project-content'));
    });
};
App.editCO = async function (coId) {
    const pid = this.state.projectId;
    const res = await API.getChangeOrders(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const co = (res.changeOrders || []).find(c => c.id === coId);
    if (!co) { this.toast('CO not found', 'error'); return; }
    this.showModal('Edit Change Order #' + esc(co.co_number), `<div class="form-grid"><div class="form-group form-full"><label class="form-label">Title</label><input class="form-input" id="ce-title" value="${esc(co.title)}"></div><div class="form-group"><label class="form-label">Status</label><select class="form-select" id="ce-status"><option value="pending" ${co.status === 'pending' ? 'selected' : ''}>Pending</option><option value="submitted" ${co.status === 'submitted' ? 'selected' : ''}>Submitted</option><option value="approved" ${co.status === 'approved' ? 'selected' : ''}>Approved</option><option value="rejected" ${co.status === 'rejected' ? 'selected' : ''}>Rejected</option></select></div><div class="form-group"><label class="form-label">Type</label><select class="form-select" id="ce-type"><option value="addition" ${co.type === 'addition' ? 'selected' : ''}>Addition</option><option value="deduction" ${co.type === 'deduction' ? 'selected' : ''}>Deduction</option><option value="no_cost" ${co.type === 'no_cost' ? 'selected' : ''}>No Cost</option></select></div><div class="form-group"><label class="form-label">Material ($)</label><input class="form-input" id="ce-mat" type="number" step="0.01" value="${co.material_cost || 0}"></div><div class="form-group"><label class="form-label">Labor ($)</label><input class="form-input" id="ce-lab" type="number" step="0.01" value="${co.labor_cost || 0}"></div><div class="form-group"><label class="form-label">Equipment ($)</label><input class="form-input" id="ce-eq" type="number" step="0.01" value="${co.equipment_cost || 0}"></div><div class="form-group"><label class="form-label">Markup %</label><input class="form-input" id="ce-markup" type="number" step="0.1" value="${co.markup_pct || 0}"></div><div class="form-group"><label class="form-label">Schedule Impact (days)</label><input class="form-input" id="ce-days" type="number" value="${co.schedule_impact_days || 0}"></div><div class="form-group"><label class="form-label">Approved Date</label><input class="form-input" id="ce-apdate" type="date" value="${co.approved_date || ''}"></div><div class="form-group"><label class="form-label">Approved By</label><input class="form-input" id="ce-apby" value="${esc(co.approved_by || '')}"></div><div class="form-group form-full"><label class="form-label">Notes</label><textarea class="form-input" id="ce-notes" rows="2">${esc(co.notes || '')}</textarea></div></div>`, async () => {
        const mat = parseFloat(document.getElementById('ce-mat').value) || 0;
        const lab = parseFloat(document.getElementById('ce-lab').value) || 0;
        const eq = parseFloat(document.getElementById('ce-eq').value) || 0;
        const mkp = parseFloat(document.getElementById('ce-markup').value) || 0;
        const subtotal = mat + lab + eq;
        const total = subtotal + (subtotal * mkp / 100);
        const r = await API.updateChangeOrder(pid, coId, { title: document.getElementById('ce-title').value.trim(), status: document.getElementById('ce-status').value, type: document.getElementById('ce-type').value, material_cost: mat, labor_cost: lab, equipment_cost: eq, markup_pct: mkp, total_amount: total, schedule_impact_days: parseInt(document.getElementById('ce-days').value) || 0, approved_date: document.getElementById('ce-apdate').value || null, approved_by: document.getElementById('ce-apby').value.trim(), notes: document.getElementById('ce-notes').value });
        if (r.error) { this.toast(r.error, 'error'); return; }
        this.closeModal(); this.toast('Change order updated', 'success');
        this.renderChangeOrders(document.getElementById('project-content'));
    });
};

// ─── RFIs ──────────────────────────────────────────────────────
App.renderRFIs = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">❓ RFI Tracker</h1><p class="page-subtitle">Requests for information — track questions and responses</p></div><div class="page-actions">${AIAssistant.renderAIButton('smart-rfi', this.state.projectId)}<button class="btn btn-primary" id="btn-new-rfi">+ New RFI</button></div></div><div id="rfi-summary" class="metric-grid" style="margin-bottom:20px;"></div><div class="card"><table class="data-table"><thead><tr><th>RFI #</th><th>Subject</th><th>Discipline</th><th>Priority</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead><tbody id="rfi-body"><tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
    const pid = this.state.projectId;
    const res = await API.getRFIs(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const rfis = res.rfis || []; const sum = res.summary || {};
    document.getElementById('rfi-summary').innerHTML = `
    <div class="metric-card metric-card--amber"><div class="metric-icon">📨</div><div class="metric-value">${sum.open || 0}</div><div class="metric-label">Open</div></div>
    <div class="metric-card metric-card--emerald"><div class="metric-icon">✅</div><div class="metric-value">${sum.responded || 0}</div><div class="metric-label">Responded</div></div>
    <div class="metric-card metric-card--indigo"><div class="metric-icon">📁</div><div class="metric-value">${sum.closed || 0}</div><div class="metric-label">Closed</div></div>
    <div class="metric-card metric-card--rose"><div class="metric-icon">🚨</div><div class="metric-value">${sum.overdue || 0}</div><div class="metric-label">Overdue</div></div>`;
    const tbody = document.getElementById('rfi-body');
    if (rfis.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">No RFIs yet.</td></tr>`; }
    else {
        const priorityClass = p => p === 'critical' ? 'rose' : p === 'high' ? 'amber' : 'sky';
        tbody.innerHTML = rfis.map(r => `<tr><td><strong>#${r.rfi_number}</strong></td><td>${esc(r.subject)}</td><td>${esc(r.discipline || '—')}</td><td><span class="badge badge--${priorityClass(r.priority)}">${esc(formatStatus(r.priority))}</span></td><td><span class="badge badge--${r.status}">${esc(formatStatus(r.status))}</span></td><td>${r.due_date && new Date(r.due_date) < new Date() && r.status !== 'closed' ? '<span style="color:var(--error);font-weight:600;">' + formatDate(r.due_date) + '</span>' : formatDate(r.due_date)}</td><td><button class="btn btn-sm" onclick="App.editRFI('${r.id}')">Edit</button></td></tr>`).join('');
    }
    document.getElementById('btn-new-rfi').addEventListener('click', () => this.addRFI());
};
App.addRFI = function () {
    const pid = this.state.projectId;
    this.showModal('New RFI', `<div class="form-grid"><div class="form-group form-full"><label class="form-label">Subject *</label><input class="form-input" id="rfi-subj" placeholder="RFI subject"></div><div class="form-group form-full"><label class="form-label">Question *</label><textarea class="form-input" id="rfi-q" rows="3" placeholder="Describe the question..."></textarea></div><div class="form-group"><label class="form-label">Discipline</label><select class="form-select" id="rfi-disc"><option value="">Select...</option><option>Structured Cabling</option><option>Fire Alarm</option><option>CCTV</option><option>Access Control</option><option>Audio Visual</option><option>Intrusion Detection</option></select></div><div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="rfi-pri"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="critical">Critical</option></select></div><div class="form-group"><label class="form-label">Submit To</label><input class="form-input" id="rfi-to" placeholder="Architect/Engineer"></div><div class="form-group"><label class="form-label">Due Date</label><input class="form-input" id="rfi-due" type="date"></div></div>`, async () => {
        const subj = document.getElementById('rfi-subj').value.trim();
        const q = document.getElementById('rfi-q').value.trim();
        if (!subj || !q) { this.toast('Subject and question required', 'warning'); return; }
        const res = await API.createRFI(pid, { subject: subj, question: q, discipline: document.getElementById('rfi-disc').value, priority: document.getElementById('rfi-pri').value, submitted_to: document.getElementById('rfi-to').value.trim(), due_date: document.getElementById('rfi-due').value || null });
        if (res.error) { this.toast(res.error, 'error'); return; }
        this.closeModal(); this.toast(`RFI #${res.rfiNumber} created`, 'success');
        this.renderRFIs(document.getElementById('project-content'));
    });
};
App.editRFI = async function (rfiId) {
    const pid = this.state.projectId;
    const res = await API.getRFIs(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const rfi = (res.rfis || []).find(r => r.id === rfiId);
    if (!rfi) { this.toast('RFI not found', 'error'); return; }
    this.showModal('Edit RFI #' + esc(rfi.rfi_number), `<div class="form-grid"><div class="form-group form-full"><label class="form-label">Subject</label><input class="form-input" id="re-subj" value="${esc(rfi.subject)}"></div><div class="form-group"><label class="form-label">Status</label><select class="form-select" id="re-status"><option value="draft" ${rfi.status === 'draft' ? 'selected' : ''}>Draft</option><option value="submitted" ${rfi.status === 'submitted' ? 'selected' : ''}>Submitted</option><option value="responded" ${rfi.status === 'responded' ? 'selected' : ''}>Responded</option><option value="closed" ${rfi.status === 'closed' ? 'selected' : ''}>Closed</option></select></div><div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="re-pri"><option value="low" ${rfi.priority === 'low' ? 'selected' : ''}>Low</option><option value="normal" ${rfi.priority === 'normal' ? 'selected' : ''}>Normal</option><option value="high" ${rfi.priority === 'high' ? 'selected' : ''}>High</option><option value="critical" ${rfi.priority === 'critical' ? 'selected' : ''}>Critical</option></select></div><div class="form-group form-full"><label class="form-label">Question</label><textarea class="form-input" id="re-q" rows="2">${esc(rfi.question)}</textarea></div><div class="form-group"><label class="form-label">Submitted To</label><input class="form-input" id="re-to" value="${esc(rfi.submitted_to || '')}"></div><div class="form-group"><label class="form-label">Due Date</label><input class="form-input" id="re-due" type="date" value="${rfi.due_date || ''}"></div><hr class="form-divider" style="grid-column:1/-1"><div class="form-section-title" style="grid-column:1/-1">Response</div><div class="form-group form-full"><label class="form-label">Response</label><textarea class="form-input" id="re-resp" rows="3">${esc(rfi.response || '')}</textarea></div><div class="form-group"><label class="form-label">Responded By</label><input class="form-input" id="re-rby" value="${esc(rfi.responded_by || '')}"></div><div class="form-group"><label class="form-label">Response Date</label><input class="form-input" id="re-rdate" type="date" value="${rfi.response_date || ''}"></div><div class="form-group"><label class="form-label">Cost Impact?</label><select class="form-select" id="re-cost"><option value="0" ${!rfi.cost_impact ? 'selected' : ''}>No</option><option value="1" ${rfi.cost_impact ? 'selected' : ''}>Yes</option></select></div><div class="form-group"><label class="form-label">Schedule Impact?</label><select class="form-select" id="re-sched"><option value="0" ${!rfi.schedule_impact ? 'selected' : ''}>No</option><option value="1" ${rfi.schedule_impact ? 'selected' : ''}>Yes</option></select></div></div>`, async () => {
        const r = await API.updateRFI(pid, rfiId, { subject: document.getElementById('re-subj').value.trim(), status: document.getElementById('re-status').value, priority: document.getElementById('re-pri').value, question: document.getElementById('re-q').value, submitted_to: document.getElementById('re-to').value.trim(), due_date: document.getElementById('re-due').value || null, response: document.getElementById('re-resp').value, responded_by: document.getElementById('re-rby').value.trim(), response_date: document.getElementById('re-rdate').value || null, cost_impact: parseInt(document.getElementById('re-cost').value), schedule_impact: parseInt(document.getElementById('re-sched').value) });
        if (r.error) { this.toast(r.error, 'error'); return; }
        this.closeModal(); this.toast('RFI updated', 'success');
        this.renderRFIs(document.getElementById('project-content'));
    });
};

// ─── SUBMITTALS ────────────────────────────────────────────────
App.renderSubmittals = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📎 Submittal Log</h1><p class="page-subtitle">Track equipment and material submittals</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-sub">+ New Submittal</button></div></div><div class="card"><table class="data-table"><thead><tr><th>Number</th><th>Title</th><th>Spec Section</th><th>Status</th><th>Due</th><th>Rev</th><th>Actions</th></tr></thead><tbody id="sub-body"><tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
    const pid = this.state.projectId;
    const res = await API.getSubmittals(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const subs = res.submittals || [];
    const tbody = document.getElementById('sub-body');
    if (subs.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">No submittals yet.</td></tr>`; }
    else { tbody.innerHTML = subs.map(s => `<tr><td><strong>${esc(s.submittal_number)}</strong></td><td>${esc(s.title)}</td><td>${esc(s.spec_section || '—')}</td><td><span class="badge badge--${s.status}">${esc(formatStatus(s.status))}</span></td><td>${formatDate(s.due_date)}</td><td>Rev ${s.revision || 0}</td><td><button class="btn btn-sm" onclick="App.editSubmittal('${s.id}')">Edit</button></td></tr>`).join(''); }
    document.getElementById('btn-new-sub').addEventListener('click', () => {
        this.showModal('New Submittal', `<div class="form-grid"><div class="form-group form-full"><label class="form-label">Title *</label><input class="form-input" id="sub-title" placeholder="Submittal title"></div><div class="form-group"><label class="form-label">Spec Section</label><input class="form-input" id="sub-spec" placeholder="e.g. 27 10 00"></div><div class="form-group"><label class="form-label">Category</label><select class="form-select" id="sub-cat"><option value="product_data">Product Data</option><option value="shop_drawings">Shop Drawings</option><option value="samples">Samples</option><option value="test_reports">Test Reports</option><option value="certificates">Certificates</option></select></div><div class="form-group"><label class="form-label">Due Date</label><input class="form-input" id="sub-due" type="date"></div><div class="form-group form-full"><label class="form-label">Description</label><textarea class="form-input" id="sub-desc" rows="2"></textarea></div></div>`, async () => {
            const title = document.getElementById('sub-title').value.trim();
            if (!title) { this.toast('Title required', 'warning'); return; }
            const r = await API.createSubmittal(pid, { title, spec_section: document.getElementById('sub-spec').value.trim(), category: document.getElementById('sub-cat').value, due_date: document.getElementById('sub-due').value || null, description: document.getElementById('sub-desc').value });
            if (r.error) { this.toast(r.error, 'error'); return; }
            this.closeModal(); this.toast('Submittal created', 'success');
            this.renderSubmittals(c);
        });
    });
};
App.editSubmittal = async function (subId) {
    const pid = this.state.projectId;
    const res = await API.getSubmittals(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const s = (res.submittals || []).find(x => x.id === subId);
    if (!s) { this.toast('Submittal not found', 'error'); return; }
    const statuses = ['in_preparation', 'submitted', 'approved', 'approved_as_noted', 'revise_resubmit', 'rejected', 'closed'];
    this.showModal('Edit Submittal ' + esc(s.submittal_number), `<div class="form-grid"><div class="form-group form-full"><label class="form-label">Title</label><input class="form-input" id="se2-title" value="${esc(s.title)}"></div><div class="form-group"><label class="form-label">Status</label><select class="form-select" id="se2-status">${statuses.map(st => `<option value="${st}" ${s.status === st ? 'selected' : ''}>${formatStatus(st)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Spec Section</label><input class="form-input" id="se2-spec" value="${esc(s.spec_section || '')}"></div><div class="form-group"><label class="form-label">Due Date</label><input class="form-input" id="se2-due" type="date" value="${s.due_date || ''}"></div><div class="form-group"><label class="form-label">Submitted</label><input class="form-input" id="se2-sub" type="date" value="${s.submitted_date || ''}"></div><div class="form-group"><label class="form-label">Returned</label><input class="form-input" id="se2-ret" type="date" value="${s.returned_date || ''}"></div><div class="form-group"><label class="form-label">Revision</label><input class="form-input" id="se2-rev" type="number" value="${s.revision || 0}"></div><div class="form-group form-full"><label class="form-label">Notes</label><textarea class="form-input" id="se2-notes" rows="2">${esc(s.notes || '')}</textarea></div></div>`, async () => {
        const r = await API.updateSubmittal(pid, subId, { title: document.getElementById('se2-title').value.trim(), status: document.getElementById('se2-status').value, spec_section: document.getElementById('se2-spec').value.trim(), due_date: document.getElementById('se2-due').value || null, submitted_date: document.getElementById('se2-sub').value || null, returned_date: document.getElementById('se2-ret').value || null, revision: parseInt(document.getElementById('se2-rev').value) || 0, notes: document.getElementById('se2-notes').value });
        if (r.error) { this.toast(r.error, 'error'); return; }
        this.closeModal(); this.toast('Submittal updated', 'success');
        this.renderSubmittals(document.getElementById('project-content'));
    });
};

// ─── DAILY LOG ─────────────────────────────────────────────────
App.renderDailyLog = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📅 Daily Log</h1><p class="page-subtitle">Record daily field activity</p></div><div class="page-actions">${AIAssistant.renderAIButton('daily-log-summary', this.state.projectId)}<button class="btn btn-primary" id="btn-new-log">+ New Entry</button></div></div><div class="card" id="log-list"><div style="padding:30px;text-align:center;color:var(--text-muted)">Loading...</div></div>`;
    const pid = this.state.projectId;
    const res = await API.getDailyLogs(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const logs = res.logs || [];
    const list = document.getElementById('log-list');
    if (logs.length === 0) { list.innerHTML = `<div style="padding:40px;text-align:center;"><div style="font-size:48px;margin-bottom:12px;opacity:0.3;">📅</div><div style="color:var(--text-muted)">No daily log entries yet.</div></div>`; }
    else { list.innerHTML = `<table class="data-table"><thead><tr><th>Date</th><th>Weather</th><th>Crew</th><th>Hours</th><th>Work Performed</th><th>Actions</th></tr></thead><tbody>${logs.map(l => `<tr><td><strong>${formatDate(l.log_date)}</strong></td><td>${esc(l.weather || '—')}</td><td>${l.crew_size || 0}</td><td>${l.hours_worked || 0}</td><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc((l.work_performed || '—').substring(0, 80))}</td><td><button class="btn btn-sm" onclick="App.editDailyLog('${l.id}')">Edit</button></td></tr>`).join('')}</tbody></table>`; }
    document.getElementById('btn-new-log').addEventListener('click', () => {
        this.showModal('New Daily Log', `<div class="form-grid"><div class="form-group"><label class="form-label">Date *</label><input class="form-input" id="log-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div><div class="form-group"><label class="form-label">Weather</label><select class="form-select" id="log-wx"><option>Clear</option><option>Partly Cloudy</option><option>Cloudy</option><option>Rain</option><option>Snow</option><option>Wind</option></select></div><div class="form-group"><label class="form-label">Crew Size</label><input class="form-input" id="log-crew" type="number" value="0"></div><div class="form-group"><label class="form-label">Hours Worked</label><input class="form-input" id="log-hrs" type="number" step="0.5" value="8"></div><div class="form-group form-full"><label class="form-label">Work Performed</label><textarea class="form-input" id="log-work" rows="3" placeholder="Describe work performed today..."></textarea></div><div class="form-group form-full"><label class="form-label">Areas Worked</label><input class="form-input" id="log-areas" placeholder="Floors, rooms, areas"></div><div class="form-group form-full"><label class="form-label">Delays / Issues</label><textarea class="form-input" id="log-delays" rows="2"></textarea></div></div>`, async () => {
            const r = await API.createDailyLog(pid, { log_date: document.getElementById('log-date').value, weather: document.getElementById('log-wx').value, crew_size: parseInt(document.getElementById('log-crew').value) || 0, hours_worked: parseFloat(document.getElementById('log-hrs').value) || 0, work_performed: document.getElementById('log-work').value, areas_worked: document.getElementById('log-areas').value, delays: document.getElementById('log-delays').value });
            if (r.error) { this.toast(r.error, 'error'); return; }
            this.closeModal(); this.toast('Daily log created', 'success');
            this.renderDailyLog(c);
        });
    });
};
App.editDailyLog = async function (logId) {
    const pid = this.state.projectId;
    const res = await API.getDailyLogs(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const l = (res.logs || []).find(x => x.id === logId);
    if (!l) { this.toast('Log not found', 'error'); return; }
    this.showModal('Edit Daily Log — ' + formatDate(l.log_date), `<div class="form-grid"><div class="form-group"><label class="form-label">Date</label><input class="form-input" id="le-date" type="date" value="${l.log_date || ''}"></div><div class="form-group"><label class="form-label">Weather</label><select class="form-select" id="le-wx"><option ${l.weather === 'Clear' ? 'selected' : ''}>Clear</option><option ${l.weather === 'Partly Cloudy' ? 'selected' : ''}>Partly Cloudy</option><option ${l.weather === 'Cloudy' ? 'selected' : ''}>Cloudy</option><option ${l.weather === 'Rain' ? 'selected' : ''}>Rain</option><option ${l.weather === 'Snow' ? 'selected' : ''}>Snow</option><option ${l.weather === 'Wind' ? 'selected' : ''}>Wind</option></select></div><div class="form-group"><label class="form-label">Crew Size</label><input class="form-input" id="le-crew" type="number" value="${l.crew_size || 0}"></div><div class="form-group"><label class="form-label">Hours Worked</label><input class="form-input" id="le-hrs" type="number" step="0.5" value="${l.hours_worked || 0}"></div><div class="form-group form-full"><label class="form-label">Work Performed</label><textarea class="form-input" id="le-work" rows="3">${esc(l.work_performed || '')}</textarea></div><div class="form-group form-full"><label class="form-label">Areas Worked</label><input class="form-input" id="le-areas" value="${esc(l.areas_worked || '')}"></div><div class="form-group form-full"><label class="form-label">Delays / Issues</label><textarea class="form-input" id="le-delays" rows="2">${esc(l.delays || '')}</textarea></div><div class="form-group form-full"><label class="form-label">Safety Incidents</label><textarea class="form-input" id="le-safety" rows="2">${esc(l.safety_incidents || '')}</textarea></div></div>`, async () => {
        const r = await API.updateDailyLog(pid, logId, { weather: document.getElementById('le-wx').value, crew_size: parseInt(document.getElementById('le-crew').value) || 0, hours_worked: parseFloat(document.getElementById('le-hrs').value) || 0, work_performed: document.getElementById('le-work').value, areas_worked: document.getElementById('le-areas').value, delays: document.getElementById('le-delays').value, safety_incidents: document.getElementById('le-safety').value });
        if (r.error) { this.toast(r.error, 'error'); return; }
        this.closeModal(); this.toast('Daily log updated', 'success');
        this.renderDailyLog(document.getElementById('project-content'));
    });
};

// ─── PUNCH LIST ────────────────────────────────────────────────
App.renderPunchList = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">✅ Punch List</h1><p class="page-subtitle">Track deficiency items through closeout</p></div><div class="page-actions">${AIAssistant.renderAIButton('punch-priority', this.state.projectId)}<button class="btn btn-primary" id="btn-new-punch">+ Add Item</button></div></div><div id="punch-summary" class="metric-grid" style="margin-bottom:20px;"></div><div class="card"><table class="data-table"><thead><tr><th>#</th><th>Location</th><th>Description</th><th>Discipline</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Actions</th></tr></thead><tbody id="punch-body"><tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
    const pid = this.state.projectId;
    const res = await API.getPunchItems(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const items = res.items || []; const sum = res.summary || {};
    const total = sum.total || 0; const done = (sum.complete || 0) + (sum.verified || 0);
    const pct = total > 0 ? ((done / total) * 100).toFixed(0) : 0;
    document.getElementById('punch-summary').innerHTML = `
    <div class="metric-card metric-card--rose"><div class="metric-icon">🔴</div><div class="metric-value">${sum.open || 0}</div><div class="metric-label">Open</div></div>
    <div class="metric-card metric-card--amber"><div class="metric-icon">🔧</div><div class="metric-value">${sum.in_progress || 0}</div><div class="metric-label">In Progress</div></div>
    <div class="metric-card metric-card--emerald"><div class="metric-icon">✅</div><div class="metric-value">${done}</div><div class="metric-label">Complete</div></div>
    <div class="metric-card metric-card--sky"><div class="metric-icon">📊</div><div class="metric-value">${pct}%</div><div class="metric-label">Progress</div></div>`;
    const tbody = document.getElementById('punch-body');
    if (items.length === 0) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">No punch items. All clear! 🎉</td></tr>`; }
    else { tbody.innerHTML = items.map(i => `<tr><td>${i.item_number}</td><td>${esc(i.location)}</td><td>${esc(i.description)}</td><td>${esc(i.discipline || '—')}</td><td><span class="badge badge--${i.priority === 'high' ? 'rose' : i.priority === 'low' ? 'sky' : 'amber'}">${esc(formatStatus(i.priority))}</span></td><td><span class="badge badge--${i.status}">${esc(formatStatus(i.status))}</span></td><td>${esc(i.assigned_to || '—')}</td><td><button class="btn btn-sm" onclick="App.editPunchItem('${i.id}')">Edit</button></td></tr>`).join(''); }
    document.getElementById('btn-new-punch').addEventListener('click', () => {
        this.showModal('Add Punch Item', `<div class="form-grid"><div class="form-group"><label class="form-label">Location *</label><input class="form-input" id="pi-loc" placeholder="Room, floor, area"></div><div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="pi-pri"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option></select></div><div class="form-group form-full"><label class="form-label">Description *</label><textarea class="form-input" id="pi-desc" rows="2" placeholder="Describe the deficiency..."></textarea></div><div class="form-group"><label class="form-label">Discipline</label><input class="form-input" id="pi-disc"></div><div class="form-group"><label class="form-label">Assigned To</label><input class="form-input" id="pi-assign"></div></div>`, async () => {
            const loc = document.getElementById('pi-loc').value.trim();
            const desc = document.getElementById('pi-desc').value.trim();
            if (!loc || !desc) { this.toast('Location and description required', 'warning'); return; }
            const r = await API.createPunchItem(pid, { location: loc, description: desc, priority: document.getElementById('pi-pri').value, discipline: document.getElementById('pi-disc').value.trim(), assigned_to: document.getElementById('pi-assign').value.trim() });
            if (r.error) { this.toast(r.error, 'error'); return; }
            this.closeModal(); this.toast(`Punch item #${r.itemNumber} added`, 'success');
            this.renderPunchList(c);
        });
    });
};
App.editPunchItem = async function (itemId) {
    const pid = this.state.projectId;
    const res = await API.getPunchItems(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const i = (res.items || []).find(x => x.id === itemId);
    if (!i) { this.toast('Item not found', 'error'); return; }
    const statuses = ['open', 'in_progress', 'complete', 'verified'];
    this.showModal('Edit Punch Item #' + esc(i.item_number), `<div class="form-grid"><div class="form-group"><label class="form-label">Location</label><input class="form-input" id="pe-loc" value="${esc(i.location)}"></div><div class="form-group"><label class="form-label">Status</label><select class="form-select" id="pe-status">${statuses.map(st => `<option value="${st}" ${i.status === st ? 'selected' : ''}>${formatStatus(st)}</option>`).join('')}</select></div><div class="form-group form-full"><label class="form-label">Description</label><textarea class="form-input" id="pe-desc" rows="2">${esc(i.description)}</textarea></div><div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="pe-pri"><option value="low" ${i.priority === 'low' ? 'selected' : ''}>Low</option><option value="normal" ${i.priority === 'normal' ? 'selected' : ''}>Normal</option><option value="high" ${i.priority === 'high' ? 'selected' : ''}>High</option></select></div><div class="form-group"><label class="form-label">Assigned To</label><input class="form-input" id="pe-assign" value="${esc(i.assigned_to || '')}"></div><div class="form-group"><label class="form-label">Due Date</label><input class="form-input" id="pe-due" type="date" value="${i.due_date || ''}"></div><div class="form-group"><label class="form-label">Completed Date</label><input class="form-input" id="pe-comp" type="date" value="${i.completed_date || ''}"></div><div class="form-group"><label class="form-label">Verified By</label><input class="form-input" id="pe-vby" value="${esc(i.verified_by || '')}"></div><div class="form-group form-full"><label class="form-label">Notes</label><textarea class="form-input" id="pe-notes" rows="2">${esc(i.notes || '')}</textarea></div></div>`, async () => {
        const r = await API.updatePunchItem(pid, itemId, { location: document.getElementById('pe-loc').value.trim(), status: document.getElementById('pe-status').value, description: document.getElementById('pe-desc').value.trim(), priority: document.getElementById('pe-pri').value, assigned_to: document.getElementById('pe-assign').value.trim(), due_date: document.getElementById('pe-due').value || null, completed_date: document.getElementById('pe-comp').value || null, verified_by: document.getElementById('pe-vby').value.trim(), notes: document.getElementById('pe-notes').value });
        if (r.error) { this.toast(r.error, 'error'); return; }
        this.closeModal(); this.toast('Punch item updated', 'success');
        this.renderPunchList(document.getElementById('project-content'));
    });
};

// ─── CONTACTS ──────────────────────────────────────────────────
App.renderContacts = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">👥 Project Contacts</h1><p class="page-subtitle">Directory of all project stakeholders</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-contact">+ Add Contact</button></div></div><div id="contacts-list"><div style="padding:30px;text-align:center;color:var(--text-muted)">Loading...</div></div>`;
    const pid = this.state.projectId;
    const res = await API.getContacts(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const contacts = res.contacts || [];
    const list = document.getElementById('contacts-list');
    if (contacts.length === 0) { list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title">No Contacts</div><div class="empty-state-desc">Add project stakeholders to your directory.</div></div>`; }
    else {
        const roles = {};
        contacts.forEach(ct => { const r = ct.role || 'other'; if (!roles[r]) roles[r] = []; roles[r].push(ct); });
        list.innerHTML = Object.entries(roles).map(([role, cts]) => `
      <div class="card" style="margin-bottom:16px;"><div class="card-header"><div class="card-title">${esc(formatStatus(role))}</div></div>
      ${cts.map(ct => `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);"><div><div style="font-weight:600;">${esc(ct.name)}</div><div style="font-size:12px;color:var(--text-muted);">${esc(ct.company || '')}${ct.email ? ' · ' + esc(ct.email) : ''}${ct.phone ? ' · ' + esc(ct.phone) : ''}</div></div><div style="display:flex;gap:8px;">${ct.email ? `<a href="mailto:${esc(ct.email)}" class="btn btn-sm">✉️</a>` : ''} ${ct.phone ? `<a href="tel:${esc(ct.phone)}" class="btn btn-sm">📞</a>` : ''}<button class="btn btn-sm" onclick="App.editContact('${ct.id}')">✏️</button><button class="btn btn-sm" onclick="App.deleteContact('${ct.id}')" style="color:var(--error)">🗑️</button></div></div>`).join('')}
      </div>`).join('');
    }
    document.getElementById('btn-new-contact').addEventListener('click', () => {
        this.showModal('Add Contact', `<div class="form-grid"><div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="ct-name"></div><div class="form-group"><label class="form-label">Company</label><input class="form-input" id="ct-co"></div><div class="form-group"><label class="form-label">Role</label><select class="form-select" id="ct-role"><option value="subcontractor">Subcontractor</option><option value="owner">Owner</option><option value="architect">Architect</option><option value="engineer">Engineer</option><option value="gc_pm">GC PM</option><option value="gc_super">GC Superintendent</option><option value="inspector">Inspector</option></select></div><div class="form-group"><label class="form-label">Email</label><input class="form-input" id="ct-email" type="email"></div><div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="ct-phone" type="tel"></div></div>`, async () => {
            const name = document.getElementById('ct-name').value.trim();
            if (!name) { this.toast('Name required', 'warning'); return; }
            const r = await API.createContact({ name, company: document.getElementById('ct-co').value.trim(), role: document.getElementById('ct-role').value, email: document.getElementById('ct-email').value.trim(), phone: document.getElementById('ct-phone').value.trim(), project_id: pid });
            if (r.error) { this.toast(r.error, 'error'); return; }
            this.closeModal(); this.toast('Contact added', 'success');
            this.renderContacts(c);
        });
    });
};
App.editContact = async function (ctId) {
    const pid = this.state.projectId;
    const res = await API.getContacts(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const ct = (res.contacts || []).find(x => x.id === ctId);
    if (!ct) { this.toast('Contact not found', 'error'); return; }
    const roles = ['subcontractor', 'owner', 'architect', 'engineer', 'gc_pm', 'gc_super', 'inspector', 'other'];
    this.showModal('Edit Contact', `<div class="form-grid"><div class="form-group"><label class="form-label">Name</label><input class="form-input" id="ce-name" value="${esc(ct.name)}"></div><div class="form-group"><label class="form-label">Company</label><input class="form-input" id="ce-co" value="${esc(ct.company || '')}"></div><div class="form-group"><label class="form-label">Role</label><select class="form-select" id="ce-role">${roles.map(r => `<option value="${r}" ${ct.role === r ? 'selected' : ''}>${formatStatus(r)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Email</label><input class="form-input" id="ce-email" type="email" value="${esc(ct.email || '')}"></div><div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="ce-phone" type="tel" value="${esc(ct.phone || '')}"></div></div>`, async () => {
        const r = await API.updateContact(ctId, { name: document.getElementById('ce-name').value.trim(), company: document.getElementById('ce-co').value.trim(), role: document.getElementById('ce-role').value, email: document.getElementById('ce-email').value.trim(), phone: document.getElementById('ce-phone').value.trim() });
        if (r.error) { this.toast(r.error, 'error'); return; }
        this.closeModal(); this.toast('Contact updated', 'success');
        this.renderContacts(document.getElementById('project-content'));
    });
};
App.deleteContact = async function (ctId) {
    if (!confirm('Delete this contact?')) return;
    const r = await API.deleteContact(ctId);
    if (r.error) { this.toast(r.error, 'error'); return; }
    this.toast('Contact deleted', 'success');
    this.renderContacts(document.getElementById('project-content'));
};

// ─── DOCUMENTS ─────────────────────────────────────────────────
App._docFileIcon = function (mimeType, filename) {
    if (!mimeType && !filename) return '📄';
    const ext = (filename || '').split('.').pop().toLowerCase();
    if (mimeType && mimeType.startsWith('image/')) return '🖼️';
    if (['pdf'].includes(ext) || mimeType === 'application/pdf') return '📕';
    if (['doc', 'docx'].includes(ext) || (mimeType && mimeType.includes('word'))) return '📘';
    if (['xls', 'xlsx', 'csv'].includes(ext) || (mimeType && mimeType.includes('spreadsheet'))) return '📗';
    if (['ppt', 'pptx'].includes(ext) || (mimeType && mimeType.includes('presentation'))) return '📙';
    if (['dwg', 'dxf'].includes(ext)) return '📐';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦';
    if (['txt', 'log', 'md'].includes(ext)) return '📝';
    return '📄';
};

App._docFormatSize = function (bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
};

App.renderDocuments = async function (c) {
    const pid = this.state.projectId;
    const canEdit = this.Permissions.can('canEditAllData') || this.Permissions.can('canEditMaterialLabor');
    const cats = ['drawings', 'specs', 'submittals', 'rfi_responses', 'correspondence', 'photos', 'close_out', 'other'];

    c.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">📁 Document Manager</h1>
                <p class="page-subtitle">Upload, organize, and manage project documents</p>
            </div>
            <div class="page-actions">
                ${canEdit ? '<button class="btn btn-primary" id="btn-upload-doc">+ Upload Document</button>' : ''}
            </div>
        </div>
        <div id="doc-drop-zone" style="border:2px dashed var(--border);border-radius:12px;padding:40px;text-align:center;margin-bottom:20px;background:var(--bg-secondary);transition:all 0.2s;cursor:pointer;">
            <div style="font-size:40px;margin-bottom:8px;">📂</div>
            <div style="font-size:15px;font-weight:600;color:var(--text-primary);">Drag & drop files here</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">or click to browse — max 5 MB per file</div>
            <input type="file" id="doc-file-input" multiple style="display:none;">
        </div>
        <div id="doc-summary" class="metric-grid" style="margin-bottom:20px;"></div>
        <div id="doc-filter" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;"></div>
        <div class="card">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:36px;"></th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Uploaded</th>
                        <th style="width:100px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="doc-body">
                    <tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">Loading documents...</td></tr>
                </tbody>
            </table>
        </div>`;

    // Load documents from API
    const res = await API.getDocuments(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const docs = res.documents || [];
    const summary = res.summary || {};

    // Render summary metrics
    document.getElementById('doc-summary').innerHTML = `
        <div class="metric-card metric-card--sky"><div class="metric-icon">📄</div><div class="metric-value">${summary.total || 0}</div><div class="metric-label">Total Documents</div></div>
        <div class="metric-card metric-card--indigo"><div class="metric-icon">💾</div><div class="metric-value">${this._docFormatSize(summary.total_size || 0)}</div><div class="metric-label">Total Size</div></div>
        <div class="metric-card metric-card--emerald"><div class="metric-icon">📁</div><div class="metric-value">${summary.categories || 0}</div><div class="metric-label">Categories Used</div></div>`;

    // Filter buttons
    const catCounts = {};
    docs.forEach(d => { catCounts[d.category] = (catCounts[d.category] || 0) + 1; });
    document.getElementById('doc-filter').innerHTML = `
        <button class="btn btn-sm doc-filter-btn active" data-cat="all">All (${docs.length})</button>
        ${cats.filter(ct => catCounts[ct]).map(ct => `<button class="btn btn-sm doc-filter-btn" data-cat="${ct}">${formatStatus(ct)} (${catCounts[ct]})</button>`).join('')}`;

    // Render document rows
    const tbody = document.getElementById('doc-body');
    if (docs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">
            <div style="font-size:32px;margin-bottom:8px;">📂</div>
            No documents uploaded yet. Drag files to the drop zone above or click "Upload Document".
        </td></tr>`;
    } else {
        tbody.innerHTML = docs.map(d => `
            <tr data-category="${esc(d.category)}" data-doc-id="${d.id}">
                <td style="font-size:22px;text-align:center;">${this._docFileIcon(d.mime_type, d.original_name)}</td>
                <td>
                    <div style="font-weight:600;">${esc(d.original_name)}</div>
                    ${d.description ? `<div style="font-size:12px;color:var(--text-muted);">${esc(d.description)}</div>` : ''}
                </td>
                <td><span class="badge badge--${d.category === 'close_out' ? 'complete' : 'active'}">${esc(formatStatus(d.category))}</span></td>
                <td style="white-space:nowrap;">${this._docFormatSize(d.file_size)}</td>
                <td style="white-space:nowrap;">${formatDate(d.created_at)}</td>
                <td>
                    <button class="btn-icon" onclick="App.downloadDocument('${d.id}')" title="Download">⬇️</button>
                    ${canEdit ? `<button class="btn-icon" onclick="App.deleteDocument('${d.id}', '${esc(d.original_name).replace(/'/g, "\\'")}')" title="Delete">🗑️</button>` : ''}
                </td>
            </tr>`).join('');
    }

    // Category filter logic
    document.querySelectorAll('.doc-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.doc-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.dataset.cat;
            document.querySelectorAll('#doc-body tr[data-category]').forEach(row => {
                row.style.display = (cat === 'all' || row.dataset.category === cat) ? '' : 'none';
            });
        });
    });

    // Upload button
    const uploadBtn = document.getElementById('btn-upload-doc');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => this._showDocUploadModal(cats));
    }

    // Drag and drop zone
    const dropZone = document.getElementById('doc-drop-zone');
    const fileInput = document.getElementById('doc-file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
        dropZone.style.background = 'var(--primary-light, rgba(59,130,246,0.05))';
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'var(--bg-secondary)';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'var(--bg-secondary)';
        if (e.dataTransfer.files.length > 0) {
            this._handleDocFiles(Array.from(e.dataTransfer.files), cats);
        }
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            this._handleDocFiles(Array.from(fileInput.files), cats);
        }
    });
};

App._showDocUploadModal = function (cats) {
    this.showModal('Upload Document', `
        <div class="form-grid">
            <div class="form-group form-full">
                <label class="form-label">File *</label>
                <input class="form-input" id="doc-upload-file" type="file">
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Maximum 5 MB per file</div>
            </div>
            <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-select" id="doc-upload-cat">
                    ${cats.map(ct => `<option value="${ct}">${formatStatus(ct)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <input class="form-input" id="doc-upload-desc" placeholder="Optional description">
            </div>
        </div>`, async () => {
        const fileInput = document.getElementById('doc-upload-file');
        const category = document.getElementById('doc-upload-cat').value;
        const description = document.getElementById('doc-upload-desc').value.trim();

        if (!fileInput.files || fileInput.files.length === 0) {
            this.toast('Please select a file', 'warning');
            return;
        }

        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
            this.toast('File exceeds 5 MB limit', 'error');
            return;
        }

        await this._uploadSingleFile(file, category, description);
    });
};

App._handleDocFiles = function (files, cats) {
    if (files.length === 1) {
        // Single file — show category picker modal
        const file = files[0];
        if (file.size > 5 * 1024 * 1024) {
            this.toast(`"${file.name}" exceeds 5 MB limit`, 'error');
            return;
        }
        this.showModal('Upload: ' + esc(file.name), `
            <div class="form-grid">
                <div class="form-group form-full">
                    <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-secondary);border-radius:8px;">
                        <span style="font-size:28px;">${this._docFileIcon(file.type, file.name)}</span>
                        <div>
                            <div style="font-weight:600;">${esc(file.name)}</div>
                            <div style="font-size:12px;color:var(--text-muted);">${this._docFormatSize(file.size)} &middot; ${esc(file.type || 'Unknown type')}</div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Category *</label>
                    <select class="form-select" id="doc-drop-cat">
                        ${cats.map(ct => `<option value="${ct}">${formatStatus(ct)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input class="form-input" id="doc-drop-desc" placeholder="Optional description">
                </div>
            </div>`, async () => {
            const category = document.getElementById('doc-drop-cat').value;
            const description = document.getElementById('doc-drop-desc').value.trim();
            await this._uploadSingleFile(file, category, description);
        });
    } else {
        // Multiple files — upload all as 'other' category with a confirmation
        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
        const skipped = files.length - validFiles.length;
        if (skipped > 0) this.toast(`${skipped} file(s) skipped (exceed 5 MB)`, 'warning');
        if (validFiles.length === 0) return;

        this.showModal(`Upload ${validFiles.length} Files`, `
            <div class="form-grid">
                <div class="form-group form-full">
                    <div style="max-height:200px;overflow-y:auto;">
                        ${validFiles.map(f => `
                            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
                                <span>${this._docFileIcon(f.type, f.name)}</span>
                                <span style="flex:1;font-size:13px;">${esc(f.name)}</span>
                                <span style="font-size:12px;color:var(--text-muted);">${this._docFormatSize(f.size)}</span>
                            </div>`).join('')}
                    </div>
                </div>
                <div class="form-group form-full">
                    <label class="form-label">Category for all files</label>
                    <select class="form-select" id="doc-batch-cat">
                        ${cats.map(ct => `<option value="${ct}">${formatStatus(ct)}</option>`).join('')}
                    </select>
                </div>
            </div>`, async () => {
            const category = document.getElementById('doc-batch-cat').value;
            let uploaded = 0;
            for (const f of validFiles) {
                try {
                    await this._uploadSingleFile(f, category, '', false);
                    uploaded++;
                } catch (e) {
                    this.toast(`Failed to upload ${f.name}`, 'error');
                }
            }
            this.toast(`${uploaded} of ${validFiles.length} files uploaded`, 'success');
            this.closeModal();
            this.renderDocuments(document.getElementById('project-content'));
        });
    }
};

App._uploadSingleFile = async function (file, category, description, refreshAfter = true) {
    const pid = this.state.projectId;

    // Read file as base64
    const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data:...;base64, prefix
            const result = reader.result;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const res = await API.uploadDocument(pid, {
        name: file.name,
        type: file.type || 'application/octet-stream',
        category: category,
        base64Data: base64Data,
        size: file.size,
        description: description || null,
    });

    if (res.error) {
        this.toast(res.error, 'error');
        return;
    }

    if (refreshAfter) {
        this.closeModal();
        this.toast(`"${file.name}" uploaded successfully`, 'success');
        this.renderDocuments(document.getElementById('project-content'));
    }
};

App.downloadDocument = async function (docId) {
    const pid = this.state.projectId;
    this.toast('Preparing download...', 'info');

    const res = await API.getDocument(pid, docId);
    if (res.error) { this.toast(res.error, 'error'); return; }

    const doc = res.document;
    const base64Data = res.base64Data;

    if (!base64Data) { this.toast('No file content available', 'error'); return; }

    // Convert base64 to blob and trigger download
    const byteChars = atob(base64Data);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: doc.mime_type || 'application/octet-stream' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.original_name || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

App.deleteDocument = async function (docId, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const pid = this.state.projectId;
    const res = await API.deleteDocument(pid, docId);
    if (res.error) { this.toast(res.error, 'error'); return; }
    this.toast('Document deleted', 'success');
    this.renderDocuments(document.getElementById('project-content'));
};

// ─── PROJECT SETTINGS ──────────────────────────────────────────
App.renderProjectSettings = async function (c) {
    const p = this.state.currentProject;
    if (!p) return;
    const statuses = ['bidding', 'awarded', 'active', 'on_hold', 'punch_list', 'closeout', 'complete'];
    const types = ['new_construction', 'renovation', 'tenant_improvement', 'design_build', 'service'];
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">⚙️ Project Settings</h1><p class="page-subtitle">Edit project details and configuration</p></div></div>
  <div class="card"><div class="card-header"><div class="card-title">Project Information</div></div><div class="form-grid">
    <div class="form-group form-full"><label class="form-label">Project Name</label><input class="form-input" id="ps-name" value="${esc(p.name || '')}"></div>
    <div class="form-group"><label class="form-label">Project Number</label><input class="form-input" id="ps-num" value="${esc(p.project_number || '')}"></div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="ps-status">${statuses.map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${formatStatus(s)}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Type</label><select class="form-select" id="ps-type"><option value="">Select...</option>${types.map(t => `<option value="${t}" ${p.type === t ? 'selected' : ''}>${t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Contract Value ($)</label><input class="form-input" id="ps-val" type="number" step="0.01" value="${p.original_contract_value || 0}"></div>
    <hr class="form-divider" style="grid-column:1/-1;">
    <div class="form-section-title" style="grid-column:1/-1;">Client / GC</div>
    <div class="form-group"><label class="form-label">Client Name</label><input class="form-input" id="ps-client" value="${esc(p.client_name || '')}"></div>
    <div class="form-group"><label class="form-label">GC Name</label><input class="form-input" id="ps-gc" value="${esc(p.gc_name || '')}"></div>
    <div class="form-group"><label class="form-label">Client Email</label><input class="form-input" id="ps-cemail" value="${esc(p.client_email || '')}"></div>
    <div class="form-group"><label class="form-label">GC Email</label><input class="form-input" id="ps-gemail" value="${esc(p.gc_email || '')}"></div>
    <hr class="form-divider" style="grid-column:1/-1;">
    <div class="form-section-title" style="grid-column:1/-1;">Location</div>
    <div class="form-group form-full"><label class="form-label">Address</label><input class="form-input" id="ps-addr" value="${esc(p.address || '')}"></div>
    <div class="form-group"><label class="form-label">City</label><input class="form-input" id="ps-city" value="${esc(p.city || '')}"></div>
    <div class="form-group"><label class="form-label">State</label><input class="form-input" id="ps-state" value="${esc(p.state || '')}"></div>
    <hr class="form-divider" style="grid-column:1/-1;">
    <div class="form-section-title" style="grid-column:1/-1;">Dates</div>
    <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" id="ps-start" type="date" value="${p.start_date || ''}"></div>
    <div class="form-group"><label class="form-label">Substantial Completion</label><input class="form-input" id="ps-subcomp" type="date" value="${p.substantial_completion || ''}"></div>
    <div class="form-group"><label class="form-label">Final Completion</label><input class="form-input" id="ps-final" type="date" value="${p.final_completion || ''}"></div>
    <div class="form-group"><label class="form-label">Retainage %</label><input class="form-input" id="ps-ret" type="number" step="0.5" value="${p.retainage_pct || 10}"></div>
  </div><div style="margin-top:20px;text-align:right;"><button class="btn btn-primary" id="btn-save-settings">💾 Save Settings</button></div></div>`;
    document.getElementById('btn-save-settings').addEventListener('click', async () => {
        const val = parseFloat(document.getElementById('ps-val').value) || 0;
        const res = await API.updateProject(p.id, {
            name: document.getElementById('ps-name').value.trim(),
            project_number: document.getElementById('ps-num').value.trim(),
            status: document.getElementById('ps-status').value,
            type: document.getElementById('ps-type').value,
            original_contract_value: val, current_contract_value: val,
            client_name: document.getElementById('ps-client').value.trim(),
            gc_name: document.getElementById('ps-gc').value.trim(),
            client_email: document.getElementById('ps-cemail').value.trim(),
            gc_email: document.getElementById('ps-gemail').value.trim(),
            address: document.getElementById('ps-addr').value.trim(),
            city: document.getElementById('ps-city').value.trim(),
            state: document.getElementById('ps-state').value.trim(),
            start_date: document.getElementById('ps-start').value || null,
            substantial_completion: document.getElementById('ps-subcomp').value || null,
            final_completion: document.getElementById('ps-final').value || null,
            retainage_pct: parseFloat(document.getElementById('ps-ret').value) || 10,
        });
        if (res.error) { this.toast(res.error, 'error'); return; }
        this.toast('Settings saved!', 'success');
        this.state.currentProject = { ...p, name: document.getElementById('ps-name').value.trim() };
        const nameEl = document.getElementById('sidebar-project-name');
        if (nameEl) nameEl.textContent = this.state.currentProject.name;
    });
};

// ═══════════════════════════════════════════════════════════════
// DAILY REPORT — Generate emailable daily status report
// ═══════════════════════════════════════════════════════════════
App.renderDailyReport = async function (c) {
  const pid = this.state.projectId;
  const p = this.state.currentProject || {};
  const today = new Date().toISOString().split('T')[0];

  c.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">📧 Daily Status Report</h1>
        <p class="page-subtitle">Generate a daily progress report to email to the Project Manager or stakeholders</p>
      </div>
    </div>
    <div class="card" style="padding:24px;margin-bottom:20px;">
      <div style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap;">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Report Date</label>
          <input class="form-input" type="date" id="report-date" value="${today}" style="width:200px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Recipient Email</label>
          <input class="form-input" type="email" id="report-email" value="${esc(p.gc_email || p.client_email || '')}" placeholder="pm@company.com" style="width:300px;">
        </div>
        <button class="btn btn-primary" id="btn-generate-report">📊 Generate Report</button>
      </div>
    </div>
    <div id="report-output" style="display:none;">
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="background:var(--primary);color:white;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-weight:700;font-size:16px;">📋 Daily Status Report</div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm" id="btn-copy-report" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);">📋 Copy to Clipboard</button>
            <button class="btn btn-sm" id="btn-email-report" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);">📧 Email Report</button>
          </div>
        </div>
        <div id="report-body" style="padding:24px;font-size:14px;line-height:1.8;"></div>
      </div>
    </div>`;

  document.getElementById('btn-generate-report').addEventListener('click', () => this._generateDailyReport(pid, p));
};

App._generateDailyReport = async function (pid, project) {
  const reportDate = document.getElementById('report-date').value;
  const email = document.getElementById('report-email').value.trim();
  const dateDisplay = new Date(reportDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  this.toast('Generating report...', 'info');
  const [wbsRes, infraRes] = await Promise.all([
    API.getWBS(pid),
    API.getLocations(pid),
  ]);
  const wbs = wbsRes.tasks || [];
  const totals = wbsRes.totals || {};
  const locations = infraRes.locations || [];

  const matPct = totals.budgeted_material > 0 ? ((totals.actual_material / totals.budgeted_material) * 100).toFixed(1) : '0.0';
  const labPct = totals.budgeted_labor_hrs > 0 ? ((totals.actual_labor_hrs / totals.budgeted_labor_hrs) * 100).toFixed(1) : '0.0';

  let html = '';
  html += '<div style="border-bottom:2px solid rgba(191,144,0,0.5);padding-bottom:16px;margin-bottom:20px;">';
  html += '<div style="font-size:22px;font-weight:800;color:var(--primary);">' + esc(project.name || 'Project') + '</div>';
  html += '<div style="font-size:14px;color:var(--text-secondary);margin-top:4px;">Daily Status Report \u2014 ' + dateDisplay + '</div>';
  html += '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Generated by SmartPM \u00b7 3D Technology Services Inc.</div>';
  html += '</div>';

  html += '<div style="font-weight:700;font-size:16px;margin-bottom:12px;color:var(--primary);">\ud83d\udcca Project Summary</div>';
  html += '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">';
  html += '<tr><td style="padding:6px 12px;border:1px solid var(--border);font-weight:600;width:200px;">Contract Value</td><td style="padding:6px 12px;border:1px solid var(--border);">$' + formatMoney(project.current_contract_value || 0) + '</td></tr>';
  html += '<tr><td style="padding:6px 12px;border:1px solid var(--border);font-weight:600;">Overall Progress</td><td style="padding:6px 12px;border:1px solid var(--border);">' + (totals.overall_progress || 0).toFixed(1) + '%</td></tr>';
  html += '<tr><td style="padding:6px 12px;border:1px solid var(--border);font-weight:600;">Health Status</td><td style="padding:6px 12px;border:1px solid var(--border);">' + (totals.overall_health === 'green' ? '\ud83d\udfe2 On Track' : totals.overall_health === 'yellow' ? '\ud83d\udfe1 Caution' : '\ud83d\udd34 Over Budget') + '</td></tr>';
  html += '<tr><td style="padding:6px 12px;border:1px solid var(--border);font-weight:600;">Tasks Complete</td><td style="padding:6px 12px;border:1px solid var(--border);">' + (totals.complete || 0) + ' / ' + (totals.total_tasks || 0) + '</td></tr>';
  html += '</table>';

  html += '<div style="font-weight:700;font-size:16px;margin-bottom:12px;color:var(--primary);">\ud83d\udcb0 Budget Status</div>';
  html += '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">';
  html += '<tr style="background:var(--bg-surface);"><th style="padding:8px 12px;border:1px solid var(--border);text-align:left;">Category</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:right;">Budgeted</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:right;">Actual</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:right;">% Used</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:center;">Status</th></tr>';
  html += '<tr><td style="padding:6px 12px;border:1px solid var(--border);font-weight:600;">Material Cost</td><td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">$' + formatMoney(totals.budgeted_material) + '</td><td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">$' + formatMoney(totals.actual_material) + '</td><td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">' + matPct + '%</td><td style="padding:6px 12px;border:1px solid var(--border);text-align:center;">' + (totals.material_health === 'green' ? '\ud83d\udfe2' : totals.material_health === 'yellow' ? '\ud83d\udfe1' : '\ud83d\udd34') + '</td></tr>';
  html += '<tr><td style="padding:6px 12px;border:1px solid var(--border);font-weight:600;">Labor Hours</td><td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">' + (totals.budgeted_labor_hrs || 0).toFixed(1) + ' hrs</td><td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">' + (totals.actual_labor_hrs || 0).toFixed(1) + ' hrs</td><td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">' + labPct + '%</td><td style="padding:6px 12px;border:1px solid var(--border);text-align:center;">' + (totals.labor_health === 'green' ? '\ud83d\udfe2' : totals.labor_health === 'yellow' ? '\ud83d\udfe1' : '\ud83d\udd34') + '</td></tr>';
  html += '</table>';

  if (wbs.length > 0) {
    html += '<div style="font-weight:700;font-size:16px;margin-bottom:12px;color:var(--primary);">\ud83d\udcd0 Phase Progress</div>';
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">';
    html += '<tr style="background:var(--bg-surface);"><th style="padding:8px 12px;border:1px solid var(--border);text-align:left;">Phase</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:right;">Progress</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:right;">Material</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:right;">Labor</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:center;">Status</th></tr>';
    for (const phase of wbs) {
      html += '<tr><td style="padding:6px 12px;border:1px solid var(--border);font-weight:600;">' + esc(phase.title) + '</td>';
      html += '<td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">' + (phase.progress_pct || 0).toFixed(0) + '%</td>';
      html += '<td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">$' + formatMoney(phase.actual_material) + ' / $' + formatMoney(phase.budgeted_material) + '</td>';
      html += '<td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">' + (phase.actual_labor_hrs || 0).toFixed(1) + ' / ' + (phase.budgeted_labor_hrs || 0).toFixed(1) + ' hrs</td>';
      html += '<td style="padding:6px 12px;border:1px solid var(--border);text-align:center;">' + (phase.status === 'complete' ? '\u2705' : phase.status === 'in_progress' ? '\ud83d\udd04' : '\u2b1c') + '</td></tr>';
    }
    html += '</table>';
  }

  if (locations.length > 0) {
    html += '<div style="font-weight:700;font-size:16px;margin-bottom:12px;color:var(--primary);">\ud83c\udfe2 Infrastructure (' + locations.length + ' locations)</div>';
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">';
    html += '<tr style="background:var(--bg-surface);"><th style="padding:8px 12px;border:1px solid var(--border);text-align:left;">Location</th><th style="padding:8px 12px;border:1px solid var(--border);">Type</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:right;">Equipment</th><th style="padding:8px 12px;border:1px solid var(--border);text-align:right;">Cable Runs</th></tr>';
    for (const loc of locations.slice(0, 15)) {
      html += '<tr><td style="padding:6px 12px;border:1px solid var(--border);font-weight:600;">' + esc(loc.name) + '</td>';
      html += '<td style="padding:6px 12px;border:1px solid var(--border);">' + (loc.type || 'idf').toUpperCase() + '</td>';
      html += '<td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">' + (loc.item_count || 0) + '</td>';
      html += '<td style="padding:6px 12px;border:1px solid var(--border);text-align:right;">' + (loc.run_count || 0) + '</td></tr>';
    }
    html += '</table>';
  }

  html += '<div style="border-top:2px solid rgba(191,144,0,0.5);padding-top:12px;margin-top:20px;font-size:12px;color:var(--text-muted);">';
  html += 'Report generated on ' + new Date().toLocaleString('en-US') + ' by SmartPM \u2014 3D Technology Services Inc. \u00b7 www.3dtsi.com';
  html += '</div>';

  document.getElementById('report-output').style.display = 'block';
  document.getElementById('report-body').innerHTML = html;

  const plainText = 'DAILY STATUS REPORT\n' + (project.name || 'Project') + '\n' + dateDisplay + '\n' + '='.repeat(50) + '\n\nProject Summary:\n- Contract Value: $' + formatMoney(project.current_contract_value || 0) + '\n- Overall Progress: ' + (totals.overall_progress || 0).toFixed(1) + '%\n- Health: ' + (totals.overall_health === 'green' ? 'On Track' : totals.overall_health === 'yellow' ? 'Caution' : 'Over Budget') + '\n- Tasks Complete: ' + (totals.complete || 0) + ' / ' + (totals.total_tasks || 0) + '\n\nBudget:\n- Material: $' + formatMoney(totals.actual_material) + ' / $' + formatMoney(totals.budgeted_material) + ' (' + matPct + '%)\n- Labor: ' + (totals.actual_labor_hrs || 0).toFixed(1) + ' / ' + (totals.budgeted_labor_hrs || 0).toFixed(1) + ' hrs (' + labPct + '%)\n\nPhase Progress:\n' + wbs.map(function (ph) { return ph.title + ': ' + (ph.progress_pct || 0).toFixed(0) + '% | Mat: $' + formatMoney(ph.actual_material) + '/$' + formatMoney(ph.budgeted_material) + ' | Labor: ' + (ph.actual_labor_hrs || 0).toFixed(1) + '/' + (ph.budgeted_labor_hrs || 0).toFixed(1) + ' hrs'; }).join('\n') + '\n\nGenerated by SmartPM - 3D Technology Services Inc.';

  this._reportText = plainText;
  this._reportSubject = 'Daily Status Report - ' + (project.name || 'Project') + ' - ' + dateDisplay;

  document.getElementById('btn-copy-report').addEventListener('click', function () {
    navigator.clipboard.writeText(plainText).then(function () {
      App.toast('Report copied to clipboard!', 'success');
    }).catch(function () {
      var ta = document.createElement('textarea');
      ta.value = plainText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      App.toast('Report copied!', 'success');
    });
  });

  document.getElementById('btn-email-report').addEventListener('click', function () {
    var to = email || '';
    var subject = encodeURIComponent(App._reportSubject);
    var body = encodeURIComponent(plainText);
    window.open('mailto:' + to + '?subject=' + subject + '&body=' + body, '_blank');
    App.toast('Email client opened!', 'info');
  });

  this.toast('Report generated!', 'success');
};
/* build 1774617976 */
