import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SmartPlans project path — relative from SmartPM tests/helpers
const SMARTPLANS_ROOT = join(__dirname, '../../../../../SmartPlans/SmartPlans-main/SmartPlans-main');

export function loadExportEngine() {
  // Stub PRICING_DB dependency
  const PRICING_DB = {
    version: '5.0',
    regionalMultipliers: {
      national_average: 1.0,
      california: 1.25,
      new_york: 1.30,
      texas: 0.92,
    },
  };

  // Stub getRFIsForDisciplines dependency
  const getRFIsForDisciplines = (disciplines) => {
    // Return realistic RFIs for testing
    const allRFIs = [
      { id: 'rfi-001', question: 'Confirm conduit pathway routing from MDF to IDF-1 through rated walls', detail: 'Drawings show conduit path through 2-hr fire-rated wall. Confirm penetration sleeve size and firestop method.' },
      { id: 'rfi-002', question: 'Verify camera mounting height at loading dock exterior locations', detail: 'Specification calls for 12ft mounting height but structural drawings show 10ft eave.' },
      { id: 'rfi-003', question: 'Confirm access control power source at main lobby card readers', detail: 'Readers require 12VDC. Confirm if power is from access panel or local transformer.' },
    ];
    return allRFIs;
  };

  const code = readFileSync(join(SMARTPLANS_ROOT, 'export-engine.js'), 'utf-8');

  const warnings = [];
  const errors = [];
  const quietConsole = {
    ...console,
    warn: (...args) => { warnings.push(args.join(' ')); },
    error: (...args) => { errors.push(args.join(' ')); },
    log: console.log,
  };

  const fn = new Function(
    'PRICING_DB',
    'getRFIsForDisciplines',
    'console',
    code + '\nreturn SmartPlansExport;'
  );

  const engine = fn(PRICING_DB, getRFIsForDisciplines, quietConsole);
  engine._testWarnings = warnings;
  engine._testErrors = errors;

  return engine;
}
