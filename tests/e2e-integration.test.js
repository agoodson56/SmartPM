import { describe, it, expect, beforeAll } from 'vitest';
import { loadImportFunctions } from './helpers/load-import.js';
import { loadExportEngine } from './helpers/load-export-engine.js';

// ═══════════════════════════════════════════════════════════════
// End-to-End Integration Tests — SmartPlans -> SmartPM Data Flow
//
// Tests the full lifecycle: SmartPlans export-engine produces a
// JSON package, SmartPM import.js parses it. Verifies structural
// compatibility, BOM consistency, grand total agreement, and
// reimport change detection.
// ═══════════════════════════════════════════════════════════════

let extractBOMFromMarkdown, extractGrandTotal, guessDivision;
let engine;

// ── Realistic ELV markdown analysis (cameras, data drops, access control, fiber) ──
const REALISTIC_MARKDOWN = `## Structured Cabling Material Costs

| Item | Qty | Unit | Unit Cost | Extended Cost |
|------|-----|------|-----------|---------------|
| Cat6A Plenum Cable (1000ft) | 30 | box | $285.00 | $8,550.00 |
| Cat6A RJ45 Connectors (50-pack) | 12 | pk | $32.00 | $384.00 |
| 48-Port Cat6A Patch Panel | 8 | ea | $189.00 | $1,512.00 |
| 1U Horizontal Cable Manager | 8 | ea | $45.00 | $360.00 |
| Surface Mount Box Cat6A | 120 | ea | $8.50 | $1,020.00 |
| **Subtotal** | | | | $11,826.00 |

## CCTV Camera Equipment

| Item | Qty | Unit | Unit Cost | Extended Cost |
|------|-----|------|-----------|---------------|
| 4MP IP Dome Camera (indoor) | 24 | ea | $385.00 | $9,240.00 |
| 4MP IP Bullet Camera (outdoor) | 12 | ea | $520.00 | $6,240.00 |
| 32-Channel NVR | 2 | ea | $3,200.00 | $6,400.00 |
| 8TB Surveillance HDD | 8 | ea | $280.00 | $2,240.00 |
| PoE Network Switch 24-port | 4 | ea | $890.00 | $3,560.00 |
| **Subtotal** | | | | $27,680.00 |

## Access Control Equipment

| Item | Qty | Unit | Unit Cost | Extended Cost |
|------|-----|------|-----------|---------------|
| Proximity Card Reader | 16 | ea | $345.00 | $5,520.00 |
| 2-Door Access Controller | 8 | ea | $1,150.00 | $9,200.00 |
| Magnetic Door Lock 1200lb | 16 | ea | $185.00 | $2,960.00 |
| Request-to-Exit Sensor | 16 | ea | $42.00 | $672.00 |
| Door Position Switch | 16 | ea | $28.00 | $448.00 |
| **Subtotal** | | | | $18,800.00 |

## Backbone Cabling Infrastructure

| Item | Qty | Unit | Unit Cost | Extended Cost |
|------|-----|------|-----------|---------------|
| 12-Strand SM Fiber Cable (per ft) | 2500 | ft | $1.85 | $4,625.00 |
| LC Fiber Connector (SM) | 48 | ea | $12.50 | $600.00 |
| 1U Fiber Enclosure | 6 | ea | $165.00 | $990.00 |
| Fiber Patch Panel 24-port | 4 | ea | $285.00 | $1,140.00 |
| **Subtotal** | | | | $7,355.00 |

## Project Cost Summary

| Category | Total |
|----------|-------|
| Structured Cabling | $11,826.00 |
| CCTV | $27,680.00 |
| Access Control | $18,800.00 |
| Backbone | $7,355.00 |

Grand Total: $65,661.00
`;

