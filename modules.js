// ═══════════════════════════════════════════════════════════════
// 3D PROJECT MANAGER — MODULE IMPLEMENTATIONS
// Full UI for all project management modules
// ═══════════════════════════════════════════════════════════════

// ─── SOV (Schedule of Values) ──────────────────────────────────
App.renderSOV = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📋 Schedule of Values</h1><p class="page-subtitle">AIA G703 line items for progress billing</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-add-sov">+ Add Line Item</button></div></div><div id="sov-balance" class="metric-grid" style="margin-bottom:20px;"></div><div class="card"><table class="data-table" id="sov-table"><thead><tr><th>Item #</th><th>Description</th><th>Division</th><th style="text-align:right">Scheduled Value</th><th style="text-align:right">Material</th><th style="text-align:right">Labor</th><th style="text-align:right">% Complete</th><th>Actions</th></tr></thead><tbody id="sov-body"><tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
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
    if (items.length === 0) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">No SOV items yet. Add line items or import from SmartPlans.</td></tr>`; }
    else { tbody.innerHTML = items.map(i => `<tr><td><strong>${esc(i.item_number)}</strong></td><td>${esc(i.description)}</td><td>${esc(i.division || '—')}</td><td style="text-align:right">$${formatMoney(i.scheduled_value)}</td><td style="text-align:right">$${formatMoney(i.material_cost)}</td><td style="text-align:right">$${formatMoney(i.labor_cost)}</td><td style="text-align:right">${(i.total_completed_pct || 0).toFixed(1)}%</td><td><button class="btn-icon" onclick="App.editSOVItem('${i.id}')">✏️</button><button class="btn-icon" onclick="App.deleteSOVItem('${i.id}')">🗑️</button></td></tr>`).join(''); }
    document.getElementById('btn-add-sov').addEventListener('click', () => this.addSOVItem());
};
App.addSOVItem = function () {
    const pid = this.state.projectId;
    this.showModal('Add SOV Line Item', `<div class="form-grid"><div class="form-group"><label class="form-label">Item Number *</label><input class="form-input" id="sov-num" placeholder="e.g. 27-001"></div><div class="form-group"><label class="form-label">Division</label><select class="form-select" id="sov-div"><option value="">Select...</option><option value="Division 27">Division 27</option><option value="Division 28">Division 28</option><option value="Special Conditions">Special Conditions</option><option value="General Conditions">General Conditions</option></select></div><div class="form-group form-full"><label class="form-label">Description *</label><input class="form-input" id="sov-desc" placeholder="Line item description"></div><div class="form-group"><label class="form-label">Material Cost ($)</label><input class="form-input" id="sov-mat" type="number" step="0.01" value="0"></div><div class="form-group"><label class="form-label">Labor Cost ($)</label><input class="form-input" id="sov-lab" type="number" step="0.01" value="0"></div><div class="form-group"><label class="form-label">Equipment Cost ($)</label><input class="form-input" id="sov-eq" type="number" step="0.01" value="0"></div><div class="form-group"><label class="form-label">Subcontractor ($)</label><input class="form-input" id="sov-sub" type="number" step="0.01" value="0"></div></div>`, async () => {
        const num = document.getElementById('sov-num').value.trim();
        const desc = document.getElementById('sov-desc').value.trim();
        if (!num || !desc) { this.toast('Item number and description required', 'warning'); return; }
        const res = await API.createSOVItem(pid, { item_number: num, description: desc, division: document.getElementById('sov-div').value, material_cost: parseFloat(document.getElementById('sov-mat').value) || 0, labor_cost: parseFloat(document.getElementById('sov-lab').value) || 0, equipment_cost: parseFloat(document.getElementById('sov-eq').value) || 0, sub_cost: parseFloat(document.getElementById('sov-sub').value) || 0 });
        if (res.error) { this.toast(res.error, 'error'); return; }
        this.closeModal(); this.toast('SOV item added', 'success');
        this.renderSOV(document.getElementById('project-content'));
    });
};
App.editSOVItem = function (itemId) { this.toast('Edit modal — coming soon', 'info'); };
App.deleteSOVItem = async function (itemId) {
    if (!confirm('Delete this SOV item?')) return;
    const res = await API.deleteSOVItem(this.state.projectId, itemId);
    if (res.error) { this.toast(res.error, 'error'); return; }
    this.toast('SOV item deleted', 'success');
    this.renderSOV(document.getElementById('project-content'));
};

