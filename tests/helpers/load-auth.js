import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadAuthFunctions() {
  const code = readFileSync(join(__dirname, '../../functions/api/auth/login.js'), 'utf-8');
  // Extract everything before the export statement
  const fnSection = code.split('export async function')[0];
  // Also grab recordFailedAttempt which is after the export
  // But we only need the crypto-related functions for unit testing
  const fn = new Function(fnSection + '\nreturn { hashPBKDF2, generateSalt, saltToHex, hexToSalt, hashSHA256 };');
  return fn();
}
