// ═══════════════════════════════════════════════════════════════
// 3D PROJECT MANAGER — MAIN APPLICATION
// SPA with hash-based routing, module rendering, state management
// ═══════════════════════════════════════════════════════════════

const App = {
  state: {
    route: 'dashboard',
    projectId: null,
    subRoute: 'overview',
    modal: null,
    projects: [],
    currentProject: null,
    loading: false,
    toasts: [],
  },

  init() {
    window.addEventListener('hashchange', () => this.parseRoute());
    this.parseRoute();
  },

  parseRoute() {
    const hash = location.hash.slice(1) || 'dashboard';
    const parts = hash.split('/');
    if (parts[0] === 'project' && parts[1]) {
      this.state.route = 'project';
      this.state.projectId = parts[1];
      this.state.subRoute = parts[2] || 'overview';
    } else {
      this.state.route = parts[0] || 'dashboard';
      this.state.projectId = null;
      this.state.subRoute = null;
    }
    this.render();
  },

  navigate(hash) { location.hash = hash; },

  toast(message, type = 'info') {
    const id = Date.now();
    this.state.toasts.push({ id, message, type });
    this.renderToasts();
    setTimeout(() => {
      this.state.toasts = this.state.toasts.filter(t => t.id !== id);
      this.renderToasts();
    }, 4000);
  },

  renderToasts() {
    let c = document.getElementById('toast-container');
    if (!c) { c = document.createElement('div'); c.id = 'toast-container'; c.className = 'toast-container'; document.body.appendChild(c); }
    c.innerHTML = this.state.toasts.map(t =>
      `<div class="toast toast--${t.type}">${t.type==='success'?'✓':t.type==='error'?'✕':'ⓘ'} ${esc(t.message)}</div>`
    ).join('');
  },

  render() {
    const app = document.getElementById('app');
    if (!app) return;
    if (!API.isAuthenticated()) { app.innerHTML = this.renderLogin(); this.bindLogin(); return; }
    if (this.state.route === 'project' && this.state.projectId) {
      app.innerHTML = this.renderShell(this.renderProjectHub());
    } else {
      app.innerHTML = this.renderShell(this.renderDashboard());
    }
    this.bindShell();
    if (this.state.route === 'dashboard') this.loadDashboard();
    else if (this.state.route === 'project') this.loadProject(this.state.projectId);
  },

  renderLogin() {
    return `
      <div class="login-gate">
        <div class="login-card">
          <div class="login-logo">
            <div class="login-logo-icon">🏗️</div>
            <h1>3D Project Manager</h1>
            <p>ELV Construction Management</p>
          </div>
          <div class="login-error" id="login-error"></div>
          <div class="login-field">
            <label>Username</label>
            <input type="text" id="login-user" autocomplete="username" placeholder="Enter username">
          </div>
          <div class="login-field">
            <label>Password</label>
            <input type="password" id="login-pass" autocomplete="current-password" placeholder="Enter password">
          </div>
          <button class="login-btn" id="login-btn">Sign In</button>
        </div>
      </div>`;
  },

  bindLogin() {
    const btn = document.getElementById('login-btn');
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');
    const errEl = document.getElementById('login-error');
    const doLogin = async () => {
      const username = userInput.value.trim();
      const password = passInput.value;
      if (!username || !password) { errEl.textContent = 'Please enter username and password.'; errEl.classList.add('visible'); return; }
      btn.textContent = 'Signing in...'; btn.disabled = true;
      const res = await API.login(username, password);
      if (res.error) { errEl.textContent = res.error; errEl.classList.add('visible'); btn.textContent = 'Sign In'; btn.disabled = false; }
      else { this.toast('Welcome back!', 'success'); this.render(); }
    };
    btn.addEventListener('click', doLogin);
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    userInput.focus();
  },

  renderShell(content) {
    const user = API.user || {};
    const initials = (user.display_name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2);
    return `
      <div class="app-shell">
        <header class="app-header">
          <div class="app-header-brand" onclick="App.navigate('dashboard')">
            <span>🏗️ 3D Project Manager</span>
          </div>
          <nav class="app-header-nav">
            <button class="header-nav-btn ${this.state.route === 'dashboard' ? 'active' : ''}" onclick="App.navigate('dashboard')">Dashboard</button>
          </nav>
          <div class="app-header-right">
            <div class="header-user">
              <div class="header-user-avatar">${esc(initials)}</div>
              <span>${esc(user.display_name || 'User')}</span>
            </div>
            <button class="header-logout" onclick="API.logout()">Sign Out</button>
          </div>
        </header>
        <div class="app-body">${content}</div>
      </div>`;
  },

  bindShell() {},

  renderDashboard() {
    return `
      <div class="app-content" id="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Portfolio overview — all active ELV projects</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary" id="btn-import-sp">📦 Import from SmartPlans</button>
            <button class="btn btn-primary" id="btn-new-project">+ New Project</button>
          </div>
        </div>
        <div class="metric-grid" id="dashboard-metrics">
          <div class="metric-card metric-card--sky"><div class="metric-icon">📋</div><div class="metric-value" id="m-active">—</div><div class="metric-label">Active Projects</div></div>
          <div class="metric-card metric-card--emerald"><div class="metric-icon">💰</div><div class="metric-value" id="m-contract">—</div><div class="metric-label">Total Contract Value</div></div>
          <div class="metric-card metric-card--amber"><div class="metric-icon">📄</div><div class="metric-value" id="m-billed">—</div><div class="metric-label">Total Billed</div></div>
          <div class="metric-card metric-card--rose"><div class="metric-icon">⚠️</div><div class="metric-value" id="m-open-rfis">—</div><div class="metric-label">Open RFIs</div></div>
          <div class="metric-card metric-card--indigo"><div class="metric-icon">📝</div><div class="metric-value" id="m-pending-cos">—</div><div class="metric-label">Pending COs</div></div>
          <div class="metric-card metric-card--violet"><div class="metric-icon">💵</div><div class="metric-value" id="m-outstanding">—</div><div class="metric-label">Outstanding</div></div>
        </div>
        <div id="project-list"><div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-title">Loading projects...</div></div></div>
      </div>`;
  },

  async loadDashboard() {
    const importBtn = document.getElementById('btn-import-sp');
    if (importBtn) importBtn.addEventListener('click', () => this.showImportModal());
    const newBtn = document.getElementById('btn-new-project');
    if (newBtn) newBtn.addEventListener('click', () => this.showNewProjectModal());
    const res = await API.getProjects();
    if (res.error) { this.toast(res.error, 'error'); return; }
    this.state.projects = res.projects || [];
    this.renderProjectList();
    this.updateMetrics();
  },

  updateMetrics() {
    const p = this.state.projects;
    const active = p.filter(x => x.status === 'active' || x.status === 'punch_list');
    const tc = p.reduce((s, x) => s + (x.current_contract_value || 0), 0);
    const tb = p.reduce((s, x) => s + (x.total_billed || 0), 0);
    const tp = p.reduce((s, x) => s + (x.total_paid || 0), 0);
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('m-active', active.length);
    set('m-contract', '$' + formatMoney(tc));
    set('m-billed', '$' + formatMoney(tb));
    set('m-outstanding', '$' + formatMoney(tb - tp));
    set('m-open-rfis', '—');
    set('m-pending-cos', '—');
  },

  renderProjectList() {
    const c = document.getElementById('project-list');
    if (!c) return;
    if (this.state.projects.length === 0) {
      c.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏗️</div><div class="empty-state-title">No Projects Yet</div><div class="empty-state-desc">Create a new project or import an estimate from SmartPlans to get started.</div><button class="btn btn-primary" onclick="App.showNewProjectModal()">+ New Project</button></div>`;
      return;
    }
    c.innerHTML = `<div class="project-grid">${this.state.projects.map(p => `
      <div class="project-card" onclick="App.navigate('project/${p.id}/overview')">
        <div class="project-card-header">
          <div><div class="project-card-name">${esc(p.name)}</div>${p.project_number ? `<div class="project-card-number">#${esc(p.project_number)}</div>` : ''}</div>
          <span class="badge badge--${p.status}">${formatStatus(p.status)}</span>
        </div>
        ${p.client_name ? `<div class="project-card-client">${esc(p.client_name)}${p.gc_name ? ' · GC: ' + esc(p.gc_name) : ''}</div>` : ''}
        ${p.disciplines ? `<div class="project-card-disciplines">${JSON.parse(p.disciplines || '[]').map(d => `<span class="discipline-tag">${esc(d)}</span>`).join('')}</div>` : ''}
        <div class="project-card-finance">
          <div class="project-card-stat"><div>Contract</div><div class="project-card-stat-value">$${formatMoney(p.current_contract_value || 0)}</div></div>
          <div class="project-card-stat"><div>Billed</div><div class="project-card-stat-value">$${formatMoney(p.total_billed || 0)}</div></div>
        </div>
      </div>`).join('')}</div>`;
  },

  renderProjectHub() {
    const sub = this.state.subRoute || 'overview';
    const items = [
      { id: 'overview', icon: '📊', label: 'Overview' },
      { id: 'sov', icon: '📋', label: 'Schedule of Values' },
      { id: 'billing', icon: '💰', label: 'Progress Billing' },
      { id: 'cos', icon: '📝', label: 'Change Orders' },
      { id: 'rfis', icon: '❓', label: 'RFIs' },
      { id: 'submittals', icon: '📎', label: 'Submittals' },
      { id: 'daily-log', icon: '📅', label: 'Daily Log' },
      { id: 'punch', icon: '✅', label: 'Punch List' },
      { id: 'contacts', icon: '👥', label: 'Contacts' },
      { id: 'documents', icon: '📁', label: 'Documents' },
      { id: 'settings', icon: '⚙️', label: 'Settings' },
    ];
    return `
      <aside class="app-sidebar">
        <div class="sidebar-section">
          <button class="sidebar-btn" onclick="App.navigate('dashboard')"><span class="sidebar-btn-icon">←</span> All Projects</button>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-label" id="sidebar-project-name">Loading...</div>
          ${items.map(i => `<button class="sidebar-btn ${sub === i.id ? 'active' : ''}" onclick="App.navigate('project/${this.state.projectId}/${i.id}')"><span class="sidebar-btn-icon">${i.icon}</span>${i.label}</button>`).join('')}
        </div>
      </aside>
      <div class="app-content" id="main-content"><div id="project-content"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-title">Loading project...</div></div></div></div>`;
  },

  async loadProject(id) {
    const res = await API.getProject(id);
    if (res.error) { this.toast(res.error, 'error'); return; }
    this.state.currentProject = res.project || res;
    const nameEl = document.getElementById('sidebar-project-name');
    if (nameEl) nameEl.textContent = this.state.currentProject.name || 'Project';
    const container = document.getElementById('project-content');
    if (!container) return;
    switch (this.state.subRoute) {
      case 'overview': this.renderProjectOverview(container); break;
      case 'sov': this.renderSOV(container); break;
      case 'billing': this.renderBilling(container); break;
      case 'cos': this.renderChangeOrders(container); break;
      case 'rfis': this.renderRFIs(container); break;
      case 'submittals': this.renderSubmittals(container); break;
      case 'daily-log': this.renderDailyLog(container); break;
      case 'punch': this.renderPunchList(container); break;
      case 'contacts': this.renderContacts(container); break;
      case 'documents': this.renderDocuments(container); break;
      case 'settings': this.renderProjectSettings(container); break;
      default: this.renderProjectOverview(container);
    }
  },

  renderProjectOverview(container) {
    const p = this.state.currentProject;
    if (!p) return;
    const disc = JSON.parse(p.disciplines || '[]');
    const remaining = (p.current_contract_value || 0) - (p.total_billed || 0);
    const pct = p.current_contract_value ? ((p.total_billed / p.current_contract_value) * 100).toFixed(1) : 0;
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${esc(p.name)}</h1>
          <p class="page-subtitle">${p.project_number ? '#' + esc(p.project_number) + ' · ' : ''}${esc(p.type || 'Project')} · <span class="badge badge--${p.status}">${formatStatus(p.status)}</span></p>
        </div>
        <div class="page-actions"><button class="btn btn-secondary" onclick="App.navigate('project/${p.id}/settings')">⚙️ Settings</button></div>
      </div>
      <div class="metric-grid">
        <div class="metric-card metric-card--sky"><div class="metric-icon">📋</div><div class="metric-value">$${formatMoney(p.original_contract_value || 0)}</div><div class="metric-label">Original Contract</div></div>
        <div class="metric-card metric-card--indigo"><div class="metric-icon">📝</div><div class="metric-value">$${formatMoney(p.current_contract_value || 0)}</div><div class="metric-label">Current Contract</div></div>
        <div class="metric-card metric-card--emerald"><div class="metric-icon">💰</div><div class="metric-value">$${formatMoney(p.total_billed || 0)}</div><div class="metric-label">Total Billed (${pct}%)</div></div>
        <div class="metric-card metric-card--amber"><div class="metric-icon">💵</div><div class="metric-value">$${formatMoney(remaining)}</div><div class="metric-label">Remaining</div></div>
      </div>
      <div class="progress-bar" style="margin-bottom:28px;"><div class="progress-fill" style="width:${Math.min(pct, 100)}%"></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div class="card">
          <div class="card-header"><div class="card-title">Project Details</div></div>
          <table style="width:100%;font-size:13px;">
            <tr><td style="color:var(--text-muted);padding:6px 0;width:130px;">Client</td><td style="padding:6px 0;">${esc(p.client_name || '—')}</td></tr>
            <tr><td style="color:var(--text-muted);padding:6px 0;">GC</td><td style="padding:6px 0;">${esc(p.gc_name || '—')}</td></tr>
            <tr><td style="color:var(--text-muted);padding:6px 0;">Location</td><td style="padding:6px 0;">${esc(p.address || '—')}${p.city ? ', ' + esc(p.city) : ''}${p.state ? ', ' + esc(p.state) : ''}</td></tr>
            <tr><td style="color:var(--text-muted);padding:6px 0;">Jurisdiction</td><td style="padding:6px 0;">${esc(p.jurisdiction || '—')}</td></tr>
            <tr><td style="color:var(--text-muted);padding:6px 0;">Retainage</td><td style="padding:6px 0;">${p.retainage_pct || 10}%</td></tr>
          </table>
          ${disc.length > 0 ? `<div style="margin-top:14px;display:flex;gap:4px;flex-wrap:wrap;">${disc.map(d => `<span class="discipline-tag">${esc(d)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Key Dates</div></div>
          <table style="width:100%;font-size:13px;">
            <tr><td style="color:var(--text-muted);padding:6px 0;width:160px;">Bid Date</td><td style="padding:6px 0;">${formatDate(p.bid_date)}</td></tr>
            <tr><td style="color:var(--text-muted);padding:6px 0;">Award Date</td><td style="padding:6px 0;">${formatDate(p.award_date)}</td></tr>
            <tr><td style="color:var(--text-muted);padding:6px 0;">Start Date</td><td style="padding:6px 0;">${formatDate(p.start_date)}</td></tr>
            <tr><td style="color:var(--text-muted);padding:6px 0;">Substantial Completion</td><td style="padding:6px 0;">${formatDate(p.substantial_completion)}</td></tr>
            <tr><td style="color:var(--text-muted);padding:6px 0;">Final Completion</td><td style="padding:6px 0;">${formatDate(p.final_completion)}</td></tr>
          </table>
        </div>
      </div>`;
  },

  moduleStub(title, icon, desc) {
    return `
      <div class="page-header"><div><h1 class="page-title">${icon} ${title}</h1><p class="page-subtitle">${desc}</p></div></div>
      <div class="card" style="text-align:center;padding:60px;">
        <div style="font-size:48px;margin-bottom:16px;opacity:0.3;">${icon}</div>
        <div style="font-size:16px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">Coming in Phase 2</div>
        <div style="font-size:13px;color:var(--text-muted);max-width:400px;margin:0 auto;">This module is part of the build roadmap. Foundation is in place — database schema, API endpoints, and UI components are ready.</div>
      </div>`;
  },

  renderSOV(c) { c.innerHTML = this.moduleStub('Schedule of Values', '📋', 'Manage AIA G703 line items for progress billing.'); },
  renderBilling(c) { c.innerHTML = this.moduleStub('Progress Billing', '💰', 'Generate AIA G702/G703 payment applications.'); },
  renderChangeOrders(c) { c.innerHTML = this.moduleStub('Change Orders', '📝', 'Track scope changes and pricing impacts.'); },
  renderRFIs(c) { c.innerHTML = this.moduleStub('RFI Tracker', '❓', 'Track questions to architect/engineer.'); },
  renderSubmittals(c) { c.innerHTML = this.moduleStub('Submittal Log', '📎', 'Track submittals for architect approval.'); },
  renderDailyLog(c) { c.innerHTML = this.moduleStub('Daily Log', '📅', 'Record daily field activity.'); },
  renderPunchList(c) { c.innerHTML = this.moduleStub('Punch List', '✅', 'Track deficiency items at closeout.'); },
  renderContacts(c) { c.innerHTML = this.moduleStub('Project Contacts', '👥', 'Directory of project stakeholders.'); },
  renderDocuments(c) { c.innerHTML = this.moduleStub('Document Manager', '📁', 'Upload and organize project documents.'); },
  renderProjectSettings(c) { c.innerHTML = this.moduleStub('Project Settings', '⚙️', 'Edit project details and configuration.'); },

  showNewProjectModal() {
    const statuses = ['bidding','awarded','active','on_hold','punch_list','closeout','complete'];
    const types = ['new_construction','renovation','tenant_improvement','design_build','service'];
    this.showModal('New Project', `
      <div class="form-grid">
        <div class="form-group form-full"><label class="form-label">Project Name *</label><input class="form-input" id="np-name" placeholder="e.g. ABC Office Tower ELV"></div>
        <div class="form-group"><label class="form-label">Project Number</label><input class="form-input" id="np-number" placeholder="e.g. 2026-031"></div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="np-status">${statuses.map(s => `<option value="${s}" ${s === 'active' ? 'selected' : ''}>${formatStatus(s)}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Project Type</label><select class="form-select" id="np-type"><option value="">Select type...</option>${types.map(t => `<option value="${t}">${t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Contract Value ($)</label><input class="form-input" id="np-value" type="number" step="0.01" placeholder="0.00"></div>
        <hr class="form-divider">
        <div class="form-section-title">Client / GC</div>
        <div class="form-group"><label class="form-label">Client Name</label><input class="form-input" id="np-client" placeholder="Client company"></div>
        <div class="form-group"><label class="form-label">GC Name</label><input class="form-input" id="np-gc" placeholder="General contractor"></div>
        <hr class="form-divider">
        <div class="form-section-title">Location</div>
        <div class="form-group form-full"><label class="form-label">Address</label><input class="form-input" id="np-address" placeholder="Street address"></div>
        <div class="form-group"><label class="form-label">City</label><input class="form-input" id="np-city"></div>
        <div class="form-group"><label class="form-label">State</label><input class="form-input" id="np-state" placeholder="e.g. TX"></div>
      </div>`, async () => {
      const name = document.getElementById('np-name').value.trim();
      if (!name) { this.toast('Project name is required', 'warning'); return; }
      const val = parseFloat(document.getElementById('np-value').value) || 0;
      const data = {
        name,
        project_number: document.getElementById('np-number').value.trim(),
        status: document.getElementById('np-status').value,
        type: document.getElementById('np-type').value,
        original_contract_value: val,
        current_contract_value: val,
        client_name: document.getElementById('np-client').value.trim(),
        gc_name: document.getElementById('np-gc').value.trim(),
        address: document.getElementById('np-address').value.trim(),
        city: document.getElementById('np-city').value.trim(),
        state: document.getElementById('np-state').value.trim(),
      };
      const res = await API.createProject(data);
      if (res.error) { this.toast(res.error, 'error'); return; }
      this.closeModal();
      this.toast('Project created!', 'success');
      this.navigate(`project/${res.id}/overview`);
    });
  },

  showImportModal() {
    this.showModal('Import from SmartPlans', `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:48px;margin-bottom:16px;">📦</div>
        <p style="color:var(--text-secondary);margin-bottom:20px;line-height:1.7;">Select a SmartPlans JSON export file to create a new project with pre-populated data, pricing config, and RFIs.</p>
        <input type="file" id="import-file" accept=".json" style="display:none;">
        <button class="btn btn-primary" onclick="document.getElementById('import-file').click()">📁 Choose JSON File</button>
        <div id="import-preview" style="display:none;margin-top:20px;text-align:left;"></div>
      </div>`, null);
    setTimeout(() => {
      const fi = document.getElementById('import-file');
      if (fi) fi.addEventListener('change', (e) => this.handleImportFile(e.target.files[0]));
    }, 100);
  },

  async handleImportFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data._meta || data._meta.format !== 'smartplans-export') {
        this.toast('Invalid file — not a SmartPlans export', 'error'); return;
      }
      const preview = document.getElementById('import-preview');
      if (preview) {
        preview.style.display = 'block';
        preview.innerHTML = `
          <div class="card" style="margin-top:12px;">
            <div class="card-title" style="margin-bottom:12px;">Import Preview</div>
            <table style="width:100%;font-size:13px;">
              <tr><td style="color:var(--text-muted);padding:4px 0;">Project</td><td style="padding:4px 0;font-weight:600;">${esc(data.project?.name || '—')}</td></tr>
              <tr><td style="color:var(--text-muted);padding:4px 0;">Type</td><td style="padding:4px 0;">${esc(data.project?.type || '—')}</td></tr>
              <tr><td style="color:var(--text-muted);padding:4px 0;">Location</td><td style="padding:4px 0;">${esc(data.project?.location || '—')}</td></tr>
              <tr><td style="color:var(--text-muted);padding:4px 0;">Disciplines</td><td style="padding:4px 0;">${(data.project?.disciplines || []).join(', ')}</td></tr>
              <tr><td style="color:var(--text-muted);padding:4px 0;">Pricing Tier</td><td style="padding:4px 0;">${(data.pricingConfig?.tier || 'mid').toUpperCase()}</td></tr>
              <tr><td style="color:var(--text-muted);padding:4px 0;">RFIs</td><td style="padding:4px 0;">${data.rfis?.selected || 0} selected of ${data.rfis?.total || 0}</td></tr>
            </table>
            <button class="btn btn-success" style="width:100%;margin-top:16px;" id="confirm-import">✓ Import Project</button>
          </div>`;
        document.getElementById('confirm-import').addEventListener('click', async () => {
          const res = await API.importSmartPlans(data);
          if (res.error) { this.toast(res.error, 'error'); return; }
          this.closeModal();
          this.toast('Project imported from SmartPlans!', 'success');
          this.navigate(`project/${res.id}/overview`);
        });
      }
    } catch (err) { this.toast('Failed to parse JSON file', 'error'); }
  },

  showModal(title, bodyHtml, onSave) {
    const m = document.createElement('div');
    m.className = 'modal-backdrop'; m.id = 'active-modal';
    m.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h2 class="modal-title">${title}</h2><button class="modal-close" onclick="App.closeModal()">✕</button></div>
        <div class="modal-body">${bodyHtml}</div>
        ${onSave ? `<div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="modal-save">Save</button></div>` : ''}
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => { if (e.target === m) this.closeModal(); });
    if (onSave) document.getElementById('modal-save').addEventListener('click', onSave);
  },

  closeModal() {
    const m = document.getElementById('active-modal'); if (m) m.remove();
  },
};

// Utilities
function esc(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
function formatMoney(a) { return Number(a || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function formatDate(s) { if (!s) return '—'; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatStatus(s) { return s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'; }

document.addEventListener('DOMContentLoaded', () => App.init());