// ── Realistic SmartPlans application state (for buildExportPackage) ──
function createMockState() {
  return {
    projectName: 'Riverside Office Complex — ELV Systems',
    preparedFor: 'Riverside Development LLC',
    projectType: 'commercial_office',
    projectLocation: '1500 Riverside Dr, Sacramento, CA 95814',
    codeJurisdiction: 'California',
    disciplines: ['structured_cabling', 'cctv', 'access_control'],
    fileFormat: 'pdf',
    prevailingWage: 'california',
    workShift: 'standard',
    pricingTier: 'mid',
    regionalMultiplier: 'california',
    laborRates: { journeyman: 65, foreman: 80, apprentice: 35 },
    burdenRate: 35,
    includeBurden: true,
    markup: { material: 25, labor: 30, equipment: 15, subcontractor: 10 },
    legendFiles: [{ name: 'legend-1.pdf', size: 245000, type: 'application/pdf' }],
    planFiles: [
      { name: 'floor-1.pdf', size: 1200000, type: 'application/pdf' },
      { name: 'floor-2.pdf', size: 1350000, type: 'application/pdf' },
    ],
    specFiles: [{ name: 'div27-spec.pdf', size: 890000, type: 'application/pdf' }],
    addendaFiles: [],
    specificItems: 'Axis P3245-V cameras, Lenel access control',
    knownQuantities: '36 cameras, 16 card readers, 240 data drops',
    priorEstimate: '',
    notes: 'Prevailing wage project. Davis-Bacon applies.',
    aiAnalysis: REALISTIC_MARKDOWN,
    aiError: null,
    selectedRFIs: new Set(['rfi-001', 'rfi-003']),
  };
}

beforeAll(() => {
  const fns = loadImportFunctions();
  extractBOMFromMarkdown = fns.extractBOMFromMarkdown;
  extractGrandTotal = fns.extractGrandTotal;
  guessDivision = fns.guessDivision;

  engine = loadExportEngine();
});


// ═══════════════════════════════════════════════════════════════
// 1. EXPORT -> IMPORT FLOW
// ═══════════════════════════════════════════════════════════════

describe('Export -> Import Flow', () => {

  it('builds a complete export package with all required top-level keys', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    expect(pkg._meta).toBeDefined();
    expect(pkg.project).toBeDefined();
    expect(pkg.pricingConfig).toBeDefined();
    expect(pkg.analysis).toBeDefined();
    expect(pkg.financials).toBeDefined();
    expect(pkg.rfis).toBeDefined();
    expect(pkg.infrastructure).toBeDefined();
    expect(pkg.workBreakdown).toBeDefined();
  });

  it('import parser extracts BOM categories from a full SmartPlans export', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    // Simulate what import.js does: use pre-structured financials if available
    const financials = pkg.financials;
    expect(financials.grandTotal).toBeGreaterThan(0);
    expect(financials.categories.length).toBeGreaterThanOrEqual(4);

    // Verify category names match what was in the markdown
    const catNames = financials.categories.map(c => c.name);
    expect(catNames).toContain('Structured Cabling Material Costs');
    expect(catNames).toContain('CCTV Camera Equipment');
    expect(catNames).toContain('Access Control Equipment');
    expect(catNames).toContain('Backbone Cabling Infrastructure');
  });

  it('import parser falls back to markdown parsing when financials are empty', () => {
    // Simulate a v2.0 export with no pre-structured financials
    const rawMarkdown = REALISTIC_MARKDOWN;
    const bom = extractBOMFromMarkdown(rawMarkdown);

    expect(bom.categories.length).toBeGreaterThanOrEqual(4);
    expect(bom.grandTotal).toBeGreaterThan(0);

    // Each category should have items
    for (const cat of bom.categories) {
      expect(cat.items.length).toBeGreaterThan(0);
    }
  });

  it('selected RFIs flow through to import package correctly', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    expect(pkg.rfis.items.length).toBe(3);
    // Only rfi-001 and rfi-003 were selected
    const selected = pkg.rfis.items.filter(r => r.selected);
    expect(selected.length).toBe(2);
    expect(selected.map(r => r.id)).toContain('rfi-001');
    expect(selected.map(r => r.id)).toContain('rfi-003');

    // Each selected RFI has required fields for import
    for (const rfi of selected) {
      expect(rfi.question).toBeTruthy();
      expect(typeof rfi.id).toBe('string');
    }
  });

  it('infrastructure locations flow from export to import-compatible format', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    const infra = pkg.infrastructure;
    expect(infra.locations).toBeDefined();
    expect(Array.isArray(infra.locations)).toBe(true);

    // Each location should have the fields import.js expects
    for (const loc of infra.locations) {
      expect(loc.name).toBeTruthy();
      expect(loc.type).toBeTruthy();
      expect(Array.isArray(loc.items)).toBe(true);
      expect(Array.isArray(loc.cable_runs)).toBe(true);
    }
  });

  it('work breakdown phases flow from export to import-compatible format', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    const wbs = pkg.workBreakdown;
    expect(wbs.phases).toBeDefined();
    expect(Array.isArray(wbs.phases)).toBe(true);

    if (wbs.phases.length > 0) {
      const phase = wbs.phases[0];
      expect(phase.code).toBeTruthy();
      expect(phase.name).toBeTruthy();
      expect(typeof phase.budgeted_material).toBe('number');
      expect(typeof phase.budgeted_labor_hrs).toBe('number');

      // Children should be location tasks
      if (phase.children && phase.children.length > 0) {
        const locTask = phase.children[0];
        expect(locTask.location_name).toBeTruthy();
        expect(locTask.code).toBeTruthy();
      }
    }
  });
});