// ─── BILLING ───────────────────────────────────────────────────
App.renderBilling = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">💰 Progress Billing</h1><p class="page-subtitle">AIA G702/G703 payment applications</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-billing">+ New Billing Period</button></div></div><div id="billing-list"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-title">Loading...</div></div></div>`;
    const pid = this.state.projectId;
    const res = await API.getBillingPeriods(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const periods = res.periods || [];
    const list = document.getElementById('billing-list');
    if (periods.length === 0) { list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💰</div><div class="empty-state-title">No Billing Periods</div><div class="empty-state-desc">Create your first billing period to start tracking progress payments.</div></div>`; }
    else { list.innerHTML = `<div class="card"><table class="data-table"><thead><tr><th>Period</th><th>Dates</th><th>Status</th><th style="text-align:right">Contract Sum</th><th style="text-align:right">Payment Due</th><th>Actions</th></tr></thead><tbody>${periods.map(p => `<tr><td><strong>#${p.period_number}</strong></td><td>${formatDate(p.period_start)} — ${formatDate(p.period_end)}</td><td><span class="badge badge--${p.status}">${formatStatus(p.status)}</span></td><td style="text-align:right">$${formatMoney(p.contract_sum_to_date)}</td><td style="text-align:right">$${formatMoney(p.current_payment_due)}</td><td><button class="btn btn-sm" onclick="App.viewBillingPeriod('${p.id}')">View</button></td></tr>`).join('')}</tbody></table></div>`; }
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
    const totalCompleted = lines.reduce((s, l) => s + (l.total_completed_value || 0), 0);
    this.showModal(`Billing Period #${p.period_number}`, `
    <div class="metric-grid" style="margin-bottom:16px;">
      <div class="metric-card metric-card--sky"><div class="metric-value">$${formatMoney(p.contract_sum_to_date)}</div><div class="metric-label">Contract Sum</div></div>
      <div class="metric-card metric-card--emerald"><div class="metric-value">$${formatMoney(totalCompleted)}</div><div class="metric-label">Completed</div></div>
      <div class="metric-card metric-card--amber"><div class="metric-value">$${formatMoney(p.current_payment_due)}</div><div class="metric-label">Payment Due</div></div>
    </div>
    <div style="max-height:400px;overflow-y:auto;"><table class="data-table"><thead><tr><th>Item</th><th>Description</th><th style="text-align:right">Scheduled</th><th style="text-align:right">Completed %</th><th style="text-align:right">This Period</th></tr></thead><tbody>${lines.map(l => `<tr><td>${esc(l.item_number)}</td><td>${esc(l.description)}</td><td style="text-align:right">$${formatMoney(l.scheduled_value)}</td><td style="text-align:right">${(l.total_completed_pct || 0).toFixed(1)}%</td><td style="text-align:right">$${formatMoney(l.work_completed_this_period)}</td></tr>`).join('')}</tbody></table></div>
    <div style="margin-top:12px;"><span class="badge badge--${p.status}">${formatStatus(p.status)}</span></div>`, null);
};

// ─── CHANGE ORDERS ─────────────────────────────────────────────
App.renderChangeOrders = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📝 Change Orders</h1><p class="page-subtitle">Track scope changes and pricing impacts</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-co">+ New Change Order</button></div></div><div id="co-summary" class="metric-grid" style="margin-bottom:20px;"></div><div class="card"><table class="data-table"><thead><tr><th>CO #</th><th>Title</th><th>Type</th><th>Status</th><th style="text-align:right">Amount</th><th>Requested</th><th>Actions</th></tr></thead><tbody id="co-body"><tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
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
    else { tbody.innerHTML = cos.map(co => `<tr><td><strong>#${co.co_number}</strong></td><td>${esc(co.title)}</td><td>${formatStatus(co.type)}</td><td><span class="badge badge--${co.status}">${formatStatus(co.status)}</span></td><td style="text-align:right;font-weight:600;${co.type === 'deduction' ? 'color:var(--error)' : ''}">$${formatMoney(co.total_amount)}</td><td>${formatDate(co.requested_date)}</td><td><button class="btn btn-sm" onclick="App.editCO('${co.id}')">Edit</button></td></tr>`).join(''); }
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
App.editCO = function (coId) { this.toast('Edit CO — use inline actions', 'info'); };

// ─── RFIs ──────────────────────────────────────────────────────
App.renderRFIs = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">❓ RFI Tracker</h1><p class="page-subtitle">Requests for information — track questions and responses</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-rfi">+ New RFI</button></div></div><div id="rfi-summary" class="metric-grid" style="margin-bottom:20px;"></div><div class="card"><table class="data-table"><thead><tr><th>RFI #</th><th>Subject</th><th>Discipline</th><th>Priority</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead><tbody id="rfi-body"><tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
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
        tbody.innerHTML = rfis.map(r => `<tr><td><strong>#${r.rfi_number}</strong></td><td>${esc(r.subject)}</td><td>${esc(r.discipline || '—')}</td><td><span class="badge badge--${priorityClass(r.priority)}">${formatStatus(r.priority)}</span></td><td><span class="badge badge--${r.status}">${formatStatus(r.status)}</span></td><td>${r.due_date && new Date(r.due_date) < new Date() && r.status !== 'closed' ? '<span style="color:var(--error);font-weight:600;">' + formatDate(r.due_date) + '</span>' : formatDate(r.due_date)}</td><td><button class="btn btn-sm" onclick="App.editRFI('${r.id}')">Edit</button></td></tr>`).join('');
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
App.editRFI = function (rfiId) { this.toast('RFI edit — coming soon', 'info'); };

// ─── SUBMITTALS ────────────────────────────────────────────────
App.renderSubmittals = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📎 Submittal Log</h1><p class="page-subtitle">Track equipment and material submittals</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-sub">+ New Submittal</button></div></div><div class="card"><table class="data-table"><thead><tr><th>Number</th><th>Title</th><th>Spec Section</th><th>Status</th><th>Due</th><th>Rev</th></tr></thead><tbody id="sub-body"><tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
    const pid = this.state.projectId;
    const res = await API.getSubmittals(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const subs = res.submittals || [];
    const tbody = document.getElementById('sub-body');
    if (subs.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">No submittals yet.</td></tr>`; }
    else { tbody.innerHTML = subs.map(s => `<tr><td><strong>${esc(s.submittal_number)}</strong></td><td>${esc(s.title)}</td><td>${esc(s.spec_section || '—')}</td><td><span class="badge badge--${s.status}">${formatStatus(s.status)}</span></td><td>${formatDate(s.due_date)}</td><td>Rev ${s.revision || 0}</td></tr>`).join(''); }
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

// ─── DAILY LOG ─────────────────────────────────────────────────
App.renderDailyLog = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📅 Daily Log</h1><p class="page-subtitle">Record daily field activity</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-log">+ New Entry</button></div></div><div class="card" id="log-list"><div style="padding:30px;text-align:center;color:var(--text-muted)">Loading...</div></div>`;
    const pid = this.state.projectId;
    const res = await API.getDailyLogs(pid);
    if (res.error) { this.toast(res.error, 'error'); return; }
    const logs = res.logs || [];
    const list = document.getElementById('log-list');
    if (logs.length === 0) { list.innerHTML = `<div style="padding:40px;text-align:center;"><div style="font-size:48px;margin-bottom:12px;opacity:0.3;">📅</div><div style="color:var(--text-muted)">No daily log entries yet.</div></div>`; }
    else { list.innerHTML = `<table class="data-table"><thead><tr><th>Date</th><th>Weather</th><th>Crew</th><th>Hours</th><th>Work Performed</th></tr></thead><tbody>${logs.map(l => `<tr><td><strong>${formatDate(l.log_date)}</strong></td><td>${esc(l.weather || '—')}</td><td>${l.crew_size || 0}</td><td>${l.hours_worked || 0}</td><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc((l.work_performed || '—').substring(0, 80))}</td></tr>`).join('')}</tbody></table>`; }
    document.getElementById('btn-new-log').addEventListener('click', () => {
        this.showModal('New Daily Log', `<div class="form-grid"><div class="form-group"><label class="form-label">Date *</label><input class="form-input" id="log-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div><div class="form-group"><label class="form-label">Weather</label><select class="form-select" id="log-wx"><option>Clear</option><option>Partly Cloudy</option><option>Cloudy</option><option>Rain</option><option>Snow</option><option>Wind</option></select></div><div class="form-group"><label class="form-label">Crew Size</label><input class="form-input" id="log-crew" type="number" value="0"></div><div class="form-group"><label class="form-label">Hours Worked</label><input class="form-input" id="log-hrs" type="number" step="0.5" value="8"></div><div class="form-group form-full"><label class="form-label">Work Performed</label><textarea class="form-input" id="log-work" rows="3" placeholder="Describe work performed today..."></textarea></div><div class="form-group form-full"><label class="form-label">Areas Worked</label><input class="form-input" id="log-areas" placeholder="Floors, rooms, areas"></div><div class="form-group form-full"><label class="form-label">Delays / Issues</label><textarea class="form-input" id="log-delays" rows="2"></textarea></div></div>`, async () => {
            const r = await API.createDailyLog(pid, { log_date: document.getElementById('log-date').value, weather: document.getElementById('log-wx').value, crew_size: parseInt(document.getElementById('log-crew').value) || 0, hours_worked: parseFloat(document.getElementById('log-hrs').value) || 0, work_performed: document.getElementById('log-work').value, areas_worked: document.getElementById('log-areas').value, delays: document.getElementById('log-delays').value });
            if (r.error) { this.toast(r.error, 'error'); return; }
            this.closeModal(); this.toast('Daily log created', 'success');
            this.renderDailyLog(c);
        });
    });
};

// ─── PUNCH LIST ────────────────────────────────────────────────
App.renderPunchList = async function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">✅ Punch List</h1><p class="page-subtitle">Track deficiency items through closeout</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-punch">+ Add Item</button></div></div><div id="punch-summary" class="metric-grid" style="margin-bottom:20px;"></div><div class="card"><table class="data-table"><thead><tr><th>#</th><th>Location</th><th>Description</th><th>Discipline</th><th>Priority</th><th>Status</th><th>Assigned</th></tr></thead><tbody id="punch-body"><tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody></table></div>`;
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
    if (items.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">No punch items. All clear! 🎉</td></tr>`; }
    else { tbody.innerHTML = items.map(i => `<tr><td>${i.item_number}</td><td>${esc(i.location)}</td><td>${esc(i.description)}</td><td>${esc(i.discipline || '—')}</td><td><span class="badge badge--${i.priority === 'high' ? 'rose' : i.priority === 'low' ? 'sky' : 'amber'}">${formatStatus(i.priority)}</span></td><td><span class="badge badge--${i.status}">${formatStatus(i.status)}</span></td><td>${esc(i.assigned_to || '—')}</td></tr>`).join(''); }
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
      <div class="card" style="margin-bottom:16px;"><div class="card-header"><div class="card-title">${formatStatus(role)}</div></div>
      ${cts.map(ct => `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);"><div><div style="font-weight:600;">${esc(ct.name)}</div><div style="font-size:12px;color:var(--text-muted);">${esc(ct.company || '')}${ct.email ? ' · ' + esc(ct.email) : ''}${ct.phone ? ' · ' + esc(ct.phone) : ''}</div></div><div style="display:flex;gap:8px;">${ct.email ? `<a href="mailto:${esc(ct.email)}" class="btn btn-sm">✉️</a>` : ''} ${ct.phone ? `<a href="tel:${esc(ct.phone)}" class="btn btn-sm">📞</a>` : ''}</div></div>`).join('')}
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

// ─── DOCUMENTS ─────────────────────────────────────────────────
App.renderDocuments = function (c) {
    c.innerHTML = `<div class="page-header"><div><h1 class="page-title">📁 Document Manager</h1><p class="page-subtitle">Centralized file storage for project documents</p></div></div><div class="card" style="text-align:center;padding:60px;"><div style="font-size:48px;margin-bottom:16px;">📁</div><div style="font-size:16px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">Document Storage</div><div style="font-size:13px;color:var(--text-muted);max-width:400px;margin:0 auto;">Document upload requires Cloudflare R2 storage configuration. Once R2 is bound to this Worker, drag-and-drop upload will be available here.</div></div>`;
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
