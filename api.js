// ═══════════════════════════════════════════════════════════════
// 3D PROJECT MANAGER — API CLIENT
// ═══════════════════════════════════════════════════════════════

const API = {
  baseUrl: '/api',
  token: localStorage.getItem('pm_token') || null,
  user: JSON.parse(localStorage.getItem('pm_user') || 'null'),

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 401) {
        this.logout();
        return { error: 'Session expired. Please log in again.' };
      }

      const data = await res.json();
      if (!res.ok) return { error: data.error || `Request failed (${res.status})` };
      return data;
    } catch (err) {
      console.error('API Error:', err);
      return { error: 'Network error. Please check your connection.' };
    }
  },

  // Auth
  async login(username, password) {
    const res = await this.request('POST', '/auth/login', { username, password });
    if (res.token) {
      this.token = res.token;
      this.user = res.user;
      localStorage.setItem('pm_token', res.token);
      localStorage.setItem('pm_user', JSON.stringify(res.user));
    }
    return res;
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    if (typeof App !== 'undefined') App.render();
  },

  isAuthenticated() {
    return !!this.token && !!this.user;
  },

  // Projects
  getProjects(filters) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return this.request('GET', `/projects${params}`);
  },
  getProject(id) { return this.request('GET', `/projects/${id}`); },
  createProject(data) { return this.request('POST', '/projects', data); },
  updateProject(id, data) { return this.request('PUT', `/projects/${id}`, data); },
  deleteProject(id) { return this.request('DELETE', `/projects/${id}`); },
  importSmartPlans(data) { return this.request('POST', '/projects/import', data); },

  // SOV
  getSOV(projectId) { return this.request('GET', `/projects/${projectId}/sov`); },
  createSOVItem(projectId, data) { return this.request('POST', `/projects/${projectId}/sov`, data); },
  updateSOVItem(projectId, itemId, data) { return this.request('PUT', `/projects/${projectId}/sov/${itemId}`, data); },
  deleteSOVItem(projectId, itemId) { return this.request('DELETE', `/projects/${projectId}/sov/${itemId}`); },

  // Billing
  getBillingPeriods(projectId) { return this.request('GET', `/projects/${projectId}/billing`); },
  createBillingPeriod(projectId, data) { return this.request('POST', `/projects/${projectId}/billing`, data); },
  getBillingPeriod(projectId, periodId) { return this.request('GET', `/projects/${projectId}/billing/${periodId}`); },
  updateBillingPeriod(projectId, periodId, data) { return this.request('PUT', `/projects/${projectId}/billing/${periodId}`, data); },

  // Change Orders
  getChangeOrders(projectId) { return this.request('GET', `/projects/${projectId}/cos`); },
  createChangeOrder(projectId, data) { return this.request('POST', `/projects/${projectId}/cos`, data); },
  updateChangeOrder(projectId, coId, data) { return this.request('PUT', `/projects/${projectId}/cos/${coId}`, data); },

  // RFIs
  getRFIs(projectId) { return this.request('GET', `/projects/${projectId}/rfis`); },
  createRFI(projectId, data) { return this.request('POST', `/projects/${projectId}/rfis`, data); },
  updateRFI(projectId, rfiId, data) { return this.request('PUT', `/projects/${projectId}/rfis/${rfiId}`, data); },

  // Submittals
  getSubmittals(projectId) { return this.request('GET', `/projects/${projectId}/submittals`); },
  createSubmittal(projectId, data) { return this.request('POST', `/projects/${projectId}/submittals`, data); },
  updateSubmittal(projectId, subId, data) { return this.request('PUT', `/projects/${projectId}/submittals/${subId}`, data); },

  // Daily Logs
  getDailyLogs(projectId) { return this.request('GET', `/projects/${projectId}/logs`); },
  createDailyLog(projectId, data) { return this.request('POST', `/projects/${projectId}/logs`, data); },
  updateDailyLog(projectId, logId, data) { return this.request('PUT', `/projects/${projectId}/logs/${logId}`, data); },

  // Punch List
  getPunchItems(projectId) { return this.request('GET', `/projects/${projectId}/punch`); },
  createPunchItem(projectId, data) { return this.request('POST', `/projects/${projectId}/punch`, data); },
  updatePunchItem(projectId, itemId, data) { return this.request('PUT', `/projects/${projectId}/punch/${itemId}`, data); },

  // Contacts
  getContacts(projectId) {
    const path = projectId ? `/projects/${projectId}/contacts` : '/contacts';
    return this.request('GET', path);
  },
  createContact(data) { return this.request('POST', '/contacts', data); },
  updateContact(id, data) { return this.request('PUT', `/contacts/${id}`, data); },
  deleteContact(id) { return this.request('DELETE', `/contacts/${id}`); },

  // Dashboard
  getDashboard() { return this.request('GET', '/dashboard'); },
};