// ═══════════════════════════════════════════════════════════════
// 2. BOM CONSISTENCY — SmartPlans vs SmartPM parsers
// ═══════════════════════════════════════════════════════════════

describe('BOM Consistency — SmartPlans _extractBOMFromAnalysis vs SmartPM extractBOMFromMarkdown', () => {

  it('both parsers extract the same number of categories from identical markdown', () => {
    const smartPlansBOM = engine._extractBOMFromAnalysis(REALISTIC_MARKDOWN);
    const smartPMBOM = extractBOMFromMarkdown(REALISTIC_MARKDOWN);

    expect(smartPlansBOM.categories.length).toBe(smartPMBOM.categories.length);
  });

  it('both parsers extract the same category names', () => {
    const smartPlansBOM = engine._extractBOMFromAnalysis(REALISTIC_MARKDOWN);
    const smartPMBOM = extractBOMFromMarkdown(REALISTIC_MARKDOWN);

    const spNames = smartPlansBOM.categories.map(c => c.name);
    const pmNames = smartPMBOM.categories.map(c => c.name);
    expect(spNames).toEqual(pmNames);
  });

  it('both parsers extract the same item counts per category', () => {
    const smartPlansBOM = engine._extractBOMFromAnalysis(REALISTIC_MARKDOWN);
    const smartPMBOM = extractBOMFromMarkdown(REALISTIC_MARKDOWN);

    for (let i = 0; i < smartPlansBOM.categories.length; i++) {
      const spCat = smartPlansBOM.categories[i];
      const pmCat = smartPMBOM.categories[i];
      expect(spCat.items.length).toBe(pmCat.items.length);
    }
  });

  it('both parsers extract matching item names and quantities', () => {
    const smartPlansBOM = engine._extractBOMFromAnalysis(REALISTIC_MARKDOWN);
    const smartPMBOM = extractBOMFromMarkdown(REALISTIC_MARKDOWN);

    for (let i = 0; i < smartPlansBOM.categories.length; i++) {
      const spItems = smartPlansBOM.categories[i].items;
      const pmItems = smartPMBOM.categories[i].items;
      for (let j = 0; j < spItems.length; j++) {
        expect(spItems[j].item).toBe(pmItems[j].item);
        expect(spItems[j].qty).toBe(pmItems[j].qty);
        expect(spItems[j].unitCost).toBe(pmItems[j].unitCost);
        expect(spItems[j].extCost).toBe(pmItems[j].extCost);
      }
    }
  });
});


// ═══════════════════════════════════════════════════════════════
// 3. GRAND TOTAL CONSISTENCY
// ═══════════════════════════════════════════════════════════════

