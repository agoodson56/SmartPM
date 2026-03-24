import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadImportFunctions() {
  const code = readFileSync(join(__dirname, '../../functions/api/projects/import.js'), 'utf-8');
  // Extract the function definitions (before the export statement)
  const fnSection = code.split('export async function')[0];
  const fn = new Function(fnSection + '\nreturn { extractBOMFromMarkdown, extractGrandTotal, guessDivision };');
  return fn();
}
