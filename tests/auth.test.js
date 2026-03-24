import { describe, it, expect, beforeAll } from 'vitest';
import { loadAuthFunctions } from './helpers/load-auth.js';

let hashPBKDF2, generateSalt, saltToHex, hexToSalt, hashSHA256;

beforeAll(() => {
  const fns = loadAuthFunctions();
  hashPBKDF2 = fns.hashPBKDF2;
  generateSalt = fns.generateSalt;
  saltToHex = fns.saltToHex;
  hexToSalt = fns.hexToSalt;
  hashSHA256 = fns.hashSHA256;
});

// ═══════════════════════════════════════════════════════════════
// hashPBKDF2
// ═══════════════════════════════════════════════════════════════

describe('hashPBKDF2', () => {
  it('produces consistent results with the same password and salt', async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const hash1 = await hashPBKDF2('mypassword', salt);
    const hash2 = await hashPBKDF2('mypassword', salt);
    expect(hash1).toBe(hash2);
  });

  it('produces different results with different salts', async () => {
    const salt1 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const salt2 = new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    const hash1 = await hashPBKDF2('mypassword', salt1);
    const hash2 = await hashPBKDF2('mypassword', salt2);
    expect(hash1).not.toBe(hash2);
  });

  it('produces different results with different passwords', async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const hash1 = await hashPBKDF2('password1', salt);
    const hash2 = await hashPBKDF2('password2', salt);
    expect(hash1).not.toBe(hash2);
  });

  it('returns a 64-character hex string (256 bits)', async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const hash = await hashPBKDF2('test', salt);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ═══════════════════════════════════════════════════════════════
// generateSalt
// ═══════════════════════════════════════════════════════════════

describe('generateSalt', () => {
  it('produces a 16-byte Uint8Array', () => {
    const salt = generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.length).toBe(16);
  });

  it('produces different salts on successive calls', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    // Extremely unlikely to be equal with 128 bits of randomness
    expect(saltToHex(salt1)).not.toBe(saltToHex(salt2));
  });
});

// ═══════════════════════════════════════════════════════════════
// saltToHex / hexToSalt — inverse operations
// ═══════════════════════════════════════════════════════════════

describe('saltToHex and hexToSalt', () => {
  it('saltToHex converts Uint8Array to hex string', () => {
    const salt = new Uint8Array([0, 1, 15, 16, 255]);
    expect(saltToHex(salt)).toBe('00010f10ff');
  });

  it('hexToSalt converts hex string back to Uint8Array', () => {
    const hex = '00010f10ff';
    const salt = hexToSalt(hex);
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(Array.from(salt)).toEqual([0, 1, 15, 16, 255]);
  });

  it('round-trips correctly: hexToSalt(saltToHex(salt)) === salt', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111, 0, 128, 255, 1, 2, 3, 4, 5, 6, 7, 8]);
    const hex = saltToHex(original);
    const recovered = hexToSalt(hex);
    expect(Array.from(recovered)).toEqual(Array.from(original));
  });

  it('round-trips correctly: saltToHex(hexToSalt(hex)) === hex', () => {
    const original = 'deadbeef01020304aabbccdd11223344';
    const salt = hexToSalt(original);
    const recovered = saltToHex(salt);
    expect(recovered).toBe(original);
  });

  it('produces 32-char hex for a 16-byte salt', () => {
    const salt = generateSalt();
    const hex = saltToHex(salt);
    expect(hex).toHaveLength(32);
    expect(hex).toMatch(/^[0-9a-f]{32}$/);
  });
});

// ═══════════════════════════════════════════════════════════════
// hashSHA256
// ═══════════════════════════════════════════════════════════════

describe('hashSHA256', () => {
  it('produces expected output for known input "hello"', async () => {
    // SHA-256 of "hello" is well-known
    const hash = await hashSHA256('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('produces a 64-character hex string', async () => {
    const hash = await hashSHA256('test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different hashes for different inputs', async () => {
    const hash1 = await hashSHA256('password1');
    const hash2 = await hashSHA256('password2');
    expect(hash1).not.toBe(hash2);
  });

  it('is deterministic — same input always gives same hash', async () => {
    const hash1 = await hashSHA256('deterministic');
    const hash2 = await hashSHA256('deterministic');
    expect(hash1).toBe(hash2);
  });

  it('produces expected output for empty string', async () => {
    // SHA-256 of "" is well-known
    const hash = await hashSHA256('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