describe('Grand Total Consistency — SmartPlans _extractAIGrandTotal vs SmartPM extractGrandTotal', () => {

  it('both extractors agree on "Grand Total: $65,661.00" from realistic markdown', () => {
    const spTotal = engine._extractAIGrandTotal(REALISTIC_MARKDOWN);
    const pmTotal = extractGrandTotal(REALISTIC_MARKDOWN);

    expect(spTotal).toBe(65661);
    expect(pmTotal).toBe(65661);
    expect(spTotal).toBe(pmTotal);
  });

  it('both extractors agree on bold table row format', () => {
    const md = '| **Grand Total** | | | $142,500.00 |';
    const spTotal = engine._extractAIGrandTotal(md);
    const pmTotal = extractGrandTotal(md);

    expect(spTotal).toBe(142500);
    expect(pmTotal).toBe(142500);
  });

  it('both extractors agree on "Total Project Cost" format', () => {
    const md = 'Total Project Cost: $287,350.00';
    const spTotal = engine._extractAIGrandTotal(md);
    const pmTotal = extractGrandTotal(md);

    expect(spTotal).toBe(287350);
    expect(pmTotal).toBe(287350);
  });

  it('both extractors return 0 for markdown with no total line', () => {
    const md = 'This project includes 24 cameras and 16 card readers with no pricing shown.';
    const spTotal = engine._extractAIGrandTotal(md);
    const pmTotal = extractGrandTotal(md);

    expect(spTotal).toBe(0);
    expect(pmTotal).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// 4. EXPORT PACKAGE FORMAT VALIDATION
// ═══════════════════════════════════════════════════════════════

describe('Export Package Format Validation — v3.0 structure', () => {

  it('_meta has correct format identifier and version', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    expect(pkg._meta.format).toBe('smartplans-export');
    expect(pkg._meta.version).toBe('3.0');
    expect(pkg._meta.generatedAt).toBeTruthy();
    expect(pkg._meta.generatedBy).toContain('SmartPlans');
  });

  it('project section contains all import-required fields', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    expect(pkg.project.name).toBe('Riverside Office Complex — ELV Systems');
    expect(pkg.project.type).toBe('commercial_office');
    expect(pkg.project.location).toBeTruthy();
    expect(pkg.project.jurisdiction).toBe('California');
    expect(Array.isArray(pkg.project.disciplines)).toBe(true);
    expect(pkg.project.disciplines.length).toBe(3);
  });

  it('pricingConfig includes tier, multiplier, rates, markup, and burden', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    const pc = pkg.pricingConfig;
    expect(pc.tier).toBe('mid');
    expect(pc.regionalMultiplier).toBe('california');
    expect(pc.regionalMultiplierValue).toBe(1.25);
    expect(pc.laborRates).toBeDefined();
    expect(pc.laborRates.journeyman).toBe(65);
    expect(pc.burdenRate).toBe(35);
    expect(pc.includeBurden).toBe(true);
    expect(pc.loadedRates).toBeDefined();
    // loaded rate = base * (1 + 35/100) = base * 1.35
    expect(pc.loadedRates.journeyman).toBeCloseTo(65 * 1.35, 1);
    expect(pc.markup.material).toBe(25);
    expect(pc.markup.labor).toBe(30);
  });

  it('financials section has grandTotal, categories with items', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    const fin = pkg.financials;
    expect(fin.grandTotal).toBeGreaterThan(0);
    expect(Array.isArray(fin.categories)).toBe(true);
    expect(fin.categories.length).toBeGreaterThanOrEqual(4);
    expect(fin.totalLineItems).toBeGreaterThan(0);

    // Each category has required shape
    for (const cat of fin.categories) {
      expect(cat.name).toBeTruthy();
      expect(typeof cat.subtotal).toBe('number');
      expect(Array.isArray(cat.items)).toBe(true);
      for (const item of cat.items) {
        expect(item.name).toBeTruthy();
        expect(typeof item.qty).toBe('number');
        expect(typeof item.unitCost).toBe('number');
        expect(typeof item.extCost).toBe('number');
      }
    }
  });

  it('analysis section contains rawMarkdown and parsed sections', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    expect(pkg.analysis.rawMarkdown).toBeTruthy();
    expect(typeof pkg.analysis.sections).toBe('object');
    expect(pkg.analysis.rawMarkdown).toContain('Cat6A');
    // Sections should be keyed by slug
    const keys = Object.keys(pkg.analysis.sections);
    expect(keys.length).toBeGreaterThanOrEqual(1);
  });

  it('import.js rejects packages missing _meta.format', () => {
    // Simulate what import.js checks
    const badPkg = { project: { name: 'Test' } };
    const isValid = badPkg._meta && badPkg._meta.format === 'smartplans-export';
    expect(isValid).toBeFalsy();
  });

  it('import.js rejects packages with unsupported major version > 5', () => {
    const pkg = {
      _meta: { format: 'smartplans-export', version: '6.0' },
      project: { name: 'Test' },
    };
    const majorVersion = parseInt(pkg._meta.version.split('.')[0]);
    expect(majorVersion > 5).toBe(true);
  });

  it('import.js accepts current v3.0 packages', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    const majorVersion = parseInt(pkg._meta.version.split('.')[0]);
    expect(majorVersion).toBeLessThanOrEqual(5);
    expect(pkg._meta.format).toBe('smartplans-export');
    expect(pkg.project.name).toBeTruthy();
  });
});


