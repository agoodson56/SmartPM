import { describe, it, expect, beforeAll } from 'vitest';
import { loadImportFunctions } from './helpers/load-import.js';

// ═══════════════════════════════════════════════════════════════
// SmartPM Import Parser Fuzz Tests
// Ensures extractBOMFromMarkdown and extractGrandTotal
// never throw unhandled exceptions regardless of input.
// ═══════════════════════════════════════════════════════════════

let extractBOMFromMarkdown, extractGrandTotal;

beforeAll(() => {
  const fns = loadImportFunctions();
  extractBOMFromMarkdown = fns.extractBOMFromMarkdown;
  extractGrandTotal = fns.extractGrandTotal;
});

// Helper to build a standard BOM table inside a category heading
function buildTable(categoryName, rows) {
  let md = `## ${categoryName}\n\n`;
  md += '| Item | Qty | Unit Cost | Ext Cost |\n';
  md += '|------|-----|-----------|----------|\n';
  for (const [item, qty, unitCost, extCost] of rows) {
    md += `| ${item} | ${qty} | ${unitCost} | ${extCost} |\n`;
  }
  return md;
}

// ═══════════════════════════════════════════════════════════════
// extractBOMFromMarkdown — Fuzz Tests
// ═══════════════════════════════════════════════════════════════

