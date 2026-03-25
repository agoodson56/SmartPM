// ═══════════════════════════════════════════════════════════════
// SMARTPM — API CLIENT
// ═══════════════════════════════════════════════════════════════

const API = {
  baseUrl: '/api',
  token: sessionStorage.getItem('pm_token') || null,
  user: JSON.parse(sessionStorage.getItem('pm_user') || 'null'),

  _activeRequests: 0,
  _pendingGets: new Map(),

  async request(method, path, body) {
    // Deduplicate concurrent GET requests
    if (method === 'GET') {
      const key = path;
      if (this._pendingGets.has(key)) {
        return this._pendingGets.get(key);
      }
      const promise = this._doRequest(method, path, body);
      this._pendingGets.set(key, promise);
      promise.finally(() => this._pendingGets.delete(key));
      return promise;
    }
    return this._doRequest(method, path, body);
  },

  async _doRequest(method, path, body, _retries = 0) {
    this._activeRequests++;
    if (typeof App !== 'undefined') App.state.loading = true;

    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Retry on transient server errors (502, 503, 504) — max 2 retries
      if (res.status >= 500 && _retries < 2) {
        const delay = Math.min(1000 * Math.pow(2, _retries), 5000);
        await new Promise(r => setTimeout(r, delay));
        this._activeRequests--;
        return this._doRequest(method, path, body, _retries + 1);
      }

      if (res.status === 401) {
        this.logout();
        return { error: 'Session expired. Please log in again.' };
      }

      const data = await res.json();
      if (!res.ok) {
        // Support structured error codes from import/reimport endpoints
        return {
          error: data.message || data.error || `Request failed (${res.status})`,
          errorCode: data.error, // e.g. 'DUPLICATE_IMPORT', 'IMPORT_NO_VALUE'
          status: res.status,
        };
      }
      return data;
    } catch (err) {
      // Network error — retry with exponential backoff
      if (_retries < 2) {
        const delay = Math.min(1000 * Math.pow(2, _retries), 5000);
        await new Promise(r => setTimeout(r, delay));
        this._activeRequests--;
        return this._doRequest(method, path, body, _retries + 1);
      }
      console.error('API Error:', err);
      return { error: 'Network error. Please check your connection.' };
    } finally {
      this._activeRequests--;
      if (this._activeRequests <= 0) {
        this._activeRequests = 0;
        if (typeof App !== 'undefined') App.state.loading = false;
      }
    }
  },

  // Auth
  async login(username, password) {
    const res = await this.request('POST', '/auth/login', { username, password });
    if (res.token) {
      this.token = res.token;
      this.user = res.user;
      sessionStorage.setItem('pm_token', res.token);
      sessionStorage.setItem('pm_user', JSON.stringify(res.user));
    }
    return res;
  },

  async logout() {
    // Invalidate the session on the server first
    if (this.token) {
      try { await this.request('POST', '/auth/logout'); } catch (e) { /* best-effort */ }
    }
    this.token = null;
    this.user = null;
    sessionStorage.removeItem('pm_token');
    sessionStorage.removeItem('pm_user');
    if (typeof App !== 'undefined') App.render();
  },

  isAuthenticated() {
    return !!this.token && !!this.user;
  },

  changePassword(target_username, new_password) {
    return this.request('POST', '/auth/change-password', { target_username, new_password });
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
  reimportSmartPlans(projectId, data) { return this.request('POST', `/projects/${projectId}/reimport`, data); },

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

  // Infrastructure (MDF/IDF)
  getInfrastructure(projectId) { return this.request('GET', `/projects/${projectId}/infrastructure`); },
  getLocation(projectId, locId) { return this.request('GET', `/projects/${projectId}/infrastructure/${locId}`); },
  createLocation(projectId, data) { return this.request('POST', `/projects/${projectId}/infrastructure`, data); },
  updateLocation(projectId, locId, data) { return this.request('PUT', `/projects/${projectId}/infrastructure/${locId}`, data); },
  deleteLocation(projectId, locId) { return this.request('DELETE', `/projects/${projectId}/infrastructure/${locId}`); },
  locationAction(projectId, locId, data) { return this.request('POST', `/projects/${projectId}/infrastructure/${locId}`, data); },

  // Work Breakdown Structure (WBS)
  getWBS(projectId) { return this.request('GET', `/projects/${projectId}/wbs`); },
  createWBSTask(projectId, data) { return this.request('POST', `/projects/${projectId}/wbs`, data); },
  updateWBSTask(projectId, taskId, data) { return this.request('PUT', `/projects/${projectId}/wbs/${taskId}`, data); },
  deleteWBSTask(projectId, taskId) { return this.request('DELETE', `/projects/${projectId}/wbs/${taskId}`); },

  // Documents
  getDocuments(projectId) { return this.request('GET', `/projects/${projectId}/documents`); },
  getDocument(projectId, docId, metaOnly) { return this.request('GET', `/projects/${projectId}/documents/${docId}${metaOnly ? '?meta=true' : ''}`); },
  uploadDocument(projectId, data) { return this.request('POST', `/projects/${projectId}/documents`, data); },
  deleteDocument(projectId, docId) { return this.request('DELETE', `/projects/${projectId}/documents/${docId}`); },

  // Dashboard
  getDashboard() { return this.request('GET', '/dashboard'); },
};
