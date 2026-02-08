// ═══════════════════════════════════════════════════════════════
// SMARTPM — INFRASTRUCTURE MODULE (MDF/IDF Tracker)
// AI-Driven Installation Tracking with Budget Lock
//
// BUDGET LOCK POLICY:
//   Budgeted values come from SmartPlans AI analysis.
//   Only Admin/Ops Mgr can modify budgets.
//   PMs can only update installed quantities, actual costs, and status.
//   This prevents field manipulation of budget targets.
// ═══════════════════════════════════════════════════════════════

App.renderInfrastructure = async function (c) {
  const canBudget = this.Permissions.can('canEditInfraBudget');
  c.innerHTML = `<div class="page-header"><div><h1 class="page-title">🏢 Infrastructure</h1><p class="page-subtitle">MDF / IDF installation tracking — AI-driven budget control 🔒</p></div><div class="page-actions">${canBudget ? '<button class="btn btn-primary" id="btn-add-loc">+ Add Location</button>' : ''}</div></div><div id="infra-totals" class="metric-grid" style="margin-bottom:20px;"></div><div id="infra-locations"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-title">Loading...</div></div></div>`;
  const pid = this.state.projectId;
  const res = await API.getInfrastructure(pid);
  if (res.error) { this.toast(res.error, 'error'); return; }
  const locations = res.locations || [];
  const t = res.totals || {};

  // Render totals
  const matPct = t.budgeted_material > 0 ? ((t.actual_material / t.budgeted_material) * 100).toFixed(0) : 0;
  const labPct = t.budgeted_labor > 0 ? ((t.actual_labor / t.budgeted_labor) * 100).toFixed(0) : 0;
  document.getElementById('infra-totals').innerHTML = `
    <div class="metric-card metric-card--sky"><div class="metric-icon">🏢</div><div class="metric-value">${t.mdf_count || 0} MDF / ${t.idf_count || 0} IDF</div><div class="metric-label">Locations</div></div>
    <div class="metric-card ${t.material_over ? 'metric-card--rose' : 'metric-card--emerald'}"><div class="metric-icon">${t.material_over ? '🚨' : '📦'}</div><div class="metric-value">$${formatMoney(t.actual_material)} / $${formatMoney(t.budgeted_material)}</div><div class="metric-label">Material ${matPct}%${t.material_over ? ' — OVER BUDGET' : ''}</div></div>
    <div class="metric-card ${t.labor_over ? 'metric-card--rose' : 'metric-card--amber'}"><div class="metric-icon">${t.labor_over ? '🚨' : '⏱️'}</div><div class="metric-value">${(t.actual_labor || 0).toFixed(1)} / ${(t.budgeted_labor || 0).toFixed(1)} hrs</div><div class="metric-label">Labor ${labPct}%${t.labor_over ? ' — OVER BUDGET' : ''}</div></div>
    <div class="metric-card metric-card--indigo"><div class="metric-icon">🔌</div><div class="metric-value">${t.complete_runs || 0} / ${t.total_runs || 0}</div><div class="metric-label">Cable Runs Complete</div></div>`;

  const list = document.getElementById('infra-locations');
  if (locations.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏢</div><div class="empty-state-title">No Locations Yet</div><div class="empty-state-desc">${canBudget ? 'Add MDF and IDF rooms to start tracking installations.' : 'Locations are auto-created when a SmartPlans estimate is imported.'}</div></div>`;
  } else {
    list.innerHTML = locations.map(loc => {
      const s = loc.summary;
      const typeColors = { mdf: 'sky', idf: 'emerald', tr: 'amber' };
      const typeColor = typeColors[loc.type] || 'indigo';
      const matW = s.budgeted_material > 0 ? Math.min((s.actual_material / s.budgeted_material) * 100, 100) : 0;
      const labW = s.budgeted_labor > 0 ? Math.min((s.actual_labor / s.budgeted_labor) * 100, 100) : 0;
      return `<div class="card infra-card" style="margin-bottom:16px;cursor:pointer;" onclick="App.viewLocation('${loc.id}')">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span class="badge badge--${typeColor}" style="font-weight:700;">${loc.type.toUpperCase()}</span>
                  <div><div style="font-weight:700;font-size:15px;">${esc(loc.name)}</div>
                  <div style="font-size:12px;color:var(--text-muted);">${[loc.building, loc.floor ? 'Floor ' + loc.floor : '', loc.room_number ? 'Rm ' + loc.room_number : ''].filter(Boolean).join(' · ') || 'No location details'}</div></div>
                </div>
                <div style="display:flex;gap:6px;">
                  ${s.material_over ? '<span class="badge badge--rose" style="font-size:10px;">⚠ MATERIAL OVER</span>' : ''}
                  ${s.labor_over ? '<span class="badge badge--rose" style="font-size:10px;">⚠ LABOR OVER</span>' : ''}
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:12px;margin-bottom:10px;">
                <div><div style="color:var(--text-muted);">Equipment</div><div style="font-weight:600;">${s.installed_items}/${s.total_items} installed</div></div>
                <div><div style="color:var(--text-muted);">Cable Runs</div><div style="font-weight:600;">${s.complete_runs}/${s.total_runs} complete</div></div>
                <div><div style="color:var(--text-muted);">Material 🔒</div><div style="font-weight:600;${s.material_over ? 'color:var(--error)' : ''}">$${formatMoney(s.actual_material)} / $${formatMoney(s.budgeted_material)}</div></div>
                <div><div style="color:var(--text-muted);">Labor 🔒</div><div style="font-weight:600;${s.labor_over ? 'color:var(--error)' : ''};">${(s.actual_labor || 0).toFixed(1)} / ${(s.budgeted_labor || 0).toFixed(1)} hrs</div></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">Material Budget</div><div class="progress-bar" style="height:6px;"><div class="progress-fill" style="width:${matW}%;${s.material_over ? 'background:var(--error)' : ''}"></div></div></div>
                <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">Labor Budget</div><div class="progress-bar" style="height:6px;"><div class="progress-fill" style="width:${labW}%;${s.labor_over ? 'background:var(--error)' : ''}"></div></div></div>
              </div>
            </div>`;
    }).join('');
  }
  const addBtn = document.getElementById('btn-add-loc');
  if (addBtn) addBtn.addEventListener('click', () => this.addLocation());
};

// ── Add Location Modal ─────────────────────────────────────
App.addLocation = function () {
  if (!this.Permissions.can('canEditInfraBudget')) { this.toast('Only Admin/Ops Mgr can add locations', 'warning'); return; }
  const pid = this.state.projectId;
  this.showModal('Add Location', `<div class="form-grid">
      <div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="loc-name" placeholder="e.g. MDF-1, IDF-2A"></div>
      <div class="form-group"><label class="form-label">Type *</label><select class="form-select" id="loc-type"><option value="mdf">MDF</option><option value="idf" selected>IDF</option><option value="tr">TR (Telecom Room)</option></select></div>
      <div class="form-group"><label class="form-label">Building</label><input class="form-input" id="loc-bldg" placeholder="Building name"></div>
      <div class="form-group"><label class="form-label">Floor</label><input class="form-input" id="loc-floor" placeholder="e.g. 1, 2, B1"></div>
      <div class="form-group"><label class="form-label">Room Number</label><input class="form-input" id="loc-room" placeholder="Room #"></div>
      <div class="form-group form-full"><label class="form-label">Description</label><textarea class="form-input" id="loc-desc" rows="2" placeholder="Notes about this location..."></textarea></div>
    </div>`, async () => {
    const name = document.getElementById('loc-name').value.trim();
    if (!name) { this.toast('Name is required', 'warning'); return; }
    const res = await API.createLocation(pid, { name, type: document.getElementById('loc-type').value, building: document.getElementById('loc-bldg').value.trim(), floor: document.getElementById('loc-floor').value.trim(), room_number: document.getElementById('loc-room').value.trim(), description: document.getElementById('loc-desc').value.trim() });
    if (res.error) { this.toast(res.error, 'error'); return; }
    this.closeModal(); this.toast(`${document.getElementById('loc-type').value.toUpperCase()} "${name}" created`, 'success');
    this.renderInfrastructure(document.getElementById('project-content'));
  });
};

// ── View Location Detail ───────────────────────────────────
App.viewLocation = async function (locId) {
  const pid = this.state.projectId;
  const res = await API.getLocation(pid, locId);
  if (res.error) { this.toast(res.error, 'error'); return; }
  const loc = res.location;
  const items = res.items || [];
  const runs = res.runs || [];
  const labor = res.labor || [];
  const s = res.summary || {};
  this._currentLocId = locId;
  this._currentLocData = res;
  const canBudget = this.Permissions.can('canEditInfraBudget');
  const canEdit = this.Permissions.can('canEditMaterialLabor');

  const c = document.getElementById('project-content');
  const matPct = s.budgeted_material > 0 ? ((s.actual_material / s.budgeted_material) * 100).toFixed(0) : 0;
  const labPct = s.budgeted_labor > 0 ? ((s.actual_labor / s.budgeted_labor) * 100).toFixed(0) : 0;

  c.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title"><span class="badge badge--${loc.type === 'mdf' ? 'sky' : loc.type === 'tr' ? 'amber' : 'emerald'}" style="font-size:14px;margin-right:8px;">${loc.type.toUpperCase()}</span>${esc(loc.name)}</h1>
        <p class="page-subtitle">${[loc.building, loc.floor ? 'Floor ' + loc.floor : '', loc.room_number ? 'Rm ' + loc.room_number : ''].filter(Boolean).join(' · ') || 'Infrastructure Location'}${loc.description === 'AI-imported from SmartPlans analysis' ? ' · <span style="color:var(--primary);font-weight:600;">🤖 AI-Imported</span>' : ''}</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="btn-back-infra">← Back</button>
        ${canBudget ? '<button class="btn btn-danger" id="btn-del-loc" style="font-size:12px;">🗑 Delete</button>' : ''}
      </div>
    </div>
    <div class="metric-grid" style="margin-bottom:20px;">
      <div class="metric-card ${s.material_over ? 'metric-card--rose' : 'metric-card--emerald'}"><div class="metric-icon">${s.material_over ? '🚨' : '📦'}</div><div class="metric-value">$${formatMoney(s.actual_material)} / $${formatMoney(s.budgeted_material)}</div><div class="metric-label">Material ${matPct}% 🔒</div></div>
      <div class="metric-card ${s.labor_over ? 'metric-card--rose' : 'metric-card--amber'}"><div class="metric-icon">${s.labor_over ? '🚨' : '⏱️'}</div><div class="metric-value">${(s.actual_labor || 0).toFixed(1)} / ${(s.budgeted_labor || 0).toFixed(1)} hrs</div><div class="metric-label">Labor ${labPct}% 🔒</div></div>
      <div class="metric-card metric-card--indigo"><div class="metric-icon">🔌</div><div class="metric-value">${formatMoney(s.installed_cable_ft)} / ${formatMoney(s.budgeted_cable_ft)} ft</div><div class="metric-label">Cable Installed</div></div>
    </div>

    <!-- TABS -->
    <div class="infra-tabs" style="display:flex;gap:4px;margin-bottom:16px;">
      <button class="btn btn-sm infra-tab active" data-tab="equipment">📦 Equipment (${items.length})</button>
      <button class="btn btn-sm infra-tab" data-tab="runs">🔌 Cable Runs (${runs.length})</button>
      <button class="btn btn-sm infra-tab" data-tab="labor">⏱️ Labor (${labor.length})</button>
    </div>

    <!-- EQUIPMENT TAB -->
    <div id="tab-equipment" class="infra-tab-content">
      <div style="margin-bottom:12px;">${canBudget ? '<button class="btn btn-primary btn-sm" id="btn-add-item">+ Add Equipment</button>' : ''}</div>
      ${items.length === 0 ? '<div class="card" style="padding:30px;text-align:center;color:var(--text-muted);">No equipment — items auto-populate from SmartPlans import.</div>' :
      `<div class="card"><table class="data-table"><thead><tr><th>Category</th><th>Item</th><th>Model</th><th style="text-align:right">Budget Qty 🔒</th><th style="text-align:right">Installed</th><th style="text-align:right">Budget $ 🔒</th><th style="text-align:right">Actual $</th><th>Status</th>${canEdit ? '<th></th>' : ''}</tr></thead><tbody>${items.map(i => {
        const over = i.actual_cost > i.budgeted_cost && i.budgeted_cost > 0;
        return `<tr><td><span class="badge badge--sky" style="font-size:10px;">${esc(i.category)}</span></td><td><strong>${esc(i.item_name)}</strong></td><td style="font-size:12px;">${esc(i.model || '—')}</td><td style="text-align:right">${i.budgeted_qty} ${esc(i.unit)}</td><td style="text-align:right;font-weight:600;">${i.installed_qty} ${esc(i.unit)}</td><td style="text-align:right">$${formatMoney(i.budgeted_cost)}</td><td style="text-align:right;font-weight:600;${over ? 'color:var(--error)' : ''}">$${formatMoney(i.actual_cost)}${over ? ' ⚠' : ''}</td><td><span class="badge badge--${i.status === 'installed' || i.status === 'tested' ? 'active' : i.status === 'ordered' ? 'amber' : 'draft'}">${formatStatus(i.status)}</span></td>${canEdit ? `<td><button class="btn-icon" onclick="App.editItem('${i.id}',${JSON.stringify(i).replace(/"/g, '&quot;')})">✏️</button>${canBudget ? `<button class="btn-icon" onclick="App.deleteInfraEntity('item','${i.id}')">🗑️</button>` : ''}</td>` : ''}</tr>`;
      }).join('')}</tbody></table></div>`}
    </div>

    <!-- CABLE RUNS TAB -->
    <div id="tab-runs" class="infra-tab-content" style="display:none;">
      <div style="margin-bottom:12px;">${canBudget ? '<button class="btn btn-primary btn-sm" id="btn-add-run">+ Add Cable Run</button>' : ''}</div>
      ${runs.length === 0 ? '<div class="card" style="padding:30px;text-align:center;color:var(--text-muted);">No cable runs — runs auto-populate from SmartPlans import.</div>' :
      `<div class="card"><table class="data-table"><thead><tr><th>Label</th><th>Type</th><th>Destination</th><th>Pathway</th><th style="text-align:right">Budget ft 🔒</th><th style="text-align:right">Installed ft</th><th style="text-align:right">Labor Hrs</th><th>Status</th>${canEdit ? '<th></th>' : ''}</tr></thead><tbody>${runs.map(r => {
        const labOver = r.actual_labor_hrs > r.budgeted_labor_hrs && r.budgeted_labor_hrs > 0;
        return `<tr><td><strong>${esc(r.run_label || '—')}</strong></td><td><span class="badge badge--indigo" style="font-size:10px;">${esc(r.cable_type)}</span></td><td>${esc(r.destination)}${r.destination_floor ? ' (Fl ' + esc(r.destination_floor) + ')' : ''}</td><td style="font-size:12px;">${esc(r.pathway || '—')}</td><td style="text-align:right">${formatMoney(r.budgeted_qty)}</td><td style="text-align:right;font-weight:600;">${formatMoney(r.installed_qty)}</td><td style="text-align:right;${labOver ? 'color:var(--error);font-weight:600' : ''}">${(r.actual_labor_hrs || 0).toFixed(1)} / ${(r.budgeted_labor_hrs || 0).toFixed(1)}${labOver ? ' ⚠' : ''}</td><td><span class="badge badge--${r.status === 'tested' || r.status === 'labeled' ? 'active' : r.status === 'pulled' || r.status === 'terminated' ? 'amber' : 'draft'}">${formatStatus(r.status)}</span></td>${canEdit ? `<td><button class="btn-icon" onclick="App.editRun('${r.id}',${JSON.stringify(r).replace(/"/g, '&quot;')})">✏️</button>${canBudget ? `<button class="btn-icon" onclick="App.deleteInfraEntity('run','${r.id}')">🗑️</button>` : ''}</td>` : ''}</tr>`;
      }).join('')}</tbody></table></div>`}
    </div>

    <!-- LABOR TAB -->
    <div id="tab-labor" class="infra-tab-content" style="display:none;">
      <div style="margin-bottom:12px;">${canEdit ? '<button class="btn btn-primary btn-sm" id="btn-add-labor">+ Add Labor Entry</button>' : ''}</div>
      ${labor.length === 0 ? '<div class="card" style="padding:30px;text-align:center;color:var(--text-muted);">No labor entries added yet.</div>' :
      `<div class="card"><table class="data-table"><thead><tr><th>Task</th><th>Description</th><th>Date</th><th style="text-align:right">Crew</th><th style="text-align:right">Budget Hrs 🔒</th><th style="text-align:right">Actual Hrs</th>${canEdit ? '<th></th>' : ''}</tr></thead><tbody>${labor.map(l => {
        const over = l.actual_hours > l.budgeted_hours && l.budgeted_hours > 0;
        return `<tr><td><span class="badge badge--amber" style="font-size:10px;">${formatStatus(l.task_type)}</span></td><td>${esc(l.description || '—')}</td><td>${formatDate(l.date_worked)}</td><td style="text-align:right">${l.worker_count}</td><td style="text-align:right">${(l.budgeted_hours || 0).toFixed(1)}</td><td style="text-align:right;font-weight:600;${over ? 'color:var(--error)' : ''}">${(l.actual_hours || 0).toFixed(1)}${over ? ' ⚠' : ''}</td>${canEdit ? `<td><button class="btn-icon" onclick="App.editLabor('${l.id}',${JSON.stringify(l).replace(/"/g, '&quot;')})">✏️</button>${canBudget ? `<button class="btn-icon" onclick="App.deleteInfraEntity('labor','${l.id}')">🗑️</button>` : ''}</td>` : ''}</tr>`;
      }).join('')}</tbody></table></div>`}
    </div>`;

  // Tab switching
  document.querySelectorAll('.infra-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.infra-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.infra-tab-content').forEach(t => t.style.display = 'none');
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).style.display = 'block';
    });
  });
  document.getElementById('btn-back-infra').addEventListener('click', () => this.renderInfrastructure(c));
  const delBtn = document.getElementById('btn-del-loc');
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!confirm(`Delete "${loc.name}" and ALL its equipment, runs, and labor data?`)) return;
      const r = await API.deleteLocation(pid, locId);
      if (r.error) { this.toast(r.error, 'error'); return; }
      this.toast('Location deleted', 'success'); this.renderInfrastructure(c);
    });
  }
  const addItemBtn = document.getElementById('btn-add-item');
  if (addItemBtn) addItemBtn.addEventListener('click', () => this.addEquipment(locId));
  const addRunBtn = document.getElementById('btn-add-run');
  if (addRunBtn) addRunBtn.addEventListener('click', () => this.addCableRun(locId));
  const addLaborBtn = document.getElementById('btn-add-labor');
  if (addLaborBtn) addLaborBtn.addEventListener('click', () => this.addLaborEntry(locId));
};

