// ═══════════════════════════════════════════════════════════════
// POST /api/projects/import — Import SmartPlans JSON export
// Uses D1 batch() for atomic execution — all or nothing.
//
// SmartPlans export format:
//   analysis.rawMarkdown  — full AI analysis text
//   analysis.sections     — OBJECT keyed by slug { title, content }
//   pricingConfig         — { tier, regionalMultiplier, markup, laborRates, ... }
//   infrastructure        — { locations: [...] }
//   workBreakdown         — { phases: [...] }
//   rfis                  — { items: [{ id, question, detail, selected }] }
//
// This import parses the rawMarkdown to extract financial line items
// for SOV population, and maps field names to the SmartPlans format.
// ═══════════════════════════════════════════════════════════════

// ── BOM Table Parser — extracts pricing tables from AI markdown ──
function extractBOMFromMarkdown(markdown) {
  if (!markdown) return { categories: [], grandTotal: 0 };
  const categories = [];
  let currentCategory = null;
  const lines = markdown.split('\n');
  let inTable = false;
  let headersParsed = false;
  let colMap = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect category headings
    const h2Match = line.match(/^#{1,3}\s+(.+)/);
    const boldMatch = !h2Match && line.match(/^\*\*([^*]{3,80})\*\*\s*$/);
    const heading = h2Match ? h2Match[1].replace(/\*+/g, '').trim() : (boldMatch ? boldMatch[1].trim() : null);

    if (heading) {
      const isCategory = /material|cost|pricing|equipment|cabling|cctv|camera|access|fire|alarm|intrusion|audio|visual|av\b|structured|backbone|infrastructure|mdf|idf|misc|general|conduit|pathway|rack|panel|device|breakdown|bill|bom/i.test(heading);
      // Exclude summary/rollup sections that re-state subtotals (causes double-counting)
      const isNonCategory = /confidence|methodology|timeline|schedule|rfi|risk|note|assumption|disclaimer|verification|validation|labor|phase|rough|trim|programming|testing|commissioning|what to do|next step|project cost summary|cost summary|investment summary|financial summary|budget summary/i.test(heading);
      if (isCategory && !isNonCategory) {
        if (currentCategory && currentCategory.items.length > 0) categories.push(currentCategory);
        currentCategory = { name: heading, items: [], subtotal: 0 };
        inTable = false; headersParsed = false; colMap = {};
      } else if (isNonCategory) {
        if (currentCategory && currentCategory.items.length > 0) categories.push(currentCategory);
        currentCategory = null; inTable = false;
      }
      continue;
    }

    if (line.startsWith('|') && line.includes('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 2) continue;
      if (cells.every(c => /^[-:]+$/.test(c))) { headersParsed = true; continue; }
      if (!headersParsed && !inTable) {
        colMap = {};
        cells.forEach((cell, idx) => {
          const cl = cell.toLowerCase();
          if (cl.includes('item') || cl.includes('description') || cl.includes('material') || cl.includes('equipment') || cl.includes('component') || cl.includes('product')) colMap.item = idx;
          else if (cl === 'qty' || cl === 'quantity' || cl.includes('qty')) colMap.qty = idx;
          else if (cl.includes('unit cost') || cl.includes('unit price') || cl.includes('rate') || cl.includes('unit$')) colMap.unitCost = idx;
          else if (cl.includes('ext') || cl.includes('total') || cl.includes('amount') || cl.includes('cost')) {
            if (colMap.extCost === undefined) colMap.extCost = idx;
          }
          else if (cl === 'unit' || cl === 'uom') colMap.unit = idx;
        });
        inTable = true; continue;
      }
      if (inTable && headersParsed && currentCategory) {
        const firstCell = cells[0] || '';
        if (/^(total|subtotal|grand total|sum|markup|margin|tax)/i.test(firstCell.replace(/\*+/g, '').trim())) {
          const lastCell = cells[cells.length - 1];
          const subtMatch = lastCell.match(/\$?([\d,]+\.?\d*)/);
          if (subtMatch) currentCategory.subtotal = parseFloat(subtMatch[1].replace(/,/g, ''));
          continue;
        }
        if (firstCell.includes('continue') || firstCell.includes('...') || firstCell.replace(/\*+/g, '').trim() === '') continue;
        const itemName = cells[colMap.item !== undefined ? colMap.item : 0] || '';
        let qty = 1, unit = 'ea', unitCost = 0, extCost = 0;
        if (colMap.qty !== undefined && cells[colMap.qty]) { const qv = cells[colMap.qty].replace(/[,\s]/g, ''); qty = parseFloat(qv) || parseInt(qv) || 1; }
        if (colMap.unit !== undefined && cells[colMap.unit]) { unit = cells[colMap.unit].toLowerCase().trim() || 'ea'; }
        if (colMap.unitCost !== undefined && cells[colMap.unitCost]) { const m = cells[colMap.unitCost].match(/\$?([\d,]+\.?\d*)/); if (m) unitCost = parseFloat(m[1].replace(/,/g, '')); }
        if (colMap.extCost !== undefined && cells[colMap.extCost]) { const m = cells[colMap.extCost].match(/\$?([\d,]+\.?\d*)/); if (m) extCost = parseFloat(m[1].replace(/,/g, '')); }
        if (extCost === 0 && unitCost > 0 && qty > 0) extCost = qty * unitCost;
        if (unitCost === 0 && extCost > 0 && qty > 0) unitCost = extCost / qty;
        // Fallback positional parsing
        if (qty === 1 && unitCost === 0 && extCost === 0 && cells.length >= 3) {
          for (let ci = 1; ci < cells.length; ci++) {
            const val = cells[ci].replace(/[,\s$]/g, ''); const num = parseFloat(val);
            if (!isNaN(num)) {
              if (qty === 1 && num === Math.floor(num) && num < 100000 && ci < cells.length - 1) qty = num;
              else if (unitCost === 0 && num > 0) unitCost = num;
              else if (extCost === 0 && num > 0) { extCost = num; break; }
            }
          }
          if (extCost === 0 && unitCost > 0) extCost = qty * unitCost;
        }
        const cleanName = itemName.replace(/\*+/g, '').trim();
        if (cleanName.length < 2 || /^[-:]+$/.test(cleanName)) continue;
        currentCategory.items.push({ item: cleanName, qty, unit, unitCost: Math.round(unitCost * 100) / 100, extCost: Math.round(extCost * 100) / 100 });
      }
    } else {
      if (inTable && headersParsed) { inTable = false; headersParsed = false; }
    }
  }
  if (currentCategory && currentCategory.items.length > 0) categories.push(currentCategory);
  let grandTotal = 0;
  for (const cat of categories) {
    if (cat.subtotal === 0) cat.subtotal = cat.items.reduce((sum, item) => sum + (item.extCost || 0), 0);
    grandTotal += cat.subtotal;
  }
  return { categories, grandTotal: Math.round(grandTotal * 100) / 100 };
}

// ── Grand Total Extractor — multiple strategies ──
function extractGrandTotal(markdown) {
  if (!markdown) return 0;
  // Strategy 1: Look for explicit "Grand Total" lines
  const patterns = [
    /grand\s*total[^$\n]*\$\s*([\d,]+(?:\.\d{1,2})?)/i,
    /total\s*(?:project|estimate|bid|contract|cost|price)[^$\n]*\$\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\*\*(?:grand\s*)?total\*\*[^$\n]*\$\s*([\d,]+(?:\.\d{1,2})?)/i,
    /total\s*with\s*markup[^$\n]*\$\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\|\s*\*?\*?(?:grand\s*)?total\*?\*?\s*\|[^|]*\|\s*\$?\s*([\d,]+(?:\.\d{1,2})?)\s*\|/i,
  ];
  for (const regex of patterns) {
    const match = markdown.match(regex);
    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > 100) return val; // Sanity check — real projects > $100
    }
  }
  return 0;
}

