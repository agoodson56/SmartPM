// ═══════════════════════════════════════════════════════════════
// POST /api/projects/:id/reimport — Update project from revised SmartPlans export
// Preserves manually-created data, replaces SmartPlans-sourced data.
//
// This duplicates the BOM/infrastructure/WBS/RFI parsing logic from import.js
// because Cloudflare Pages Functions cannot easily share modules between
// route files. Keep in sync with import.js if parsing logic changes.
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

    const h2Match = line.match(/^#{1,3}\s+(.+)/);
    const boldMatch = !h2Match && line.match(/^\*\*([^*]{3,80})\*\*\s*$/);
    const heading = h2Match ? h2Match[1].replace(/\*+/g, '').trim() : (boldMatch ? boldMatch[1].trim() : null);

    if (heading) {
      const isCategory = /material|cost|pricing|equipment|cabling|cctv|camera|access|fire|alarm|intrusion|audio|visual|av\b|structured|backbone|infrastructure|mdf|idf|misc|general|conduit|pathway|rack|panel|device|breakdown|bill|bom/i.test(heading);
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
      if (val > 100) return val;
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
  const { env, request, data, params } = context;
  const projectId = params.id;

  try {
    // ── Validate project exists ──
    const project = await env.DB.prepare(
      'SELECT id, name, smartplans_import_id FROM projects WHERE id = ?'
    ).bind(projectId).first();

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const pkg = await request.json();

    // ── Validate SmartPlans format ──
    if (!pkg._meta || pkg._meta.format !== 'smartplans-export') {
      return Response.json({ error: 'Invalid SmartPlans export format' }, { status: 400 });
    }

    const pricing = pkg.pricingConfig || {};
    const analysis = pkg.analysis || {};
    const rfis = pkg.rfis || {};
    const userInputs = pkg.userInputs || {};
    const importId = pkg._meta.generatedAt || new Date().toISOString();

    // ── Extract contract value and SOV data ──
    const rawMarkdown = analysis.rawMarkdown || '';
    const financials = pkg.financials || null;
    let bom;
    let contractValue = 0;

    if (financials && financials.grandTotal > 0 && financials.categories && financials.categories.length > 0) {
      bom = financials;
      contractValue = financials.grandTotal;
    } else {
      bom = extractBOMFromMarkdown(rawMarkdown);
      contractValue = extractGrandTotal(rawMarkdown);
      if (contractValue === 0 && bom.grandTotal > 0) {
        contractValue = bom.grandTotal;
      }
    }

    if (contractValue > 0 && rawMarkdown) {
      const aiTotal = extractGrandTotal(rawMarkdown);
      if (aiTotal > 0 && aiTotal < contractValue * 0.95) {
        contractValue = aiTotal;
      }
    }

    if (contractValue === 0) {
      const infraCheck = pkg.infrastructure || {};
      if (infraCheck.locations && Array.isArray(infraCheck.locations)) {
        contractValue = infraCheck.locations.reduce((sum, loc) => {
          return sum + (loc.items || []).reduce((s, i) => s + (i.budgeted_cost || 0), 0);
        }, 0);
      }
    }

    // ── Collect ALL statements into a batch for atomic execution ──
    const statements = [];

    // ── Count existing manually-created items (for change summary) ──
    const existingCounts = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as cnt FROM sov_items WHERE project_id = ? AND category = ?').bind(projectId, 'material').first(),
      env.DB.prepare("SELECT COUNT(*) as cnt FROM rfis WHERE project_id = ? AND source = 'smartplans'").bind(projectId).first(),
      env.DB.prepare("SELECT COUNT(*) as cnt FROM wbs_tasks WHERE project_id = ? AND source = 'smartplans'").bind(projectId).first(),
      env.DB.prepare('SELECT COUNT(*) as cnt FROM locations WHERE project_id = ?').bind(projectId).first(),
    ]);
    const oldSovCount = existingCounts[0]?.cnt || 0;
    const oldRfiCount = existingCounts[1]?.cnt || 0;
    const oldWbsCount = existingCounts[2]?.cnt || 0;
    const oldInfraCount = existingCounts[3]?.cnt || 0;

    // ── 1. Update project metadata ──
    statements.push(
      env.DB.prepare(`
        UPDATE projects SET
          original_contract_value = ?,
          current_contract_value = ?,
          pricing_tier = ?,
          regional_multiplier = ?,
          prevailing_wage = ?,
          work_shift = ?,
          markup_material = ?,
          markup_labor = ?,
          markup_equipment = ?,
          markup_subcontractor = ?,
          labor_rates = ?,
          burden_rate = ?,
          include_burden = ?,
          notes = ?,
          smartplans_import_id = ?
        WHERE id = ?
      `).bind(
        contractValue,
        contractValue,
        pricing.tier || 'mid',
        pricing.regionalMultiplier || 'national_average',
        pkg.project?.prevailingWage || pricing.prevailingWage || '',
        pkg.project?.workShift || pricing.workShift || '',
        pricing.markup?.material || 25,
        pricing.markup?.labor || 30,
        pricing.markup?.equipment || 15,
        pricing.markup?.subcontractor || 10,
        pricing.laborRates ? JSON.stringify(pricing.laborRates) : null,
        pricing.burdenRate || 35,
        pricing.includeBurden !== undefined ? (pricing.includeBurden ? 1 : 0) : 1,
        `Re-imported from SmartPlans on ${new Date().toLocaleDateString()}. ${userInputs.notes || ''}`.trim(),
        importId,
        projectId,
      )
    );

    // ── 2. Delete SmartPlans-sourced data (preserve manually created items) ──
    // SOV material items created from BOM categories
    statements.push(
      env.DB.prepare('DELETE FROM sov_items WHERE project_id = ? AND category = ?').bind(projectId, 'material')
    );
    // RFIs sourced from SmartPlans
    statements.push(
      env.DB.prepare("DELETE FROM rfis WHERE project_id = ? AND source = 'smartplans'").bind(projectId)
    );
    // WBS tasks sourced from SmartPlans
    statements.push(
      env.DB.prepare("DELETE FROM wbs_tasks WHERE project_id = ? AND source = 'smartplans'").bind(projectId)
    );
    // Infrastructure: location_items, cable_runs, then locations
    statements.push(
      env.DB.prepare('DELETE FROM location_items WHERE project_id = ?').bind(projectId)
    );
    statements.push(
      env.DB.prepare('DELETE FROM cable_runs WHERE project_id = ?').bind(projectId)
    );
    statements.push(
      env.DB.prepare('DELETE FROM locations WHERE project_id = ?').bind(projectId)
    );

    // ── 3. Re-create SOV line items from new export ──
    let sovItemCount = 0;
    if (bom.categories && bom.categories.length > 0) {
      let sortOrder = 0;
      for (const cat of bom.categories) {
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
            itemId, projectId,
            `27-${String(sortOrder).padStart(3, '0')}`,
            cat.name,
            division,
            'material',
            materialCost,
            materialCost,
            0, 0, 0,
            sortOrder,
          )
        );
      }
    } else if (analysis.sections && typeof analysis.sections === 'object' && !Array.isArray(analysis.sections)) {
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
            itemId, projectId,
            `SP-${String(sortOrder).padStart(3, '0')}`,
            section.title || key.replace(/_/g, ' '),
            guessDivision(section.title || key),
            'material',
            sectionValue,
            sectionValue,
            0, 0, 0,
            sortOrder,
          )
        );
      }
    }

    // ── 4. Re-create RFIs ──
    let rfiCount = 0;
    if (rfis.items && Array.isArray(rfis.items)) {
      let rfiNum = 0;
      for (const rfi of rfis.items) {
        if (!rfi.selected) continue;
        rfiNum++;
        rfiCount++;
        const rfiId = crypto.randomUUID().replace(/-/g, '');
        const fullQuestion = rfi.question || rfi.description || '';
        const subject = rfi.subject || rfi.title || (fullQuestion.length > 80 ? fullQuestion.substring(0, 77) + '...' : fullQuestion) || `RFI ${rfiNum}`;
        statements.push(
          env.DB.prepare(`
            INSERT INTO rfis (id, project_id, rfi_number, subject, question, detail,
              discipline, priority, source, smartplans_rfi_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?,
              ?, ?, 'smartplans', ?, ?)
          `).bind(
            rfiId, projectId, rfiNum,
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

    // ── 5. Re-create Infrastructure (MDF/IDF locations) ──
    const infra = pkg.infrastructure || {};
    const locationIdMap = {};
    let infraCount = 0;
    if (infra.locations && Array.isArray(infra.locations) && infra.locations.length > 0) {
      let locSortOrder = 0;
      for (const loc of infra.locations) {
        const locId = crypto.randomUUID().replace(/-/g, '');
        locSortOrder++;
        infraCount++;
        const locName = loc.name || 'Location ' + locSortOrder;
        locationIdMap[locName] = locId;

        statements.push(
          env.DB.prepare(`
            INSERT INTO locations (id, project_id, name, type, floor, room_number, building, description, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            locId, projectId,
            locName,
            loc.type || 'idf',
            loc.floor || null,
            loc.room_number || null,
            loc.building || null,
            'AI-imported from SmartPlans analysis',
            locSortOrder,
          )
        );

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
                itemId, locId, projectId,
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

        if (loc.cable_runs && Array.isArray(loc.cable_runs)) {
          for (const run of loc.cable_runs) {
            const runId = crypto.randomUUID().replace(/-/g, '');
            statements.push(
              env.DB.prepare(`
                INSERT INTO cable_runs (id, source_location_id, project_id, cable_type,
                  destination, budgeted_qty, status)
                VALUES (?, ?, ?, ?, ?, ?, 'planned')
              `).bind(
                runId, locId, projectId,
                run.cable_type || 'cat6a',
                run.destination || locName + ' drops',
                run.budgeted_qty || 0,
              )
            );
          }
        }
      }
    }

    // ── 6. Re-create Work Breakdown Structure (WBS) ──
    const wbs = pkg.workBreakdown || {};
    let wbsPhaseCount = 0;
    if (wbs.phases && Array.isArray(wbs.phases) && wbs.phases.length > 0) {
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

      if (pricing.loadedRates && typeof pricing.loadedRates === 'object') {
        const loadedVals = Object.values(pricing.loadedRates).filter(v => typeof v === 'number' && v > 0);
        if (loadedVals.length > 0) avgRate = loadedVals.reduce((s, v) => s + v, 0) / loadedVals.length;
      }

      let wbsSortOrder = 0;
      for (const phase of wbs.phases) {
        const phaseId = crypto.randomUUID().replace(/-/g, '');
        wbsSortOrder++;
        wbsPhaseCount++;

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
            phaseId, projectId,
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
                locTaskId, projectId, phaseId, linkedLocId,
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
                    taskId, projectId, locTaskId, linkedLocId,
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

    // ── 7. Activity log ──
    statements.push(
      env.DB.prepare(
        `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
         VALUES (?, ?, 'reimport', 'project', ?, ?)`
      ).bind(projectId, data.user.id, projectId,
        `Re-imported from SmartPlans: ${project.name} — $${contractValue.toFixed(2)} contract, ${sovItemCount} SOV items (was ${oldSovCount}), ${infraCount} infrastructure locations (was ${oldInfraCount}), ${wbsPhaseCount} WBS phases (was ${oldWbsCount}), ${rfiCount} RFIs (was ${oldRfiCount})`
      )
    );

    // ── EXECUTE ALL STATEMENTS ATOMICALLY ──
    await env.DB.batch(statements);

    return Response.json({
      success: true,
      message: 'Project updated from SmartPlans export',
      projectId,
      stats: {
        contractValue,
        sovItems: sovItemCount,
        infrastructure: infraCount,
        wbsPhases: wbsPhaseCount,
        rfis: rfiCount,
      },
      previous: {
        sovItems: oldSovCount,
        infrastructure: oldInfraCount,
        wbsTasks: oldWbsCount,
        rfis: oldRfiCount,
      },
    });
  } catch (err) {
    console.error('Re-import error:', err);
    return Response.json({ error: 'Re-import failed: ' + err.message }, { status: 500 });
  }
}