// ── Add Equipment ──────────────────────────────────────────
App.addEquipment = function (locId) {
  const pid = this.state.projectId;
  const canBudget = this.Permissions.can('canEditInfraBudget');
  const cats = ['rack', 'switch', 'patch_panel', 'fiber_panel', 'ups', 'pdu', 'cable_management', 'server', 'media_converter', 'junction_box', 'backboard', 'grounding', 'conduit', 'cctv', 'access_control', 'av', 'fire_alarm', 'other'];
  this.showModal('Add Equipment / Material', `<div class="form-grid">
      <div class="form-group"><label class="form-label">Category *</label><select class="form-select" id="ei-cat">${cats.map(c => `<option value="${c}">${formatStatus(c)}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Item Name *</label><input class="form-input" id="ei-name" placeholder="e.g. 48-Port Patch Panel"></div>
      <div class="form-group"><label class="form-label">Model / Part #</label><input class="form-input" id="ei-model" placeholder="Manufacturer model"></div>
      <div class="form-group"><label class="form-label">Unit</label><select class="form-select" id="ei-unit"><option value="ea">Each</option><option value="ft">Feet</option><option value="lot">Lot</option><option value="box">Box</option></select></div>
      ${canBudget ? `<div class="form-group"><label class="form-label">Budgeted Qty</label><input class="form-input" id="ei-bqty" type="number" step="1" value="0"></div>
      <div class="form-group"><label class="form-label">Unit Cost ($)</label><input class="form-input" id="ei-ucost" type="number" step="0.01" value="0"></div>` :
      `<div class="form-group form-full"><div style="padding:10px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border);font-size:13px;color:var(--text-muted);">🔒 Budget quantities and costs are set by AI from SmartPlans import and cannot be modified by PMs.</div></div>`}
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="ei-status"><option value="planned">Planned</option><option value="ordered">Ordered</option><option value="received">Received</option><option value="installed">Installed</option><option value="tested">Tested</option></select></div>
      <div class="form-group form-full"><label class="form-label">Notes</label><textarea class="form-input" id="ei-notes" rows="2"></textarea></div>
    </div>`, async () => {
    const name = document.getElementById('ei-name').value.trim();
    if (!name) { this.toast('Item name required', 'warning'); return; }
    const bqty = canBudget ? (parseFloat(document.getElementById('ei-bqty').value) || 0) : 0;
    const ucost = canBudget ? (parseFloat(document.getElementById('ei-ucost').value) || 0) : 0;
    const r = await API.locationAction(pid, locId, { action: 'add_item', category: document.getElementById('ei-cat').value, item_name: name, model: document.getElementById('ei-model').value.trim(), unit: document.getElementById('ei-unit').value, budgeted_qty: bqty, unit_cost: ucost, budgeted_cost: bqty * ucost, status: document.getElementById('ei-status').value, notes: document.getElementById('ei-notes').value.trim() });
    if (r.error) { this.toast(r.error, 'error'); return; }
    this.closeModal(); this.toast('Equipment added', 'success'); this.viewLocation(locId);
  });
};

// ── Add Cable Run ──────────────────────────────────────────
App.addCableRun = function (locId) {
  const pid = this.state.projectId;
  const canBudget = this.Permissions.can('canEditInfraBudget');
  const types = ['cat5e', 'cat6', 'cat6a', 'cat6a_plenum', 'fiber_sm', 'fiber_mm', 'fiber_om3', 'fiber_om4', 'coax_rg6', 'coax_rg11', 'speaker_wire', 'shielded_pair', '25_pair', 'access_control', 'fire_alarm'];
  const pathways = ['j_hook', 'cable_tray', 'conduit', 'innerduct', 'raceway', 'free_air', 'basket_tray'];
  this.showModal('Add Cable Run', `<div class="form-grid">
      <div class="form-group"><label class="form-label">Run Label</label><input class="form-input" id="cr-label" placeholder="e.g. D-101"></div>
      <div class="form-group"><label class="form-label">Cable Type *</label><select class="form-select" id="cr-type">${types.map(t => `<option value="${t}">${formatStatus(t)}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Destination *</label><input class="form-input" id="cr-dest" placeholder="Room, area, or device"></div>
      <div class="form-group"><label class="form-label">Dest. Floor</label><input class="form-input" id="cr-dfloor" placeholder="Floor"></div>
      <div class="form-group"><label class="form-label">Pathway</label><select class="form-select" id="cr-path"><option value="">Select...</option>${pathways.map(p => `<option value="${p}">${formatStatus(p)}</option>`).join('')}</select></div>
      ${canBudget ? `<div class="form-group"><label class="form-label">Budgeted Length (ft)</label><input class="form-input" id="cr-bqty" type="number" step="1" value="0"></div>
      <div class="form-group"><label class="form-label">Budgeted Labor (hrs)</label><input class="form-input" id="cr-blabor" type="number" step="0.5" value="0"></div>` :
      `<div class="form-group form-full"><div style="padding:10px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border);font-size:13px;color:var(--text-muted);">🔒 Budget lengths and labor hours are set by AI from SmartPlans import.</div></div>`}
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="cr-status"><option value="planned">Planned</option><option value="pulled">Pulled</option><option value="terminated">Terminated</option><option value="tested">Tested</option><option value="labeled">Labeled</option></select></div>
    </div>`, async () => {
    const dest = document.getElementById('cr-dest').value.trim();
    if (!dest) { this.toast('Destination required', 'warning'); return; }
    const r = await API.locationAction(pid, locId, { action: 'add_run', run_label: document.getElementById('cr-label').value.trim(), cable_type: document.getElementById('cr-type').value, destination: dest, destination_floor: document.getElementById('cr-dfloor').value.trim(), pathway: document.getElementById('cr-path').value, budgeted_qty: canBudget ? (parseFloat(document.getElementById('cr-bqty').value) || 0) : 0, budgeted_labor_hrs: canBudget ? (parseFloat(document.getElementById('cr-blabor').value) || 0) : 0, status: document.getElementById('cr-status').value });
    if (r.error) { this.toast(r.error, 'error'); return; }
    this.closeModal(); this.toast('Cable run added', 'success'); this.viewLocation(locId);
  });
};

// ── Add Labor Entry ────────────────────────────────────────
App.addLaborEntry = function (locId) {
  const pid = this.state.projectId;
  const canBudget = this.Permissions.can('canEditInfraBudget');
  const tasks = ['rough_in', 'trim_out', 'termination', 'testing', 'firestopping', 'labeling', 'rack_build', 'cable_pulling', 'pathway_install', 'cleanup', 'supervision', 'other'];
  this.showModal('Add Labor Entry', `<div class="form-grid">
      <div class="form-group"><label class="form-label">Task Type *</label><select class="form-select" id="lb-type">${tasks.map(t => `<option value="${t}">${formatStatus(t)}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="lb-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="lb-desc" placeholder="What was done"></div>
      <div class="form-group"><label class="form-label">Crew Size</label><input class="form-input" id="lb-crew" type="number" step="1" value="1"></div>
      ${canBudget ? `<div class="form-group"><label class="form-label">Budgeted Hours</label><input class="form-input" id="lb-bhrs" type="number" step="0.5" value="0"></div>` :
      `<div class="form-group"><div style="padding:10px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border);font-size:13px;color:var(--text-muted);">🔒 Budgeted hours set by AI</div></div>`}
      <div class="form-group"><label class="form-label">Actual Hours</label><input class="form-input" id="lb-ahrs" type="number" step="0.5" value="0"></div>
      <div class="form-group form-full"><label class="form-label">Notes</label><textarea class="form-input" id="lb-notes" rows="2"></textarea></div>
    </div>`, async () => {
    const r = await API.locationAction(pid, locId, { action: 'add_labor', task_type: document.getElementById('lb-type').value, description: document.getElementById('lb-desc').value.trim(), date_worked: document.getElementById('lb-date').value || null, worker_count: parseInt(document.getElementById('lb-crew').value) || 1, budgeted_hours: canBudget ? (parseFloat(document.getElementById('lb-bhrs').value) || 0) : 0, actual_hours: parseFloat(document.getElementById('lb-ahrs').value) || 0, notes: document.getElementById('lb-notes').value.trim() });
    if (r.error) { this.toast(r.error, 'error'); return; }
    this.closeModal(); this.toast('Labor entry added', 'success'); this.viewLocation(locId);
  });
};

// ── Edit Equipment (PM: only installed qty, actual cost, status) ──
App.editItem = function (itemId, item) {
  const locId = this._currentLocId;
  const pid = this.state.projectId;
  const canBudget = this.Permissions.can('canEditInfraBudget');
  this.showModal('Update Equipment', `<div class="form-grid">
      <div class="form-group form-full"><label class="form-label">Item</label><div style="font-weight:600;padding:8px 0;">${esc(item.item_name)} (${esc(item.category)})</div></div>
      <div class="form-group form-full"><div style="padding:8px 12px;background:var(--bg-card);border-radius:6px;border:1px solid var(--border);font-size:12px;display:flex;gap:20px;">
        <span>🔒 Budget Qty: <strong>${item.budgeted_qty} ${esc(item.unit)}</strong></span>
        <span>🔒 Budget Cost: <strong>$${formatMoney(item.budgeted_cost)}</strong></span>
      </div></div>
      <div class="form-group"><label class="form-label">Installed Qty</label><input class="form-input" id="ue-iqty" type="number" step="1" value="${item.installed_qty || 0}"></div>
      <div class="form-group"><label class="form-label">Actual Cost ($)</label><input class="form-input" id="ue-acost" type="number" step="0.01" value="${item.actual_cost || 0}"></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="ue-status"><option value="planned" ${item.status === 'planned' ? 'selected' : ''}>Planned</option><option value="ordered" ${item.status === 'ordered' ? 'selected' : ''}>Ordered</option><option value="received" ${item.status === 'received' ? 'selected' : ''}>Received</option><option value="installed" ${item.status === 'installed' ? 'selected' : ''}>Installed</option><option value="tested" ${item.status === 'tested' ? 'selected' : ''}>Tested</option></select></div>
    </div>`, async () => {
    const r = await API.locationAction(pid, locId, { action: 'update_item', item_id: itemId, installed_qty: parseFloat(document.getElementById('ue-iqty').value) || 0, actual_cost: parseFloat(document.getElementById('ue-acost').value) || 0, status: document.getElementById('ue-status').value });
    if (r.error) { this.toast(r.error, 'error'); return; }
    this.closeModal(); this.toast('Equipment updated', 'success'); this.viewLocation(locId);
  });
};

// ── Edit Cable Run ─────────────────────────────────────────
App.editRun = function (runId, run) {
  const locId = this._currentLocId;
  const pid = this.state.projectId;
  this.showModal('Update Cable Run', `<div class="form-grid">
      <div class="form-group form-full"><label class="form-label">Run</label><div style="font-weight:600;padding:8px 0;">${esc(run.run_label || '—')} · ${formatStatus(run.cable_type)} → ${esc(run.destination)}</div></div>
      <div class="form-group form-full"><div style="padding:8px 12px;background:var(--bg-card);border-radius:6px;border:1px solid var(--border);font-size:12px;display:flex;gap:20px;">
        <span>🔒 Budget Length: <strong>${formatMoney(run.budgeted_qty)} ft</strong></span>
        <span>🔒 Budget Labor: <strong>${(run.budgeted_labor_hrs || 0).toFixed(1)} hrs</strong></span>
      </div></div>
      <div class="form-group"><label class="form-label">Installed Length (ft)</label><input class="form-input" id="ur-iqty" type="number" step="1" value="${run.installed_qty || 0}"></div>
      <div class="form-group"><label class="form-label">Actual Labor (hrs)</label><input class="form-input" id="ur-ahrs" type="number" step="0.5" value="${run.actual_labor_hrs || 0}"></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="ur-status"><option value="planned" ${run.status === 'planned' ? 'selected' : ''}>Planned</option><option value="pulled" ${run.status === 'pulled' ? 'selected' : ''}>Pulled</option><option value="terminated" ${run.status === 'terminated' ? 'selected' : ''}>Terminated</option><option value="tested" ${run.status === 'tested' ? 'selected' : ''}>Tested</option><option value="labeled" ${run.status === 'labeled' ? 'selected' : ''}>Labeled</option></select></div>
    </div>`, async () => {
    const r = await API.locationAction(pid, locId, { action: 'update_run', run_id: runId, installed_qty: parseFloat(document.getElementById('ur-iqty').value) || 0, actual_labor_hrs: parseFloat(document.getElementById('ur-ahrs').value) || 0, status: document.getElementById('ur-status').value });
    if (r.error) { this.toast(r.error, 'error'); return; }
    this.closeModal(); this.toast('Cable run updated', 'success'); this.viewLocation(locId);
  });
};

// ── Edit Labor ─────────────────────────────────────────────
App.editLabor = function (laborId, lab) {
  const locId = this._currentLocId;
  const pid = this.state.projectId;
  const canBudget = this.Permissions.can('canEditInfraBudget');
  this.showModal('Update Labor Entry', `<div class="form-grid">
      <div class="form-group form-full"><label class="form-label">Task</label><div style="font-weight:600;padding:8px 0;">${formatStatus(lab.task_type)}</div></div>
      <div class="form-group form-full"><div style="padding:8px 12px;background:var(--bg-card);border-radius:6px;border:1px solid var(--border);font-size:12px;">
        🔒 Budgeted Hours: <strong>${(lab.budgeted_hours || 0).toFixed(1)}</strong>
      </div></div>
      <div class="form-group"><label class="form-label">Actual Hours</label><input class="form-input" id="ul-ahrs" type="number" step="0.5" value="${lab.actual_hours || 0}"></div>
      <div class="form-group"><label class="form-label">Crew Size</label><input class="form-input" id="ul-crew" type="number" step="1" value="${lab.worker_count || 1}"></div>
    </div>`, async () => {
    const payload = { action: 'update_labor', labor_id: laborId, actual_hours: parseFloat(document.getElementById('ul-ahrs').value) || 0, worker_count: parseInt(document.getElementById('ul-crew').value) || 1 };
    // Only send budget if user has permission
    if (canBudget && lab.budgeted_hours !== undefined) {
      payload.budgeted_hours = lab.budgeted_hours;
    }
    const r = await API.locationAction(pid, locId, payload);
    if (r.error) { this.toast(r.error, 'error'); return; }
    this.closeModal(); this.toast('Labor updated', 'success'); this.viewLocation(locId);
  });
};

// ── Delete Infrastructure Entity ───────────────────────────
App.deleteInfraEntity = async function (type, entityId) {
  if (!this.Permissions.can('canEditInfraBudget')) {
    this.toast('Only Admin/Ops Mgr can delete infrastructure items', 'warning');
    return;
  }
  const labels = { item: 'equipment item', run: 'cable run', labor: 'labor entry' };
  if (!confirm(`Delete this ${labels[type]}?`)) return;
  const pid = this.state.projectId;
  const locId = this._currentLocId;
  const actionMap = { item: 'delete_item', run: 'delete_run', labor: 'delete_labor' };
  const idMap = { item: 'item_id', run: 'run_id', labor: 'labor_id' };
  const r = await API.locationAction(pid, locId, { action: actionMap[type], [idMap[type]]: entityId });
  if (r.error) { this.toast(r.error, 'error'); return; }
  this.toast(`${labels[type]} deleted`, 'success');
  this.viewLocation(locId);
};
