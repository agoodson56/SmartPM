// ═══════════════════════════════════════════════════════════════
// POST /api/projects/import — Import SmartPlans JSON export
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

    // Create project
    await env.DB.prepare(`
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
    ).run();

    // Import SOV line items from analysis sections
    if (analysis.sections && Array.isArray(analysis.sections)) {
      let sortOrder = 0;
      for (const section of analysis.sections) {
        const itemId = crypto.randomUUID().replace(/-/g, '');
        sortOrder++;
        await env.DB.prepare(`
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
        ).run();
      }
    }

    // Import RFIs
    if (rfis.items && Array.isArray(rfis.items)) {
      let rfiNum = 0;
      for (const rfi of rfis.items) {
        if (!rfi.selected) continue;
        rfiNum++;
        const rfiId = crypto.randomUUID().replace(/-/g, '');
        await env.DB.prepare(`
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
        ).run();
      }
    }

    // ═══════════════════════════════════════════════════════════
    // Import Infrastructure (MDF/IDF locations) from AI analysis
    // These are AI-calculated budgets — LOCKED from field manipulation
    // PMs can only update installed/actual values, not budgets
    // ═══════════════════════════════════════════════════════════
    const infra = pkg.infrastructure || {};
    if (infra.locations && Array.isArray(infra.locations) && infra.locations.length > 0) {
      let locSortOrder = 0;
      for (const loc of infra.locations) {
        const locId = crypto.randomUUID().replace(/-/g, '');
        locSortOrder++;
        await env.DB.prepare(`
                    INSERT INTO locations (id, project_id, name, type, floor, room_number, description, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
          locId, id,
          loc.name || 'Location ' + locSortOrder,
          loc.type || 'idf',
          loc.floor || null,
          loc.room_number || null,
          'AI-imported from SmartPlans analysis',
          locSortOrder,
        ).run();

        // Import equipment items with AI-set budgets
        if (loc.items && Array.isArray(loc.items)) {
          for (const item of loc.items) {
            const itemId = crypto.randomUUID().replace(/-/g, '');
            const budgetedCost = item.budgeted_cost || ((item.budgeted_qty || 0) * (item.unit_cost || 0));
            await env.DB.prepare(`
                            INSERT INTO location_items (id, location_id, project_id, category, item_name,
                                budgeted_qty, budgeted_cost, unit_cost, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'planned')
                        `).bind(
              itemId, locId, id,
              item.category || 'other',
              item.item_name || 'Unknown Item',
              item.budgeted_qty || 1,
              budgetedCost,
              item.unit_cost || 0,
            ).run();
          }
        }

        // Import cable runs with AI-set budgets
        if (loc.cable_runs && Array.isArray(loc.cable_runs)) {
          for (const run of loc.cable_runs) {
            const runId = crypto.randomUUID().replace(/-/g, '');
            await env.DB.prepare(`
                            INSERT INTO cable_runs (id, source_location_id, project_id, cable_type,
                                destination, budgeted_qty, status)
                            VALUES (?, ?, ?, ?, ?, ?, 'planned')
                        `).bind(
              runId, locId, id,
              run.cable_type || 'cat6a',
              run.destination || loc.name + ' drops',
              run.budgeted_qty || 0,
            ).run();
          }
        }
      }
    }

    // Log activity
    await env.DB.prepare(
      `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'import', 'project', ?, ?)`
    ).bind(id, data.user.id, id, `Imported from SmartPlans: ${project.name || 'Project'}`).run();

    return Response.json({ id, success: true }, { status: 201 });
  } catch (err) {
    console.error('Import error:', err);
    return Response.json({ error: 'Failed to import SmartPlans data: ' + err.message }, { status: 500 });
  }
}
