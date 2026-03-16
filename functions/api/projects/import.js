// ═══════════════════════════════════════════════════════════════
// POST /api/projects/import — Import SmartPlans JSON export
// Uses D1 batch() for atomic execution — all or nothing.
// ═══════════════════════════════════════════════════════════════

export async function onRequestPost(context) {
  const { env, request, data } = context;

  try {
    const pkg = await request.json();

    // Validate SmartPlans format
    if (!pkg._meta || pkg._meta.format !== 'smartplans-export') {
      return Response.json({ error: 'Invalid SmartPlans export format' }, { status: 400 });
    }

    const project = pkg.project || {};
    const pricing = pkg.pricingConfig || {};
    const analysis = pkg.analysis || {};
    const rfis = pkg.rfis || {};
    const id = crypto.randomUUID().replace(/-/g, '');
    const importId = pkg._meta.generatedAt || new Date().toISOString();

    // Calculate contract value from analysis totals
    const totals = analysis.totals || {};
    const contractValue = totals.grandTotal || totals.totalWithMarkup || 0;

    // ── Collect ALL statements into a batch for atomic execution ──
    const statements = [];

    // 1. Create project
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
        pricing.regionMultiplier || 'national_average',
        pricing.prevailingWage || '',
        pricing.workShift || '',
        pricing.markup?.material || 25,
        pricing.markup?.labor || 30,
        pricing.markup?.equipment || 15,
        pricing.markup?.subcontractor || 10,
        pricing.laborRates ? JSON.stringify(pricing.laborRates) : null,
        pricing.burdenRate || 35,
        pricing.includeBurden !== undefined ? (pricing.includeBurden ? 1 : 0) : 1,
        `Imported from SmartPlans on ${new Date().toLocaleDateString()}`,
        importId,
        data.user.id,
      )
    );

    // 2. Import SOV line items from analysis sections
    if (analysis.sections && Array.isArray(analysis.sections)) {
      let sortOrder = 0;
      for (const section of analysis.sections) {
        const itemId = crypto.randomUUID().replace(/-/g, '');
        sortOrder++;
        statements.push(
          env.DB.prepare(`
            INSERT INTO sov_items (id, project_id, item_number, description, division, category,
              scheduled_value, material_cost, labor_cost, equipment_cost, sub_cost, sort_order)
            VALUES (?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?)
          `).bind(
            itemId, id,
            section.itemNumber || `SP-${String(sortOrder).padStart(3, '0')}`,
            section.description || section.name || 'Imported line item',
            section.division || null,
            section.category || 'material',
            section.totalValue || section.scheduledValue || 0,
            section.materialCost || 0,
            section.laborCost || 0,
            section.equipmentCost || 0,
            section.subCost || 0,
            sortOrder,
          )
        );
      }
    }

    // 3. Import RFIs
    if (rfis.items && Array.isArray(rfis.items)) {
      let rfiNum = 0;
      for (const rfi of rfis.items) {
        if (!rfi.selected) continue;
        rfiNum++;
        const rfiId = crypto.randomUUID().replace(/-/g, '');
        statements.push(
          env.DB.prepare(`
            INSERT INTO rfis (id, project_id, rfi_number, subject, question, detail,
              discipline, priority, source, smartplans_rfi_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?,
              ?, ?, 'smartplans', ?, ?)
          `).bind(
            rfiId, id, rfiNum,
            rfi.subject || rfi.title || `RFI ${rfiNum}`,
            rfi.question || rfi.description || '',
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

        // Import equipment items
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

        // Import cable runs
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
      const avgRate = pricing.laborRates
        ? Object.values(typeof pricing.laborRates === 'string' ? JSON.parse(pricing.laborRates) : pricing.laborRates).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0) / Math.max(Object.keys(typeof pricing.laborRates === 'string' ? JSON.parse(pricing.laborRates) : pricing.laborRates).length, 1)
        : 45;

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
    statements.push(
      env.DB.prepare(
        `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
         VALUES (?, ?, 'import', 'project', ?, ?)`
      ).bind(id, data.user.id, id, `Imported from SmartPlans: ${project.name || 'Project'}`)
    );

    // ── EXECUTE ALL STATEMENTS ATOMICALLY ──
    // D1 batch() ensures all-or-nothing: if any statement fails, none are committed
    await env.DB.batch(statements);

    return Response.json({ id, success: true }, { status: 201 });
  } catch (err) {
    console.error('Import error:', err);
    return Response.json({ error: 'Failed to import SmartPlans data: ' + err.message }, { status: 500 });
  }
}