// ── Discipline guesser for SOV division ──
function guessDivision(name) {
  const n = name.toLowerCase();
  if (n.includes('fire') || n.includes('alarm') || n.includes('detection')) return 'Division 28';
  if (n.includes('security') || n.includes('access') || n.includes('intrusion') || n.includes('cctv') || n.includes('camera')) return 'Division 28';
  return 'Division 27';
}


export async function onRequestPost(context) {
  const { env, request, data } = context;

  try {
    const contentLength = parseInt(request.headers.get('Content-Length') || '0');
    if (contentLength > 10 * 1024 * 1024) {
        return Response.json({ error: 'PAYLOAD_TOO_LARGE', message: 'Import file exceeds 10 MB limit.' }, { status: 413 });
    }

    const pkg = await request.json();

    // Validate SmartPlans format
    if (!pkg._meta || pkg._meta.format !== 'smartplans-export') {
      return Response.json({ error: 'INVALID_FORMAT', message: 'Invalid SmartPlans export format. Please export from SmartPlans first.' }, { status: 400 });
    }

    // Validate format version compatibility
    const version = pkg._meta.version || '1.0';
    const majorVersion = parseInt(version.split('.')[0]);
    if (majorVersion > 5) {
      return Response.json({ error: 'UNSUPPORTED_VERSION', message: `SmartPlans export version ${version} is not supported. Please update SmartPM.` }, { status: 400 });
    }

    const project = pkg.project || {};

    // Validate project name
    if (!project.name || !project.name.trim()) {
      return Response.json({ error: 'MISSING_PROJECT_NAME', message: 'SmartPlans export is missing a project name. Please name your project before exporting.' }, { status: 400 });
    }

    const pricing = pkg.pricingConfig || {};
    const analysis = pkg.analysis || {};
    const rfis = pkg.rfis || {};
    const userInputs = pkg.userInputs || {};
    const id = crypto.randomUUID().replace(/-/g, '');
    const importHashData = JSON.stringify({
        name: (pkg.project || {}).name,
        total: (pkg.financials || {}).grandTotal,
        at: pkg._meta.generatedAt,
        cats: ((pkg.financials || {}).categories || []).length,
    });
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(importHashData));
    const importId = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Check for duplicate imports
    const existing = await env.DB.prepare(
      'SELECT id, name FROM projects WHERE smartplans_import_id = ?'
    ).bind(importId).first();
    if (existing) {
      return Response.json({
        error: 'DUPLICATE_IMPORT',
        message: `This estimate was already imported as "${existing.name}". Use Re-Import to update an existing project.`,
        existingProjectId: existing.id,
      }, { status: 409 });
    }

    // ── Extract contract value and SOV data ──
    // v3.0 exports include a pre-structured `financials` section.
    // v2.0 exports only have raw markdown — parse it server side.
    const rawMarkdown = analysis.rawMarkdown || '';
    const financials = pkg.financials || null;
    let bom;
    let contractValue = 0;

    if (financials && typeof financials.grandTotal === 'number' && financials.grandTotal > 0 && financials.categories && financials.categories.length > 0) {
      // v3.0+ export — use pre-structured financial data directly
      // The grandTotal is now set by _extractAIGrandTotal (the AI's actual sell price)
      bom = financials;
      contractValue = financials.grandTotal;
    } else {
      // v2.0 fallback — parse raw markdown for BOM tables
      bom = extractBOMFromMarkdown(rawMarkdown);
      // Prefer the AI's actual grand total from the text over the BOM line-item sum
      contractValue = extractGrandTotal(rawMarkdown);
      if (contractValue === 0 && bom.grandTotal > 0) {
        contractValue = bom.grandTotal;
      }
    }

    // If financials.grandTotal was from BOM sum (old export), try to get the real AI total
    if (contractValue > 0 && rawMarkdown) {
      const aiTotal = extractGrandTotal(rawMarkdown);
      if (aiTotal > 0 && aiTotal < contractValue * 0.95) {
        // The AI's actual total is significantly lower — use it (BOM was double-counting)
        contractValue = aiTotal;
      }
    }

    // Fallback to infrastructure totals if everything else fails
    if (contractValue === 0) {
      const infraCheck = pkg.infrastructure || {};
      if (infraCheck.locations && Array.isArray(infraCheck.locations)) {
        contractValue = infraCheck.locations.reduce((sum, loc) => {
          return sum + (loc.items || []).reduce((s, i) => s + (i.budgeted_cost || 0), 0);
        }, 0);
      }
    }

    // Validate contract value is a valid number
    if (typeof contractValue !== 'number' || isNaN(contractValue) || contractValue <= 0) {
      return Response.json({
        error: 'IMPORT_NO_VALUE',
        message: 'Could not extract a contract value from the SmartPlans export. The AI analysis may be incomplete — try re-running the estimate in SmartPlans.',
      }, { status: 400 });
    }

    // ── Collect ALL statements into a batch for atomic execution ──
    const statements = [];

    // 1. Create project — field names mapped to SmartPlans export format
    statements.push(
      env.DB.prepare(`
        INSERT INTO projects (
          id, name, status, type,
          address, jurisdiction,
          original_contract_value, current_contract_value,
          disciplines, pricing_tier, regional_multiplier, prevailing_wage, work_shift,
          markup_material, markup_labor, markup_equipment, markup_subcontractor,
          labor_rates, burden_rate, include_burden,
          notes, smartplans_import_id, created_by
        ) VALUES (
          ?, ?, 'active', ?,
          ?, ?,
          ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?
        )
      `).bind(
        id,
        project.name || 'Imported Project',
        project.type || null,
        project.location || null,
        project.jurisdiction || null,
        contractValue,
        contractValue,
        project.disciplines ? JSON.stringify(project.disciplines) : null,
        pricing.tier || 'mid',
        pricing.regionalMultiplier || 'national_average',
        project.prevailingWage || pricing.prevailingWage || '',
        project.workShift || pricing.workShift || '',
        pricing.markup?.material || 25,
        pricing.markup?.labor || 30,
        pricing.markup?.equipment || 15,
        pricing.markup?.subcontractor || 10,
        pricing.laborRates ? JSON.stringify(pricing.laborRates) : null,
        pricing.burdenRate || 35,
        pricing.includeBurden !== undefined ? (pricing.includeBurden ? 1 : 0) : 1,
        `Imported from SmartPlans on ${new Date().toLocaleDateString()}. ${userInputs.notes || ''}`.trim(),
        importId,
        data.user.id,
      )
    );

    // 2. Import SOV line items — each BOM category → one SOV line item
    //    Each individual item within a category is tracked in the detail.
    //    Filter out summary/subtotal/rollup categories that double-count real items
    //    (same filter as export-engine.js)
    let sovItemCount = 0;
    const summaryPatterns = /subtotal|summary|recap|rollup|total.*table/i;
    const filteredCategories = (bom.categories || []).filter(cat => {
      // Skip categories whose name matches summary patterns
      if (summaryPatterns.test(cat.name)) return false;
      // Skip categories where ALL item names are just dollar amounts (e.g. "$15,373.52")
      const dollarNameItems = (cat.items || []).filter(i => /^\$[\d,]+\.?\d*$/.test((i.item || i.name || '').trim()));
      if (dollarNameItems.length > 0 && dollarNameItems.length === (cat.items || []).length) return false;
      // Skip categories with $0 scheduled value
      const catValue = cat.subtotal || (cat.items || []).reduce((s, i) => s + (i.extCost || 0), 0);
      if (catValue <= 0) return false;
      return true;
    });
    if (filteredCategories.length > 0) {
      let sortOrder = 0;
      for (const cat of filteredCategories) {
        const itemId = crypto.randomUUID().replace(/-/g, '');
        sortOrder++;
        sovItemCount++;
        const division = guessDivision(cat.name);
        const materialCost = cat.subtotal || (cat.items || []).reduce((s, i) => s + (i.extCost || 0), 0);

        statements.push(
          env.DB.prepare(`
            INSERT INTO sov_items (id, project_id, item_number, description, division, category,
              scheduled_value, material_cost, labor_cost, equipment_cost, sub_cost, sort_order)
            VALUES (?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?)
          `).bind(
            itemId, id,
            `27-${String(sortOrder).padStart(3, '0')}`,
            cat.name,
            division,
            cat.category || cat.name || 'material',
            materialCost,
            materialCost,
            0,
            0,
            0,
            sortOrder,
          )
        );
      }
    } else if (analysis.sections && typeof analysis.sections === 'object' && !Array.isArray(analysis.sections)) {
      // Fallback: Use section titles from the parsed sections object
      let sortOrder = 0;
      for (const [key, section] of Object.entries(analysis.sections)) {
        if (/confidence|methodology|timeline|schedule|rfi|risk|note|assumption|disclaimer|verification|validation|next step/i.test(section.title || key)) continue;
        const itemId = crypto.randomUUID().replace(/-/g, '');
        sortOrder++;
        sovItemCount++;
        let sectionValue = 0;
        const totalMatch = (section.content || '').match(/(?:total|subtotal)[^$]*\$\s*([\d,]+(?:\.\d{1,2})?)/i);
        if (totalMatch) sectionValue = parseFloat(totalMatch[1].replace(/,/g, ''));

        statements.push(
          env.DB.prepare(`
            INSERT INTO sov_items (id, project_id, item_number, description, division, category,
              scheduled_value, material_cost, labor_cost, equipment_cost, sub_cost, sort_order)
            VALUES (?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?)
          `).bind(
            itemId, id,
            `SP-${String(sortOrder).padStart(3, '0')}`,
            section.title || key.replace(/_/g, ' '),
            guessDivision(section.title || key),
            section.category || section.title || key.replace(/_/g, ' ') || 'material',
            sectionValue,
            sectionValue,
            0, 0, 0,
            sortOrder,
          )
        );
      }
    }

    // 3. Import RFIs — SmartPlans exports { id, question, detail, selected }
    if (rfis.items && Array.isArray(rfis.items)) {
      let rfiNum = 0;
      for (const rfi of rfis.items) {
        if (!rfi.selected) continue;
        rfiNum++;
        const rfiId = crypto.randomUUID().replace(/-/g, '');
        // SmartPlans RFI format: question field has the full question text
        // Use a truncated version as the subject, full text as question
        const fullQuestion = rfi.question || rfi.description || '';
        const subject = rfi.subject || rfi.title || (fullQuestion.length > 80 ? fullQuestion.substring(0, 77) + '...' : fullQuestion) || `RFI ${rfiNum}`;
        statements.push(
          env.DB.prepare(`
            INSERT INTO rfis (id, project_id, rfi_number, subject, question, detail,
              discipline, priority, source, smartplans_rfi_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?,
              ?, ?, 'smartplans', ?, ?)
          `).bind(
            rfiId, id, rfiNum,
            subject,
            fullQuestion,
            rfi.detail || rfi.fullText || null,
            rfi.discipline || null,
            rfi.priority || 'normal',
            rfi.id || null,
            data.user.id,
          )
        );
      }
    }

    // 4. Import Infrastructure (MDF/IDF locations) from AI analysis
    // Build location ID map for WBS linking (must generate IDs upfront)
    const infra = pkg.infrastructure || {};
    const locationIdMap = {}; // name → generated ID
    if (infra.locations && Array.isArray(infra.locations) && infra.locations.length > 0) {
      let locSortOrder = 0;
      for (const loc of infra.locations) {
        const locId = crypto.randomUUID().replace(/-/g, '');
        locSortOrder++;
        const locName = loc.name || 'Location ' + locSortOrder;
        locationIdMap[locName] = locId;

        statements.push(
          env.DB.prepare(`
            INSERT INTO locations (id, project_id, name, type, floor, room_number, building, description, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            locId, id,
            locName,
            loc.type || 'idf',
            loc.floor || null,
            loc.room_number || null,
            loc.building || null,
            'AI-imported from SmartPlans analysis',
            locSortOrder,
          )
        );

        // Import equipment items for this location
        if (loc.items && Array.isArray(loc.items)) {
          for (const item of loc.items) {
            const itemId = crypto.randomUUID().replace(/-/g, '');
            const unitCost = item.unit_cost || 0;
            const budgetedQty = item.budgeted_qty || 1;
            const budgetedCost = item.budgeted_cost || (budgetedQty * unitCost);
            statements.push(
              env.DB.prepare(`
                INSERT INTO location_items (id, location_id, project_id, category, item_name, unit,
                  budgeted_qty, budgeted_cost, unit_cost, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned')
              `).bind(
                itemId, locId, id,
                item.category || 'other',
                item.item_name || 'Unknown Item',
                item.unit || 'ea',
                budgetedQty,
                budgetedCost,
                unitCost,
              )
            );
          }
        }

        // Import cable runs for this location
        if (loc.cable_runs && Array.isArray(loc.cable_runs)) {
          for (const run of loc.cable_runs) {
            const runId = crypto.randomUUID().replace(/-/g, '');
            statements.push(
              env.DB.prepare(`
                INSERT INTO cable_runs (id, source_location_id, project_id, cable_type,
                  destination, budgeted_qty, status)
                VALUES (?, ?, ?, ?, ?, ?, 'planned')
              `).bind(
                runId, locId, id,
                run.cable_type || 'cat6a',
                run.destination || locName + ' drops',
                run.budgeted_qty || 0,
              )
            );
          }
        }
      }
    }

    // 5. Import Work Breakdown Structure (WBS)
    const wbs = pkg.workBreakdown || {};
    if (wbs.phases && Array.isArray(wbs.phases) && wbs.phases.length > 0) {
      // Calculate average labor rate for cost estimates
      let avgRate = 45;
      try {
        const rates = pricing.laborRates
          ? (typeof pricing.laborRates === 'string' ? JSON.parse(pricing.laborRates) : pricing.laborRates)
          : null;
        if (rates && typeof rates === 'object') {
          const vals = Object.values(rates).filter(v => typeof v === 'number' && v > 0);
          if (vals.length > 0) avgRate = vals.reduce((s, v) => s + v, 0) / vals.length;
        }
      } catch (e) { /* use default 45 */ }

      // Also use loaded (burdened) rates if available
      if (pricing.loadedRates && typeof pricing.loadedRates === 'object') {
        const loadedVals = Object.values(pricing.loadedRates).filter(v => typeof v === 'number' && v > 0);
        if (loadedVals.length > 0) avgRate = loadedVals.reduce((s, v) => s + v, 0) / loadedVals.length;
      }

      let wbsSortOrder = 0;
      for (const phase of wbs.phases) {
        const phaseId = crypto.randomUUID().replace(/-/g, '');
        wbsSortOrder++;

        const phaseLaborCost = (phase.budgeted_labor_hrs || 0) * avgRate;
        const phaseTotal = (phase.budgeted_material || 0) + phaseLaborCost;

        statements.push(
          env.DB.prepare(`
            INSERT INTO wbs_tasks (id, project_id, parent_id, wbs_code, title, description,
              phase, task_type, sort_order,
              budgeted_material, budgeted_labor_hrs, budgeted_labor_cost, budgeted_total,
              status, source)
            VALUES (?, ?, NULL, ?, ?, ?, ?, 'phase', ?, ?, ?, ?, ?, 'not_started', 'smartplans')
          `).bind(
            phaseId, id,
            phase.code || String(wbsSortOrder),
            phase.name || `Phase ${wbsSortOrder}`,
            phase.description || '',
            phase.phase || '',
            wbsSortOrder,
            phase.budgeted_material || 0,
            phase.budgeted_labor_hrs || 0,
            phaseLaborCost,
            phaseTotal,
          )
        );

        // Location-level tasks under this phase
        if (phase.children && Array.isArray(phase.children)) {
          let locSortIdx = 0;
          for (const locTask of phase.children) {
            const locTaskId = crypto.randomUUID().replace(/-/g, '');
            locSortIdx++;
            wbsSortOrder++;

            const linkedLocId = locTask.location_name ? (locationIdMap[locTask.location_name] || null) : null;
            const locLaborCost = (locTask.budgeted_labor_hrs || 0) * avgRate;
            const locTotal = (locTask.budgeted_material || 0) + locLaborCost;

            statements.push(
              env.DB.prepare(`
                INSERT INTO wbs_tasks (id, project_id, parent_id, location_id, wbs_code, title, description,
                  phase, task_type, sort_order,
                  budgeted_material, budgeted_labor_hrs, budgeted_labor_cost, budgeted_total,
                  status, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'location_task', ?, ?, ?, ?, ?, 'not_started', 'smartplans')
              `).bind(
                locTaskId, id, phaseId, linkedLocId,
                locTask.code || `${phase.code}.${locSortIdx}`,
                locTask.name || `${locTask.location_name || 'Location'} — ${phase.name}`,
                locTask.description || '',
                locTask.phase || phase.phase || '',
                wbsSortOrder,
                locTask.budgeted_material || 0,
                locTask.budgeted_labor_hrs || 0,
                locLaborCost,
                locTotal,
              )
            );

            // Individual tasks under each location-phase
            if (locTask.children && Array.isArray(locTask.children)) {
              let taskSortIdx = 0;
              for (const task of locTask.children) {
                const taskId = crypto.randomUUID().replace(/-/g, '');
                taskSortIdx++;
                wbsSortOrder++;
                const taskLaborCost = (task.budgeted_labor_hrs || 0) * avgRate;
                const taskTotal = (task.budgeted_material || 0) + taskLaborCost;

                statements.push(
                  env.DB.prepare(`
                    INSERT INTO wbs_tasks (id, project_id, parent_id, location_id, wbs_code, title,
                      phase, task_type, sort_order,
                      budgeted_material, budgeted_labor_hrs, budgeted_labor_cost, budgeted_total,
                      status, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'task', ?, ?, ?, ?, ?, 'not_started', 'smartplans')
                  `).bind(
                    taskId, id, locTaskId, linkedLocId,
                    task.code || `${locTask.code}.${taskSortIdx}`,
                    task.name || `Task ${taskSortIdx}`,
                    task.phase || locTask.phase || '',
                    wbsSortOrder,
                    task.budgeted_material || 0,
                    task.budgeted_labor_hrs || 0,
                    taskLaborCost,
                    taskTotal,
                  )
                );
              }
            }
          }
        }
      }
    }

    // 6. Activity log
    const infraCount = (infra.locations || []).length;
    const wbsCount = (wbs.phases || []).length;
    const rfiCount = (rfis.items || []).filter(r => r.selected).length;
    statements.push(
      env.DB.prepare(
        `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
         VALUES (?, ?, 'import', 'project', ?, ?)`
      ).bind(id, data.user.id, id,
        `Imported from SmartPlans: ${project.name || 'Project'} — $${contractValue.toFixed(2)} contract, ${sovItemCount} SOV items, ${infraCount} infrastructure locations, ${wbsCount} WBS phases, ${rfiCount} RFIs`
      )
    );

    // ── EXECUTE ALL STATEMENTS ATOMICALLY ──
    // D1 batch() ensures all-or-nothing: if any statement fails, none are committed
    await env.DB.batch(statements);

    const fmt = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return Response.json({
      id,
      success: true,
      projectName: project.name,
      stats: {
        contractValue,
        sovItems: sovItemCount,
        infrastructure: infraCount,
        wbsPhases: wbsCount,
        rfis: rfiCount,
      },
      summary: `Imported "${project.name}" — ${fmt(contractValue)} contract value, ${sovItemCount} SOV items, ${infraCount} infrastructure locations, ${wbsCount} WBS phases, ${rfiCount} RFIs`,
    }, { status: 201 });
  } catch (err) {
    console.error('Import error:', err);
    return Response.json({ error: 'IMPORT_FAILED', message: 'Import failed. Please check the file format and try again.' }, { status: 500 });
  }
}