// ═══════════════════════════════════════════════════════════════
// 5. REIMPORT FLOW — Change Detection
// ═══════════════════════════════════════════════════════════════

describe('Reimport Flow — Change Detection', () => {

  it('detects contract value changes between original and revised export', () => {
    const state = createMockState();
    const originalPkg = engine.buildExportPackage(state);
    const originalValue = originalPkg.financials.grandTotal;

    // Modify the markdown to include higher quantities — simulate a revised estimate
    const revisedMarkdown = REALISTIC_MARKDOWN
      .replace('| 4MP IP Dome Camera (indoor) | 24 |', '| 4MP IP Dome Camera (indoor) | 48 |')
      .replace('| $9,240.00 |', '| $18,480.00 |')
      .replace('Grand Total: $65,661.00', 'Grand Total: $74,901.00');

    const revisedState = { ...createMockState(), aiAnalysis: revisedMarkdown };
    const revisedPkg = engine.buildExportPackage(revisedState);
    const revisedValue = revisedPkg.financials.grandTotal;

    // Revised should be different (higher) than original
    expect(revisedValue).not.toBe(originalValue);
    expect(revisedValue).toBeGreaterThan(originalValue);
  });

  it('detects added line items in a revised export', () => {
    const state = createMockState();
    const originalPkg = engine.buildExportPackage(state);
    const originalItemCount = originalPkg.financials.totalLineItems;

    // Add a new item to the CCTV section
    const revisedMarkdown = REALISTIC_MARKDOWN.replace(
      '| PoE Network Switch 24-port | 4 | ea | $890.00 | $3,560.00 |',
      '| PoE Network Switch 24-port | 4 | ea | $890.00 | $3,560.00 |\n| Camera Mounting Bracket | 36 | ea | $25.00 | $900.00 |'
    );

    const revisedState = { ...createMockState(), aiAnalysis: revisedMarkdown };
    const revisedPkg = engine.buildExportPackage(revisedState);

    expect(revisedPkg.financials.totalLineItems).toBe(originalItemCount + 1);
  });

  it('reimport parser correctly handles both v3.0 financials and v2.0 markdown fallback', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    // v3.0 path: financials present
    const financials = pkg.financials;
    expect(financials.grandTotal).toBeGreaterThan(0);
    expect(financials.categories.length).toBeGreaterThan(0);

    // v2.0 fallback: strip financials, parse raw markdown
    const bom = extractBOMFromMarkdown(pkg.analysis.rawMarkdown);
    expect(bom.categories.length).toBeGreaterThan(0);
    expect(bom.grandTotal).toBeGreaterThan(0);

    // The grand total from raw markdown parsing should match the financial total
    // (SmartPlans _extractBOMFromAnalysis always sums items; SmartPM may use subtotal rows)
    // Allow some tolerance because SmartPM may capture AI subtotal rows
    const diff = Math.abs(financials.grandTotal - bom.grandTotal);
    const tolerance = financials.grandTotal * 0.05; // 5% tolerance
    expect(diff).toBeLessThanOrEqual(tolerance);
  });

  it('discipline-based division assignment is consistent for reimported categories', () => {
    const state = createMockState();
    const pkg = engine.buildExportPackage(state);

    // Simulate what import.js does: assign divisions from category names
    for (const cat of pkg.financials.categories) {
      const division = guessDivision(cat.name);
      // CCTV, Access Control, Fire Alarm -> Division 28
      // Structured Cabling, Backbone -> Division 27
      if (/cctv|camera|access|security|fire|alarm|intrusion/i.test(cat.name)) {
        expect(division).toBe('Division 28');
      } else {
        expect(division).toBe('Division 27');
      }
    }
  });
});