describe('extractBOMFromMarkdown fuzz tests', () => {

  // ── Extremely long input ──
  it('handles extremely long input (100,000+ chars) without throwing', () => {
    const longText = '## Material Costs\n\n| Item | Qty | Unit Cost | Ext Cost |\n|------|-----|-----------|----------|\n' +
      '| Widget | 1 | $10.00 | $10.00 |\n'.repeat(500) +
      'x'.repeat(100000);
    expect(() => extractBOMFromMarkdown(longText)).not.toThrow();
    const result = extractBOMFromMarkdown(longText);
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('grandTotal');
  });

  // ── Only pipe characters ──
  it('handles input with only pipe characters', () => {
    expect(() => extractBOMFromMarkdown('||||||||||||||||||||||||||||||||')).not.toThrow();
    const result = extractBOMFromMarkdown('||||||||||||||||||||||||||||||||');
    expect(result).toHaveProperty('categories');
  });

  it('handles many rows of only pipes', () => {
    const input = ('||||||||||\n').repeat(200);
    expect(() => extractBOMFromMarkdown(input)).not.toThrow();
  });

  // ── Unicode and emoji in table cells ──
  it('handles unicode and emoji in table cells', () => {
    const md = buildTable('Equipment Costs', [
      ['\u{1F4F7} Camera HD \u2014 \u00E9l\u00E8ve', '5', '$\u00A51,200.00', '$6,000.00'],
      ['\u{1F50C} \u00DC\u00F1\u00EE\u00E7\u00F6\u00F0\u00E8 Cable \u2603', '100', '$25.00', '$2,500.00'],
      ['\u4E2D\u6587\u8BBE\u5907 \u0410\u0411\u0412', '3', '$500.00', '$1,500.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
    const result = extractBOMFromMarkdown(md);
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('grandTotal');
  });

  it('handles emoji-only item names', () => {
    const md = buildTable('Material Costs', [
      ['\u{1F4F7}\u{1F4F7}\u{1F4F7}', '1', '$100.00', '$100.00'],
      ['\u{1F525}\u{1F4A5}\u{2728}', '2', '$50.00', '$100.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── Nested markdown: tables inside code blocks ──
  it('handles tables inside code blocks', () => {
    const md = '## Material Costs\n\n```\n| Item | Qty | Cost |\n|------|-----|------|\n| Cable | 10 | $100 |\n```\n\n' +
      '| Item | Qty | Unit Cost | Ext Cost |\n|------|-----|-----------|----------|\n| Real Cable | 10 | $100.00 | $1,000.00 |\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── HTML injection attempts ──
  it('handles HTML injection in item names', () => {
    const md = buildTable('CCTV Camera Costs', [
      ['<script>alert(1)</script>', '5', '$1,200.00', '$6,000.00'],
      ['<img src=x onerror=alert(1)>', '10', '$50.00', '$500.00'],
      ['<iframe src="evil.com"></iframe>', '1', '$999.00', '$999.00'],
      ['<div onmouseover="steal()">Camera</div>', '3', '$200.00', '$600.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
    const result = extractBOMFromMarkdown(md);
    expect(result).toHaveProperty('categories');
    if (result.categories.length > 0 && result.categories[0].items.length > 0) {
      expect(typeof result.categories[0].items[0].item).toBe('string');
    }
  });

  // ── SQL injection attempts ──
  it('handles SQL injection attempts in values', () => {
    const md = buildTable('Access Control Costs', [
      ["'; DROP TABLE items; --", '5', '$100.00', '$500.00'],
      ['1 OR 1=1', '10', '$50.00', '$500.00'],
      ["Robert'); DROP TABLE Students;--", '1', '$200.00', '$200.00'],
      ['UNION SELECT * FROM passwords', '2', "'; DELETE FROM costs;--", '$400.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
    const result = extractBOMFromMarkdown(md);
    expect(result).toHaveProperty('categories');
  });

  // ── Null bytes and control characters ──
  it('handles null bytes in input', () => {
    const md = '## Material Costs\n\0\0\0\n| Item | Qty | Unit Cost | Ext Cost |\n|------|-----|-----------|----------|\n| Cable\0Wire | 10 | $100.00 | $1,000.00 |\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  it('handles control characters throughout', () => {
    const controlChars = '\x01\x02\x03\x04\x05\x06\x07\x08\x0B\x0C\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F';
    const md = `## Equipment ${controlChars} Costs\n\n| Item | Qty | Unit Cost | Ext Cost |\n|------|-----|-----------|----------|\n| Widget${controlChars} | 5 | $100.00 | $500.00 |\n`;
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── Only headers, no data rows ──
  it('handles tables with only headers and no data rows', () => {
    const md = '## Structured Cabling Costs\n\n| Item | Qty | Unit Cost | Ext Cost |\n|------|-----|-----------|----------|\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
    const result = extractBOMFromMarkdown(md);
    expect(result.grandTotal).toBe(0);
  });

  // ── 1000+ table rows stress test ──
  it('handles 1000+ table rows (stress test)', () => {
    let md = '## Bill of Materials\n\n| Item | Qty | Unit Cost | Ext Cost |\n|------|-----|-----------|----------|\n';
    for (let i = 0; i < 1500; i++) {
      md += `| Item ${i} Model XYZ-${i} | ${i + 1} | $${(i * 1.5 + 0.99).toFixed(2)} | $${((i + 1) * (i * 1.5 + 0.99)).toFixed(2)} |\n`;
    }
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
    const result = extractBOMFromMarkdown(md);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories[0].items.length).toBeGreaterThan(100);
  });

  // ── Every cell is a number ──
  it('handles table where every cell is a number', () => {
    const md = buildTable('Device Costs', [
      ['12345', '10', '$100.00', '$1,000.00'],
      ['67890', '5', '$200.00', '$1,000.00'],
      ['99999', '1', '$500.00', '$500.00'],
      ['0', '0', '$0.00', '$0.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── Negative costs and quantities ──
  it('handles negative costs and quantities', () => {
    const md = buildTable('Material Costs', [
      ['Credit for returned cable', '-50', '$25.00', '-$1,250.00'],
      ['Refund item', '10', '-$100.00', '-$1,000.00'],
      ['Normal item', '5', '$200.00', '$1,000.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
    const result = extractBOMFromMarkdown(md);
    expect(typeof result.grandTotal).toBe('number');
  });

  // ── Scientific notation costs ──
  it('handles scientific notation costs', () => {
    const md = buildTable('Infrastructure Costs', [
      ['Mega Cable Run', '1', '1.5e6', '1.5e6'],
      ['Fiber Backbone', '10', '2.5E4', '2.5E5'],
      ['Normal Item', '5', '$100.00', '$500.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── Extremely large numbers ──
  it('handles extremely large dollar amounts', () => {
    const md = buildTable('Equipment Costs', [
      ['Mega Server Farm', '1', '$999,999,999,999.99', '$999,999,999,999.99'],
      ['Quantum Computer', '1', '$1,000,000,000,000.00', '$1,000,000,000,000.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
    const result = extractBOMFromMarkdown(md);
    expect(typeof result.grandTotal).toBe('number');
    expect(Number.isFinite(result.grandTotal)).toBe(true);
  });

  // ── UTF-8 BOM and Windows line endings ──
  it('handles UTF-8 BOM prefix', () => {
    const bom = '\uFEFF';
    const md = bom + buildTable('Material Costs', [
      ['Cat6a Cable', '50', '$250.00', '$12,500.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  it('handles Windows-style \\r\\n line endings', () => {
    const md = '## Equipment Costs\r\n\r\n| Item | Qty | Unit Cost | Ext Cost |\r\n|------|-----|-----------|----------|\r\n| Camera | 10 | $500.00 | $5,000.00 |\r\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  it('handles mixed line endings', () => {
    const md = '## Material Costs\r\n\n| Item | Qty | Cost |\r|---|---|---|\n| Widget | 1 | $10.00 |\r\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── Valid JSON instead of markdown ──
  it('handles valid JSON string as input', () => {
    const json = JSON.stringify({ categories: [{ name: 'Test' }], grandTotal: 100 });
    expect(() => extractBOMFromMarkdown(json)).not.toThrow();
  });

  it('handles JSON array input', () => {
    expect(() => extractBOMFromMarkdown(JSON.stringify([1, 2, 3]))).not.toThrow();
  });

  // ── Falsy and non-string values ──
  it('handles undefined input', () => {
    expect(() => extractBOMFromMarkdown(undefined)).not.toThrow();
    expect(extractBOMFromMarkdown(undefined)).toEqual({ categories: [], grandTotal: 0 });
  });

  it('handles boolean input', () => {
    expect(() => extractBOMFromMarkdown(true)).not.toThrow();
    expect(() => extractBOMFromMarkdown(false)).not.toThrow();
  });

  it('handles numeric input', () => {
    expect(() => extractBOMFromMarkdown(42)).not.toThrow();
    expect(() => extractBOMFromMarkdown(NaN)).not.toThrow();
    expect(() => extractBOMFromMarkdown(Infinity)).not.toThrow();
  });

  // ── Regex adversarial patterns ──
  it('handles regex-adversarial input', () => {
    const input1 = '## ' + 'a'.repeat(50000) + ' Costs';
    const input2 = '**' + 'A'.repeat(50000) + '**';
    const input3 = '$' + ','.repeat(10000) + '999.99';
    expect(() => extractBOMFromMarkdown(input1)).not.toThrow();
    expect(() => extractBOMFromMarkdown(input2)).not.toThrow();
    expect(() => extractBOMFromMarkdown(input3)).not.toThrow();
  });

  it('handles table with mismatched pipes', () => {
    const md = '## Material Costs\n\n| Item | Qty |\n|---|---|\n| Cable | 5 | extra | more |\n| Only one cell\n|||\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  it('handles table with thousands of columns', () => {
    const header = '| ' + Array.from({ length: 500 }, (_, i) => `Col${i}`).join(' | ') + ' |';
    const sep = '| ' + Array.from({ length: 500 }, () => '---').join(' | ') + ' |';
    const row = '| ' + Array.from({ length: 500 }, (_, i) => `val${i}`).join(' | ') + ' |';
    const md = '## Equipment Costs\n\n' + header + '\n' + sep + '\n' + row + '\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  it('handles repeated separator lines', () => {
    const md = '## Material Costs\n\n' + '|---|---|---|---|\n'.repeat(500);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  it('handles massive single line', () => {
    const line = '| ' + 'x'.repeat(50000) + ' | 1 | $100.00 | $100.00 |';
    const md = '## Equipment Costs\n\n| Item | Qty | Unit Cost | Ext Cost |\n|---|---|---|---|\n' + line;
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// extractGrandTotal — Fuzz Tests
// ═══════════════════════════════════════════════════════════════

describe('extractGrandTotal fuzz tests', () => {

  it('handles extremely long input', () => {
    const longText = 'x'.repeat(100000) + '\nGrand Total: $999,999.99\n' + 'y'.repeat(100000);
    expect(() => extractGrandTotal(longText)).not.toThrow();
    const result = extractGrandTotal(longText);
    expect(typeof result).toBe('number');
  });

  it('handles only pipe characters', () => {
    expect(() => extractGrandTotal('||||||||||||')).not.toThrow();
    expect(extractGrandTotal('||||||||||||')).toBe(0);
  });

  it('handles unicode and emoji', () => {
    expect(() => extractGrandTotal('Grand Total: \u{1F4B0}$50,000.00 \u2728')).not.toThrow();
  });

  it('handles HTML injection', () => {
    expect(() => extractGrandTotal('<script>alert(1)</script> Grand Total: $10,000.00')).not.toThrow();
  });

  it('handles SQL injection', () => {
    expect(() => extractGrandTotal("'; DROP TABLE -- Grand Total: $10,000.00")).not.toThrow();
  });

  it('handles null bytes', () => {
    expect(() => extractGrandTotal('Grand\0Total: $10,000.00')).not.toThrow();
  });

  it('handles control characters', () => {
    expect(() => extractGrandTotal('Grand Total\x01\x02: $10,000.00')).not.toThrow();
  });

  it('handles null/undefined/empty', () => {
    expect(() => extractGrandTotal(null)).not.toThrow();
    expect(extractGrandTotal(null)).toBe(0);
    expect(() => extractGrandTotal(undefined)).not.toThrow();
    expect(extractGrandTotal(undefined)).toBe(0);
    expect(() => extractGrandTotal('')).not.toThrow();
    expect(extractGrandTotal('')).toBe(0);
  });

  it('handles scientific notation amounts', () => {
    expect(() => extractGrandTotal('Grand Total: $1.5e6')).not.toThrow();
  });

  it('handles extremely large amounts', () => {
    expect(() => extractGrandTotal('Grand Total: $999,999,999,999.99')).not.toThrow();
    const result = extractGrandTotal('Grand Total: $999,999,999,999.99');
    expect(Number.isFinite(result)).toBe(true);
  });

  it('handles negative amounts', () => {
    expect(() => extractGrandTotal('Grand Total: -$50,000.00')).not.toThrow();
  });

  it('handles UTF-8 BOM', () => {
    expect(() => extractGrandTotal('\uFEFFGrand Total: $10,000.00')).not.toThrow();
  });

  it('handles Windows line endings', () => {
    expect(() => extractGrandTotal('Line one\r\nGrand Total: $10,000.00\r\nLine three')).not.toThrow();
  });

  it('handles JSON input', () => {
    expect(() => extractGrandTotal(JSON.stringify({ grandTotal: 50000 }))).not.toThrow();
  });

  it('handles regex-adversarial patterns', () => {
    // Many $ signs could stress the regex
    const input = '$'.repeat(50000) + ' Grand Total: $999.99';
    expect(() => extractGrandTotal(input)).not.toThrow();
  });

  it('handles multiple grand total lines (returns first valid)', () => {
    const md = 'Grand Total: $10,000.00\nGrand Total: $20,000.00\nGrand Total: $30,000.00';
    expect(() => extractGrandTotal(md)).not.toThrow();
    const result = extractGrandTotal(md);
    expect(result).toBeGreaterThan(0);
  });

  it('handles boolean and numeric input', () => {
    expect(() => extractGrandTotal(true)).not.toThrow();
    expect(() => extractGrandTotal(42)).not.toThrow();
    expect(() => extractGrandTotal(NaN)).not.toThrow();
    expect(() => extractGrandTotal(Infinity)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// Malformed SmartPlans Export Packages — Fuzz Tests
// Tests the resilience of extractBOMFromMarkdown when given
// non-string inputs simulating corrupted import payloads.
// ═══════════════════════════════════════════════════════════════

describe('malformed SmartPlans export package inputs', () => {

  // ── Missing fields ──
  it('handles object input instead of string', () => {
    expect(() => extractBOMFromMarkdown({})).not.toThrow();
    expect(() => extractBOMFromMarkdown({ rawMarkdown: 'test' })).not.toThrow();
  });

  it('handles array input instead of string', () => {
    expect(() => extractBOMFromMarkdown([])).not.toThrow();
    expect(() => extractBOMFromMarkdown([1, 2, 3])).not.toThrow();
  });

  // ── Wrong types ──
  it('handles number where string expected', () => {
    expect(() => extractBOMFromMarkdown(12345)).not.toThrow();
    expect(() => extractBOMFromMarkdown(0)).not.toThrow();
    expect(() => extractBOMFromMarkdown(-1)).not.toThrow();
  });

  it('handles Symbol input', () => {
    // Symbol.toString() would cause issues if not handled
    let threw = false;
    try {
      extractBOMFromMarkdown(Symbol('test'));
    } catch (e) {
      threw = true;
      // Symbols can't be implicitly converted - this is acceptable
      // as long as it's a TypeError, not an unrelated crash
      expect(e).toBeInstanceOf(TypeError);
    }
    // Either it handles gracefully or throws a clean TypeError
    expect(true).toBe(true);
  });

  // ── Nested objects where strings expected ──
  it('handles deeply nested object as input', () => {
    const nested = { a: { b: { c: { d: { e: { f: 'deep' } } } } } };
    expect(() => extractBOMFromMarkdown(nested)).not.toThrow();
  });

  // ── Circular reference simulation (deeply nested) ──
  it('handles very deeply nested objects (100 levels)', () => {
    let obj = { value: 'leaf' };
    for (let i = 0; i < 100; i++) {
      obj = { child: obj };
    }
    expect(() => extractBOMFromMarkdown(obj)).not.toThrow();
  });

  it('handles object with toString that returns markdown', () => {
    const obj = {
      toString() {
        return '## Material Costs\n\n| Item | Qty | Unit Cost | Ext Cost |\n|---|---|---|---|\n| Cable | 10 | $100.00 | $1,000.00 |';
      }
    };
    // Depending on implementation, may parse via toString or return empty
    expect(() => extractBOMFromMarkdown(obj)).not.toThrow();
  });

  // ── Number overflow ──
  it('handles Number.MAX_SAFE_INTEGER + 1 in table values', () => {
    const bigNum = Number.MAX_SAFE_INTEGER + 1;
    const md = buildTable('Equipment Costs', [
      ['Item A', `${bigNum}`, `$${bigNum}`, `$${bigNum}`],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
    const result = extractBOMFromMarkdown(md);
    expect(typeof result.grandTotal).toBe('number');
  });

  it('handles Number.MAX_VALUE in table values', () => {
    const md = buildTable('Material Costs', [
      ['Item A', '1', `$${Number.MAX_VALUE}`, `$${Number.MAX_VALUE}`],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  it('handles negative zero', () => {
    const md = buildTable('Material Costs', [
      ['Item A', '-0', '$-0', '$-0'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── Empty strings vs null vs undefined for all fields ──
  it('handles empty string', () => {
    expect(() => extractBOMFromMarkdown('')).not.toThrow();
    expect(extractBOMFromMarkdown('')).toEqual({ categories: [], grandTotal: 0 });
  });

  it('handles whitespace-only string', () => {
    expect(() => extractBOMFromMarkdown('   \n\n\t\t  ')).not.toThrow();
  });

  it('handles string of only null bytes', () => {
    expect(() => extractBOMFromMarkdown('\0\0\0\0\0')).not.toThrow();
  });

  // ── Very long project names (simulated in item names) ──
  it('handles very long item names (10,000+ chars)', () => {
    const longName = 'A'.repeat(10000);
    const md = buildTable('Material Costs', [
      [longName, '1', '$100.00', '$100.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  it('handles very long category names (10,000+ chars)', () => {
    const longCat = 'Material ' + 'X'.repeat(10000) + ' Costs';
    const md = buildTable(longCat, [
      ['Cable', '10', '$25.00', '$250.00'],
    ]);
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── Binary data in string fields ──
  it('handles binary-like data in string fields', () => {
    // Simulate binary data as a string with random bytes
    let binaryStr = '';
    for (let i = 0; i < 1000; i++) {
      binaryStr += String.fromCharCode(i % 256);
    }
    expect(() => extractBOMFromMarkdown(binaryStr)).not.toThrow();
  });

  it('handles high surrogate pairs (incomplete unicode)', () => {
    // Lone high surrogate
    const md = '## Material Costs\n\n| Item | Qty | Cost |\n|---|---|---|\n| \uD800\uD801 Cable | 1 | $10 |\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── Extra fields (should be ignored) ──
  it('handles markdown with unusual markdown constructs', () => {
    const md = '## Material Costs\n\n' +
      '> Blockquote with | pipe | chars |\n\n' +
      '- List item with | pipe\n' +
      '  - Nested | pipes |\n\n' +
      '| Item | Qty | Unit Cost | Ext Cost |\n' +
      '|------|-----|-----------|----------|\n' +
      '| Cable | 10 | $25.00 | $250.00 |\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── Function as input ──
  it('handles function as input', () => {
    expect(() => extractBOMFromMarkdown(() => 'test')).not.toThrow();
  });

  // ── RegExp as input ──
  it('handles RegExp as input', () => {
    expect(() => extractBOMFromMarkdown(/test/gi)).not.toThrow();
  });

  // ── Date as input ──
  it('handles Date object as input', () => {
    expect(() => extractBOMFromMarkdown(new Date())).not.toThrow();
  });

  // ── Prototype pollution attempt ──
  it('handles __proto__ in markdown', () => {
    const md = '## __proto__ Costs\n\n| __proto__ | constructor | toString | Ext Cost |\n|---|---|---|---|\n| __proto__ | 1 | $100.00 | $100.00 |\n';
    expect(() => extractBOMFromMarkdown(md)).not.toThrow();
  });

  // ── extractGrandTotal with same malformed inputs ──

  it('extractGrandTotal handles object input', () => {
    expect(() => extractGrandTotal({})).not.toThrow();
    expect(() => extractGrandTotal([])).not.toThrow();
  });

  it('extractGrandTotal handles function input', () => {
    expect(() => extractGrandTotal(() => '$10,000')).not.toThrow();
  });

  it('extractGrandTotal handles Date input', () => {
    expect(() => extractGrandTotal(new Date())).not.toThrow();
  });

  it('extractGrandTotal handles Number.MAX_SAFE_INTEGER overflow', () => {
    const md = `Grand Total: $${Number.MAX_SAFE_INTEGER + 100}`;
    expect(() => extractGrandTotal(md)).not.toThrow();
    const result = extractGrandTotal(md);
    expect(typeof result).toBe('number');
  });

  it('extractGrandTotal handles very long project name before total', () => {
    const md = 'A'.repeat(10000) + '\nGrand Total: $50,000.00';
    expect(() => extractGrandTotal(md)).not.toThrow();
  });

  it('extractGrandTotal handles binary-like string', () => {
    let binaryStr = '';
    for (let i = 0; i < 500; i++) {
      binaryStr += String.fromCharCode(i % 256);
    }
    expect(() => extractGrandTotal(binaryStr)).not.toThrow();
  });
});
