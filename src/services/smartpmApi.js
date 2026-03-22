// ═══════════════════════════════════════════════════════════════
// SmartPM → SmartPlans API Client
// All data persists server-side in D1 — nothing in localStorage.
// ═══════════════════════════════════════════════════════════════

// SmartPlans API base URL — same domain in production, proxy in dev
const API_BASE = import.meta.env.VITE_SMARTPLANS_API || 'https://smartplans.pages.dev';

/**
 * Helper: fetch with error handling
 */
async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${path}`;
    try {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || `API error ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error(`[SmartPM API] ${options.method || 'GET'} ${path} failed:`, err.message);
        throw err;
    }
}

// ═══════════════════════════════════════════════════════════════
// DAILY LOGS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all daily logs for a project
 * @param {string} projectId - Project identifier (default: 'default')
 * @returns {Promise<Array>} Array of log entries
 */
export async function fetchDailyLogs(projectId = 'default') {
    const data = await apiFetch(`/api/pm/logs?project_id=${encodeURIComponent(projectId)}`);
    return data.logs || [];
}

/**
 * Save a new daily log entry
 * @param {Object} log - Log entry with moduleId, item, qtyInstalled, hoursUsed, etc.
 * @returns {Promise<Object>} { id, success }
 */
export async function saveDailyLog(log) {
    return apiFetch('/api/pm/logs', {
        method: 'POST',
        body: JSON.stringify({
            id: log.id,
            project_id: log.projectId || 'default',
            module_id: log.moduleId,
            item: log.item,
            unit: log.unit || 'EA',
            qty_installed: log.qtyInstalled,
            hours_used: log.hoursUsed,
            logged_at: log.loggedAt || new Date().toISOString(),
            notes: log.notes || null,
        }),
    });
}

/**
 * Delete a daily log entry by ID
 * @param {string} logId - Log entry ID
 * @returns {Promise<Object>} { success, deleted }
 */
export async function deleteDailyLog(logId) {
    return apiFetch(`/api/pm/logs/${logId}`, { method: 'DELETE' });
}

/**
 * Delete all daily logs for a project (reset progress)
 * @param {string} projectId - Project identifier
 * @returns {Promise<Object>} { success, deleted_count }
 */
export async function deleteAllProjectLogs(projectId = 'default') {
    return apiFetch(`/api/pm/logs/bulk`, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete_all', project_id: projectId }),
    });
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS (Passwords, preferences)
// ═══════════════════════════════════════════════════════════════

/**
 * Get a specific setting by key
 * @param {string} key - Setting key (e.g., 'passwords', 'projectSettings')
 * @returns {Promise<any>} Setting value (auto-parsed if JSON)
 */
export async function getSetting(key) {
    const data = await apiFetch(`/api/pm/settings?key=${encodeURIComponent(key)}`);
    return data.value;
}

/**
 * Get all settings
 * @returns {Promise<Object>} Key-value map of all settings
 */
export async function getAllSettings() {
    const data = await apiFetch('/api/pm/settings');
    return data.settings || {};
}

/**
 * Save a setting (upsert)
 * @param {string} key - Setting key
 * @param {any} value - Setting value (will be JSON-serialized)
 * @returns {Promise<Object>} { success, key }
 */
export async function saveSetting(key, value) {
    return apiFetch('/api/pm/settings', {
        method: 'POST',
        body: JSON.stringify({ key, value }),
    });
}
