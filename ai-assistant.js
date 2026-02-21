// ═══════════════════════════════════════════════════════════════
// SMARTPM — AI ASSISTANT v1.0
// Powered by Gemini 3.1 Pro Preview
// 6 AI-Powered Features for Project Intelligence
// ═══════════════════════════════════════════════════════════════
//
// Features:
//   1. AI Daily Log Summary — Weekly/monthly progress reports
//   2. Smart RFI Drafting — AI-generated RFI questions
//   3. Change Order Impact — Schedule & cost impact analysis
//   4. Punch List Prioritization — AI-ranked by criticality
//   5. Budget Forecasting — Spending trends & completion cost
//   6. SOV Progress Validation — Cross-check % vs daily logs
// ═══════════════════════════════════════════════════════════════

const AIAssistant = {

    config: {
        model: 'gemini-3.1-pro-preview',
        temperature: 0.15,
        maxTokens: 8192,
    },

    // ═══════════════════════════════════════════════════════════
    // CORE — Call Gemini via server proxy
    // ═══════════════════════════════════════════════════════════

    async _callGemini(prompt, options = {}) {
        const body = {
            _model: options.model || this.config.model,
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: options.temperature || this.config.temperature,
                maxOutputTokens: options.maxTokens || this.config.maxTokens,
                topP: 0.95,
            },
        };

        // Enable thinking for deep analysis
        if (options.thinking) {
            body.generationConfig.thinkingConfig = { thinkingLevel: 'medium' };
        }

        const headers = { 'Content-Type': 'application/json' };
        if (API.token) headers['Authorization'] = `Bearer ${API.token}`;

        const res = await fetch('/api/ai/invoke', {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `AI request failed (${res.status})`);
        }

        const data = await res.json();
        const allParts = data?.candidates?.[0]?.content?.parts || [];
        const text = allParts.filter(p => p.text && !p.thought).map(p => p.text).join('\n') || '';

        if (!text || text.length < 20) {
            throw new Error('AI returned an empty response. Please try again.');
        }

        return text;
    },

    // Helper: Show AI results in a modal
    _showAIModal(title, icon, content, actions = '') {
        const html = `
      <div class="ai-result">
        <div class="ai-result-header">
          <span style="font-size:28px;">${icon}</span>
          <div>
            <div style="font-weight:700;font-size:16px;color:var(--text-primary);">${title}</div>
            <div style="font-size:12px;color:var(--primary);font-weight:600;">Powered by Gemini 3.1 Pro</div>
          </div>
        </div>
        <div class="ai-result-body">${content}</div>
        ${actions ? `<div class="ai-result-actions">${actions}</div>` : ''}
      </div>`;
        App.showModal(`🤖 AI Assistant — ${title}`, html, null);
    },

    // Helper: Show loading state
    _showLoading(title) {
        App.showModal(`🤖 AI Assistant`, `
      <div style="text-align:center;padding:40px 20px;">
        <div class="ai-spinner"></div>
        <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-top:20px;">${title}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:8px;">Gemini 3.1 Pro is analyzing your project data…</div>
      </div>`, null);
    },

    // ═══════════════════════════════════════════════════════════
    // FEATURE 1: AI DAILY LOG SUMMARY
    // Generates weekly/monthly progress reports from log entries
    // ═══════════════════════════════════════════════════════════

    async generateDailyLogSummary(projectId) {
        this._showLoading('Generating Progress Report…');

        try {
            const [projRes, logsRes] = await Promise.all([
                API.getProject(projectId),
                API.getDailyLogs(projectId),
            ]);

            if (logsRes.error) throw new Error(logsRes.error);
            const logs = logsRes.logs || logsRes.data || logsRes;
            if (!Array.isArray(logs) || logs.length === 0) {
                App.closeModal();
                App.toast('No daily log entries to summarize', 'error');
                return;
            }

            const project = projRes.project || projRes;
            const logData = logs.map(l => ({
                date: l.log_date,
                weather: l.weather,
                crew: l.crew_size,
                hours: l.hours_worked,
                work: l.work_performed,
                areas: l.areas_worked,
                delays: l.delays,
                safety: l.safety_incidents,
            }));

            const prompt = `You are a senior ELV construction project manager. Analyze these daily log entries and generate a professional progress report.

PROJECT: ${project.name || 'Project'}
CLIENT: ${project.client_name || 'N/A'}
CONTRACT VALUE: $${(project.current_contract_value || 0).toLocaleString()}

DAILY LOG ENTRIES (${logs.length} total):
${JSON.stringify(logData, null, 2)}

Generate a comprehensive progress report with these sections:

1. **EXECUTIVE SUMMARY** — 2-3 sentence overview of progress
2. **WORK COMPLETED** — Organized by area/discipline, what was accomplished
3. **CREW PRODUCTIVITY** — Total crew-days, average crew size, total hours, productivity assessment
4. **DELAYS & ISSUES** — Any delays, weather impacts, or issues noted
5. **SAFETY** — Any incidents or safety observations
6. **RECOMMENDATIONS** — Actionable items for the coming week

Format the report in clean HTML using <h3>, <p>, <ul>, <li>, and <strong> tags. Use professional construction industry language. Be specific with quantities, dates, and locations mentioned in the logs.`;

            const result = await this._callGemini(prompt, { thinking: true, maxTokens: 4096 });

            this._showAIModal('Progress Report', '📊', result,
                `<button class="btn btn-primary" onclick="AIAssistant._copyToClipboard(this.closest('.ai-result').querySelector('.ai-result-body'))">📋 Copy Report</button>`
            );

        } catch (err) {
            App.closeModal();
            App.toast('AI analysis failed: ' + err.message, 'error');
        }
    },

    // ═══════════════════════════════════════════════════════════
    // FEATURE 2: SMART RFI DRAFTING
    // AI-assisted RFI question generation from project context
    // ═══════════════════════════════════════════════════════════

    async generateSmartRFIs(projectId) {
        this._showLoading('Analyzing Project for RFI Opportunities…');

        try {
            const [projRes, sovRes, infraRes, logsRes] = await Promise.all([
                API.getProject(projectId),
                API.getSOV(projectId),
                API.getInfrastructure(projectId),
                API.getDailyLogs(projectId),
            ]);

            const project = projRes.project || projRes;
            const sov = sovRes.items || sovRes.data || [];
            const infra = infraRes.locations || infraRes.data || [];
            const logs = logsRes.logs || logsRes.data || logsRes;

            const prompt = `You are a senior ELV estimator and project manager. Based on this project data, identify gaps, ambiguities, or potential issues that should be clarified via RFIs (Requests for Information).

PROJECT: ${project.name || 'Project'}
TYPE: ${project.type || 'ELV'}
DISCIPLINES: ${project.disciplines || 'General'}
CLIENT: ${project.client_name || 'N/A'}
CONTRACT VALUE: $${(project.current_contract_value || 0).toLocaleString()}

SOV LINE ITEMS (${Array.isArray(sov) ? sov.length : 0}):
${JSON.stringify(Array.isArray(sov) ? sov.slice(0, 20).map(s => ({ desc: s.description, div: s.division, value: s.scheduled_value || s.material_cost + s.labor_cost })) : [], null, 2)}

INFRASTRUCTURE LOCATIONS (${Array.isArray(infra) ? infra.length : 0}):
${JSON.stringify(Array.isArray(infra) ? infra.map(l => ({ name: l.name, type: l.type, building: l.building, floor: l.floor })) : [], null, 2)}

RECENT DAILY LOGS (last 5):
${JSON.stringify(Array.isArray(logs) ? logs.slice(-5).map(l => ({ date: l.log_date, work: l.work_performed, delays: l.delays })) : [], null, 2)}

Generate 5-8 professional RFI questions that would help clarify the project scope and prevent costly assumptions. For each RFI, provide:
- A clear, specific **subject** line
- The detailed **question** to submit
- The **discipline** it relates to (structured_cabling, fire_alarm, security, audio_visual, cctv, general)
- The **priority** (critical, high, medium, low)

Respond in valid JSON array format:
[
  {
    "subject": "...",
    "question": "...",
    "discipline": "...",
    "priority": "..."
  }
]`;

            const result = await this._callGemini(prompt, { temperature: 0.2 });

            let rfis;
            try {
                const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                rfis = JSON.parse(cleaned);
            } catch {
                this._showAIModal('Smart RFI Suggestions', '❓', `<div style="white-space:pre-wrap;">${result}</div>`);
                return;
            }

            const rfiHtml = rfis.map((r, i) => `
        <div class="ai-rfi-card">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
            <div style="font-weight:700;color:var(--text-primary);">${i + 1}. ${r.subject}</div>
            <span class="badge badge--${r.priority === 'critical' ? 'error' : r.priority === 'high' ? 'amber' : 'active'}">${r.priority}</span>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">${r.question}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="discipline-tag">${r.discipline}</span>
            <button class="btn btn-sm btn-primary" onclick="AIAssistant._createRFI('${projectId}', ${JSON.stringify(r).replace(/'/g, "\\'")})">+ Create RFI</button>
          </div>
        </div>`).join('');

            this._showAIModal('Smart RFI Suggestions', '❓', rfiHtml,
                `<button class="btn btn-primary" onclick="AIAssistant._createAllRFIs('${projectId}')">Create All ${rfis.length} RFIs</button>`
            );

            // Store for batch creation
            this._pendingRFIs = rfis;

        } catch (err) {
            App.closeModal();
            App.toast('AI analysis failed: ' + err.message, 'error');
        }
    },

    async _createRFI(projectId, rfi) {
        const parsed = typeof rfi === 'string' ? JSON.parse(rfi) : rfi;
        const res = await API.createRFI(projectId, {
            subject: parsed.subject,
            question: parsed.question,
            discipline: parsed.discipline,
            priority: parsed.priority,
            submitted_to: '',
        });
        if (res.error) { App.toast(res.error, 'error'); return; }
        App.toast(`RFI created: ${parsed.subject}`, 'success');
    },

    async _createAllRFIs(projectId) {
        if (!this._pendingRFIs) return;
        let created = 0;
        for (const rfi of this._pendingRFIs) {
            const res = await API.createRFI(projectId, {
                subject: rfi.subject,
                question: rfi.question,
                discipline: rfi.discipline,
                priority: rfi.priority,
                submitted_to: '',
            });
            if (!res.error) created++;
        }
        App.closeModal();
        App.toast(`Created ${created} RFIs successfully`, 'success');
        this._pendingRFIs = null;
        // Refresh if on RFI page
        const c = document.getElementById('project-content');
        if (c && App.state.subRoute === 'rfis') App.renderRFIs(c);
    },

    // ═══════════════════════════════════════════════════════════
    // FEATURE 3: CHANGE ORDER IMPACT ANALYSIS
    // AI evaluates schedule & cost impact of proposed changes
    // ═══════════════════════════════════════════════════════════

    async analyzeChangeOrderImpact(projectId) {
        this._showLoading('Analyzing Change Order Impact…');

        try {
            const [projRes, cosRes, sovRes] = await Promise.all([
                API.getProject(projectId),
                API.getChangeOrders(projectId),
                API.getSOV(projectId),
            ]);

            const project = projRes.project || projRes;
            const cos = cosRes.changeOrders || cosRes.data || cosRes;
            const sov = sovRes.items || sovRes.data || [];

            if (!Array.isArray(cos) || cos.length === 0) {
                App.closeModal();
                App.toast('No change orders to analyze', 'error');
                return;
            }

            const prompt = `You are a senior ELV construction cost analyst. Analyze these change orders and their cumulative impact on the project.

PROJECT: ${project.name || 'Project'}
ORIGINAL CONTRACT: $${(project.original_contract_value || 0).toLocaleString()}
CURRENT CONTRACT: $${(project.current_contract_value || 0).toLocaleString()}
START DATE: ${project.start_date || 'N/A'}
SCHEDULED COMPLETION: ${project.substantial_completion || 'N/A'}

CHANGE ORDERS (${Array.isArray(cos) ? cos.length : 0}):
${JSON.stringify(Array.isArray(cos) ? cos.map(c => ({
                title: c.title, type: c.type, status: c.status,
                material: c.material_cost, labor: c.labor_cost, equipment: c.equipment_cost,
                total: c.total_amount, markup: c.markup_pct, schedule_days: c.schedule_impact_days,
                requested_date: c.requested_date,
            })) : [], null, 2)}

SOV SUMMARY:
- Total divisions: ${Array.isArray(sov) ? sov.length : 0}
- Total scheduled value: $${Array.isArray(sov) ? sov.reduce((s, i) => s + (i.scheduled_value || (i.material_cost || 0) + (i.labor_cost || 0)), 0).toLocaleString() : '0'}

Provide a comprehensive analysis in HTML format:

1. **FINANCIAL IMPACT SUMMARY** — Total approved/pending CO value, % of original contract, cost growth analysis
2. **SCHEDULE IMPACT** — Cumulative days added, revised completion estimate, critical path concerns
3. **RISK ASSESSMENT** — Which COs carry the highest risk, potential for scope creep, unfunded liability
4. **TREND ANALYSIS** — CO frequency pattern, common types, whether the project is trending over/under budget
5. **RECOMMENDATIONS** — Specific actions to control costs and schedule

Use <h3>, <p>, <ul>, <li>, <strong>, and <table> tags. Include dollar amounts and percentages. Be specific and actionable.`;

            const result = await this._callGemini(prompt, { thinking: true, maxTokens: 6144 });
            this._showAIModal('Change Order Impact Analysis', '📝', result);

        } catch (err) {
            App.closeModal();
            App.toast('AI analysis failed: ' + err.message, 'error');
        }
    },

    // ═══════════════════════════════════════════════════════════
    // FEATURE 4: PUNCH LIST PRIORITIZATION
    // AI ranks items by criticality and suggests resolution order
    // ═══════════════════════════════════════════════════════════

    async prioritizePunchList(projectId) {
        this._showLoading('Prioritizing Punch List Items…');

        try {
            const [projRes, punchRes] = await Promise.all([
                API.getProject(projectId),
                API.getPunchItems(projectId),
            ]);

            const project = projRes.project || projRes;
            const items = punchRes.items || punchRes.data || punchRes;

            if (!Array.isArray(items) || items.length === 0) {
                App.closeModal();
                App.toast('No punch list items to prioritize', 'error');
                return;
            }

            const openItems = items.filter(i => i.status !== 'verified' && i.status !== 'completed');
            if (openItems.length === 0) {
                App.closeModal();
                App.toast('All punch items are already completed!', 'success');
                return;
            }

            const prompt = `You are a senior ELV construction superintendent managing project closeout. Prioritize these punch list items for maximum efficiency.

PROJECT: ${project.name || 'Project'}
DISCIPLINES: ${project.disciplines || 'General'}
COMPLETION DATE: ${project.substantial_completion || 'ASAP'}

OPEN PUNCH ITEMS (${openItems.length}):
${JSON.stringify(openItems.map(i => ({
                id: i.id,
                location: i.location,
                description: i.description,
                priority: i.priority,
                discipline: i.discipline,
                assigned_to: i.assigned_to,
                status: i.status,
                due_date: i.due_date,
            })), null, 2)}

Analyze and provide:

1. **PRIORITY RANKING** — Reorder items from most to least critical, considering:
   - Life safety items first (fire alarm, emergency systems)
   - Code compliance items second
   - Functional/operational items third
   - Cosmetic/punch items last
   - Group items by location for efficient walk-through
   
2. **SUGGESTED RESOLUTION ORDER** — Optimal sequence to clear punch items considering:
   - Dependencies (what must be done before what)
   - Trade coordination (group by discipline)
   - Location efficiency (minimize travel)
   
3. **ESTIMATED EFFORT** — For each item, estimate crew hours needed
4. **RISK FLAGS** — Items that could delay certificate of occupancy
5. **ACTION PLAN** — Day-by-day plan to clear the punch list

Format in HTML with <h3>, <p>, <ul>, <li>, <table>, <strong>.`;

            const result = await this._callGemini(prompt, { thinking: true, maxTokens: 6144 });
            this._showAIModal('Punch List Priority Plan', '✅', result);

        } catch (err) {
            App.closeModal();
            App.toast('AI analysis failed: ' + err.message, 'error');
        }
    },

    // ═══════════════════════════════════════════════════════════
    // FEATURE 5: BUDGET FORECASTING
    // AI analyzes spending trends and predicts completion cost
    // ═══════════════════════════════════════════════════════════

    async forecastBudget(projectId) {
        this._showLoading('Forecasting Budget & Completion Cost…');

        try {
            const [projRes, sovRes, cosRes, billingRes, infraRes] = await Promise.all([
                API.getProject(projectId),
                API.getSOV(projectId),
                API.getChangeOrders(projectId),
                API.getBillingPeriods(projectId),
                API.getInfrastructure(projectId),
            ]);

            const project = projRes.project || projRes;
            const sov = sovRes.items || sovRes.data || [];
            const cos = cosRes.changeOrders || cosRes.data || cosRes;
            const billing = billingRes.periods || billingRes.data || billingRes;
            const infra = infraRes.locations || infraRes.data || [];

            const prompt = `You are a senior ELV construction financial analyst. Analyze this project's financial data and forecast the final project cost.

PROJECT: ${project.name || 'Project'}
ORIGINAL CONTRACT: $${(project.original_contract_value || 0).toLocaleString()}
CURRENT CONTRACT: $${(project.current_contract_value || 0).toLocaleString()}
TOTAL BILLED: $${(project.total_billed || 0).toLocaleString()}
TOTAL PAID: $${(project.total_paid || 0).toLocaleString()}
RETAINAGE: ${project.retainage_pct || 10}%
START DATE: ${project.start_date || 'N/A'}
SCHEDULED COMPLETION: ${project.substantial_completion || 'N/A'}

SCHEDULE OF VALUES (${Array.isArray(sov) ? sov.length : 0} line items):
${JSON.stringify(Array.isArray(sov) ? sov.map(s => ({
                desc: s.description, division: s.division,
                material: s.material_cost, labor: s.labor_cost,
                total: (s.material_cost || 0) + (s.labor_cost || 0) + (s.equipment_cost || 0) + (s.sub_cost || 0),
                pct_complete: s.total_completed_pct,
            })) : [], null, 2)}

CHANGE ORDERS: ${Array.isArray(cos) ? cos.length : 0} total
- Approved value: $${Array.isArray(cos) ? cos.filter(c => c.status === 'approved').reduce((s, c) => s + (c.total_amount || 0), 0).toLocaleString() : '0'}
- Pending value: $${Array.isArray(cos) ? cos.filter(c => c.status === 'pending' || c.status === 'submitted').reduce((s, c) => s + (c.total_amount || 0), 0).toLocaleString() : '0'}

BILLING PERIODS: ${Array.isArray(billing) ? billing.length : 0}

INFRASTRUCTURE LOCATIONS: ${Array.isArray(infra) ? infra.length : 0}

Provide a comprehensive financial forecast in HTML:

1. **PROJECT HEALTH SCORECARD** — Overall financial health (🟢🟡🔴), earned value metrics (CPI, SPI if calculable)
2. **BUDGET STATUS** — By division/category, which are over/under budget
3. **COST FORECAST** — Estimated cost at completion (EAC), estimate to complete (ETC), variance at completion (VAC)
4. **CASH FLOW PROJECTION** — Expected billing over remaining months
5. **RISK FACTORS** — Pending COs, under-billed work, retainage exposure
6. **PROFIT ANALYSIS** — Projected margin, comparison to bid margin
7. **RECOMMENDATIONS** — Specific actions to improve financial performance

Use <h3>, <p>, <ul>, <li>, <table>, <strong>. Include specific dollar amounts and percentages throughout.`;

            const result = await this._callGemini(prompt, { thinking: true, maxTokens: 8192 });
            this._showAIModal('Budget Forecast & Analysis', '💰', result);

        } catch (err) {
            App.closeModal();
            App.toast('AI analysis failed: ' + err.message, 'error');
        }
    },

    // ═══════════════════════════════════════════════════════════
    // FEATURE 6: SOV PROGRESS VALIDATION
    // Cross-check reported completion % against daily logs
    // ═══════════════════════════════════════════════════════════

    async validateSOVProgress(projectId) {
        this._showLoading('Validating SOV Progress Against Daily Logs…');

        try {
            const [projRes, sovRes, logsRes, infraRes] = await Promise.all([
                API.getProject(projectId),
                API.getSOV(projectId),
                API.getDailyLogs(projectId),
                API.getInfrastructure(projectId),
            ]);

            const project = projRes.project || projRes;
            const sov = sovRes.items || sovRes.data || [];
            const logs = logsRes.logs || logsRes.data || logsRes;
            const infra = infraRes.locations || infraRes.data || [];

            if (!Array.isArray(sov) || sov.length === 0) {
                App.closeModal();
                App.toast('No SOV items to validate', 'error');
                return;
            }

            const prompt = `You are a senior ELV construction auditor performing a progress validation. Cross-check the reported Schedule of Values completion percentages against the daily log records and infrastructure tracking data.

PROJECT: ${project.name || 'Project'}
Current Contract: $${(project.current_contract_value || 0).toLocaleString()}

SOV LINE ITEMS (${sov.length}):
${JSON.stringify(sov.map(s => ({
                item: s.item_number, desc: s.description, division: s.division,
                material: s.material_cost, labor: s.labor_cost,
                total: (s.material_cost || 0) + (s.labor_cost || 0) + (s.equipment_cost || 0) + (s.sub_cost || 0),
                reported_pct: s.total_completed_pct,
            })), null, 2)}

DAILY LOGS (${Array.isArray(logs) ? logs.length : 0} entries):
${JSON.stringify(Array.isArray(logs) ? logs.map(l => ({
                date: l.log_date, crew: l.crew_size, hours: l.hours_worked,
                work: l.work_performed, areas: l.areas_worked,
            })) : [], null, 2)}

INFRASTRUCTURE STATUS (${Array.isArray(infra) ? infra.length : 0} locations):
${JSON.stringify(Array.isArray(infra) ? infra.map(l => ({
                name: l.name, type: l.type,
                items_installed: l.stats?.installed || 0, items_total: l.stats?.total || 0,
                budget_health: l.stats?.health,
            })) : [], null, 2)}

Perform a thorough audit and provide:

1. **VALIDATION SUMMARY** — Overall assessment: are the reported %s consistent with the evidence?
2. **LINE-BY-LINE REVIEW** — For each SOV item with a completion %, evaluate:
   - Is the reported % supported by daily log evidence?
   - Are there any red flags (over-billing, front-loading)?
   - Suggested adjusted % based on available evidence
3. **DISCREPANCIES** — Flag any items where reported % seems too high or too low vs evidence
4. **OVERBILLING RISK** — Calculate potential overbilling exposure in dollars
5. **UNDERCLAIMED ITEMS** — Items where more work appears done than billed
6. **RECOMMENDATIONS** — Specific adjustments before submitting the next pay application

Use <h3>, <p>, <ul>, <li>, <table>, <strong>. Use 🟢🟡🔴 indicators for each line item's validation status. Be specific with dollar amounts.`;

            const result = await this._callGemini(prompt, { thinking: true, maxTokens: 8192 });
            this._showAIModal('SOV Progress Validation', '📋', result);

        } catch (err) {
            App.closeModal();
            App.toast('AI analysis failed: ' + err.message, 'error');
        }
    },

    // ═══════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════

    _copyToClipboard(el) {
        const text = el.innerText || el.textContent;
        navigator.clipboard.writeText(text).then(() => {
            App.toast('Report copied to clipboard', 'success');
        }).catch(() => {
            // Fallback
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('copy');
            App.toast('Report copied to clipboard', 'success');
        });
    },

    // ═══════════════════════════════════════════════════════════
    // UI INTEGRATION — Render AI buttons for each module
    // ═══════════════════════════════════════════════════════════

    renderAIButton(feature, projectId) {
        const features = {
            'daily-log-summary': { icon: '📊', label: 'AI Progress Report', fn: 'generateDailyLogSummary' },
            'smart-rfi': { icon: '❓', label: 'AI Smart RFIs', fn: 'generateSmartRFIs' },
            'co-impact': { icon: '📝', label: 'AI Impact Analysis', fn: 'analyzeChangeOrderImpact' },
            'punch-priority': { icon: '✅', label: 'AI Priority Plan', fn: 'prioritizePunchList' },
            'budget-forecast': { icon: '💰', label: 'AI Budget Forecast', fn: 'forecastBudget' },
            'sov-validate': { icon: '📋', label: 'AI Validate Progress', fn: 'validateSOVProgress' },
        };
        const f = features[feature];
        if (!f) return '';
        return `<button class="btn btn-ai" onclick="AIAssistant.${f.fn}('${projectId}')">${f.icon} ${f.label}</button>`;
    },
};
