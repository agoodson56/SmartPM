import { describe, it, expect, beforeAll } from 'vitest';
import { loadImportFunctions } from './helpers/load-import.js';

let extractBOMFromMarkdown, extractGrandTotal, guessDivision;

beforeAll(() => {
  const fns = loadImportFunctions();
  extractBOMFromMarkdown = fns.extractBOMFromMarkdown;
  extractGrandTotal = fns.extractGrandTotal;
  guessDivision = fns.guessDivision;
});

// ═══════════════════════════════════════════════════════════════
// extractBOMFromMarkdown
// ═══════════════════════════════════════════════════════════════

describe('extractBOMFromMarkdown', () => {
  it('returns empty result for null input', () => {
    const result = extractBOMFromMarkdown(null);
    expect(result).toEqual({ categories: [], grandTotal: 0 });
  });

  it('returns empty result for empty string', () => {
    const result = extractBOMFromMarkdown('');
    expect(result).toEqual({ categories: [], grandTotal: 0 });
  });

  it('returns empty result for undefined input', () => {
    const result = extractBOMFromMarkdown(undefined);
    expect(result).toEqual({ categories: [], grandTotal: 0 });
  });

  it('parses a standard markdown table with Item | Qty | Unit Cost | Ext Cost columns', () => {
    const md = `## Structured Cabling Material Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Cat6a Cable (1000ft) | 50 | $250.00 | $12,500.00 |
| RJ45 Connectors (100pk) | 20 | $45.00 | $900.00 |
| Patch Panels 48-port | 10 | $180.00 | $1,800.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Structured Cabling Material Costs');
    expect(result.categories[0].items).toHaveLength(3);
    expect(result.categories[0].items[0].item).toBe('Cat6a Cable (1000ft)');
    expect(result.categories[0].items[0].qty).toBe(50);
    expect(result.categories[0].items[0].unitCost).toBe(250);
    expect(result.categories[0].items[0].extCost).toBe(12500);
  });

  it('parses table with Description, Quantity, Total column names', () => {
    const md = `## Equipment Pricing

| Description | Quantity | Total |
|-------------|----------|-------|
| Network Switch 48-port | 5 | $15,000.00 |
| UPS Battery Backup | 3 | $4,500.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].items).toHaveLength(2);
    expect(result.categories[0].items[0].item).toBe('Network Switch 48-port');
    expect(result.categories[0].items[0].qty).toBe(5);
    expect(result.categories[0].items[0].extCost).toBe(15000);
  });

  it('parses multiple categories under different headings', () => {
    const md = `## Structured Cabling Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Cat6a Cable | 10 | $200.00 | $2,000.00 |

## CCTV Camera Equipment

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| IP Camera 4K | 20 | $500.00 | $10,000.00 |
| NVR 32-channel | 2 | $3,000.00 | $6,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories).toHaveLength(2);
    expect(result.categories[0].name).toBe('Structured Cabling Costs');
    expect(result.categories[0].items).toHaveLength(1);
    expect(result.categories[1].name).toBe('CCTV Camera Equipment');
    expect(result.categories[1].items).toHaveLength(2);
  });

  it('captures subtotal rows correctly', () => {
    const md = `## Backbone Cabling Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Fiber Cable | 5 | $1,000.00 | $5,000.00 |
| Fiber Connectors | 50 | $20.00 | $1,000.00 |
| **Subtotal** | | | $6,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].subtotal).toBe(6000);
    // Subtotal row should NOT be an item
    expect(result.categories[0].items).toHaveLength(2);
  });

  it('excludes summary sections to prevent double-counting', () => {
    const md = `## Structured Cabling Material Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Cat6a Cable | 10 | $200.00 | $2,000.00 |

## Project Cost Summary

| Category | Total |
|----------|-------|
| Structured Cabling | $2,000.00 |
| Grand Total | $2,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    // Only the material costs category, not the summary
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Structured Cabling Material Costs');
  });

  it('excludes non-category headings like timeline, RFI, risk', () => {
    const md = `## Fire Alarm Device Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Smoke Detector | 100 | $50.00 | $5,000.00 |

## Timeline and Schedule

Some timeline text here.

## RFI Items

Some RFI text here.
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Fire Alarm Device Costs');
  });

  it('uses positional fallback when columns cannot be mapped', () => {
    const md = `## Miscellaneous Costs

| Thing | Count | Price | Extended |
|-------|-------|-------|----------|
| Cable Ties | 500 | $0.10 | $50.00 |
`;
    // 'Thing' won't match item keywords, 'Count' won't match qty, etc.
    // But positional parsing should still pick up numbers
    const result = extractBOMFromMarkdown(md);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].items).toHaveLength(1);
    // With positional fallback, extCost should be > 0
    expect(result.categories[0].items[0].extCost).toBeGreaterThan(0);
  });

  it('grand total equals sum of all category subtotals', () => {
    const md = `## Structured Cabling Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Cable | 10 | $100.00 | $1,000.00 |

## Access Control Equipment

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Card Reader | 5 | $200.00 | $1,000.00 |
| Controller | 2 | $500.00 | $1,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.grandTotal).toBe(3000);
  });

  it('calculates extCost from qty * unitCost when extCost is missing', () => {
    const md = `## Rack Equipment Costs

| Item | Qty | Unit Cost |
|------|-----|-----------|
| 42U Rack | 3 | $800.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories[0].items[0].extCost).toBe(2400);
  });

  it('calculates unitCost from extCost / qty when unitCost is missing', () => {
    const md = `## Panel Costs

| Item | Qty | Ext Cost |
|------|-----|----------|
| Patch Panel | 4 | $800.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories[0].items[0].unitCost).toBe(200);
  });

  it('skips rows with empty or very short item names', () => {
    const md = `## Cabling Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| A | 1 | $100.00 | $100.00 |
| Cat6a Cable | 10 | $200.00 | $2,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    // 'A' is less than 2 chars, should be skipped
    expect(result.categories[0].items).toHaveLength(1);
    expect(result.categories[0].items[0].item).toBe('Cat6a Cable');
  });

  it('skips continuation rows with "..." or "continue"', () => {
    const md = `## Infrastructure Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Switch | 5 | $1,000.00 | $5,000.00 |
| ... | | | |
| Router | 2 | $2,000.00 | $4,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories[0].items).toHaveLength(2);
  });

  it('handles bold (**) formatting in category headings', () => {
    const md = `**Conduit and Pathway Materials**

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| EMT Conduit 3/4 | 200 | $5.00 | $1,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Conduit and Pathway Materials');
  });

  it('strips bold markers from item names', () => {
    const md = `## Equipment Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| **Core Switch** | 1 | $5,000.00 | $5,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories[0].items[0].item).toBe('Core Switch');
  });

  it('handles dollar signs and commas in cost values', () => {
    const md = `## MDF Equipment Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Server Rack | 2 | $12,500.00 | $25,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories[0].items[0].unitCost).toBe(12500);
    expect(result.categories[0].items[0].extCost).toBe(25000);
  });

  it('rounds costs to 2 decimal places', () => {
    const md = `## Device Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Sensor | 3 | $33.333 | $99.999 |
`;
    const result = extractBOMFromMarkdown(md);
    // The parser uses Math.round(x * 100) / 100
    expect(result.categories[0].items[0].unitCost).toBe(33.33);
    expect(result.categories[0].items[0].extCost).toBe(100);
  });

  it('auto-sums subtotal from items when no subtotal row exists', () => {
    const md = `## Camera Equipment

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Camera A | 10 | $100.00 | $1,000.00 |
| Camera B | 5 | $200.00 | $1,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories[0].subtotal).toBe(2000);
  });

  it('handles text between tables without losing state', () => {
    const md = `## Cabling Material Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Cable | 10 | $100.00 | $1,000.00 |

Some descriptive text about the pricing assumptions.

## IDF Equipment Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Switch | 5 | $500.00 | $2,500.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories).toHaveLength(2);
  });

  it('handles h3 headings (### style)', () => {
    const md = `### Fire Alarm Pricing

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Pull Station | 20 | $75.00 | $1,500.00 |
`;
    const result = extractBOMFromMarkdown(md);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Fire Alarm Pricing');
  });

  it('ignores non-category headings that do not match category keywords', () => {
    const md = `## Introduction

Some intro text.

## Structured Cabling Costs

| Item | Qty | Unit Cost | Ext Cost |
|------|-----|-----------|----------|
| Cable | 10 | $100.00 | $1,000.00 |
`;
    const result = extractBOMFromMarkdown(md);
    // "Introduction" doesn't match any category keywords
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Structured Cabling Costs');
  });
});

// ═══════════════════════════════════════════════════════════════
// extractGrandTotal
// ═══════════════════════════════════════════════════════════════

describe('extractGrandTotal', () => {
  it('returns 0 for empty input', () => {
    expect(extractGrandTotal('')).toBe(0);
  });

  it('returns 0 for null input', () => {
    expect(extractGrandTotal(null)).toBe(0);
  });

  it('extracts "Grand Total: $500,000.00" format', () => {
    const md = 'Some text\nGrand Total: $500,000.00\nMore text';
    expect(extractGrandTotal(md)).toBe(500000);
  });

  it('extracts "Total Project Cost: $1,234,567.89" format', () => {
    const md = 'Analysis\nTotal Project Cost: $1,234,567.89\nEnd';
    expect(extractGrandTotal(md)).toBe(1234567.89);
  });

  it('extracts bold table format "**Grand Total** | ... | $999,999 |"', () => {
    const md = '| **Grand Total** | | | $999,999 |';
    expect(extractGrandTotal(md)).toBe(999999);
  });

  it('returns 0 when no match found (sanity check > $100)', () => {
    const md = 'Grand Total: $50.00';
    expect(extractGrandTotal(md)).toBe(0);
  });

  it('picks first valid match when multiple total lines exist', () => {
    const md = `Grand Total: $250,000.00
Total Project Cost: $300,000.00`;
    expect(extractGrandTotal(md)).toBe(250000);
  });

  it('extracts "Total with Markup" format', () => {
    const md = 'Total with Markup: $750,000.00';
    expect(extractGrandTotal(md)).toBe(750000);
  });

  it('extracts "Total Estimate" format', () => {
    const md = 'Total Estimate: $425,000.00';
    expect(extractGrandTotal(md)).toBe(425000);
  });

  it('extracts "Total Bid" format', () => {
    const md = 'Total Bid: $1,100,000.50';
    expect(extractGrandTotal(md)).toBe(1100000.5);
  });
});

// ═══════════════════════════════════════════════════════════════
// guessDivision
// ═══════════════════════════════════════════════════════════════

describe('guessDivision', () => {
  it('maps "Structured Cabling" to Division 27', () => {
    expect(guessDivision('Structured Cabling')).toBe('Division 27');
  });

  it('maps "Fire Alarm" to Division 28', () => {
    expect(guessDivision('Fire Alarm')).toBe('Division 28');
  });

  it('maps "CCTV System" to Division 28', () => {
    expect(guessDivision('CCTV System')).toBe('Division 28');
  });

  it('maps "Audio Visual" to Division 27 (default)', () => {
    expect(guessDivision('Audio Visual')).toBe('Division 27');
  });

  it('maps "Access Control" to Division 28', () => {
    expect(guessDivision('Access Control')).toBe('Division 28');
  });

  it('maps "Intrusion Detection" to Division 28', () => {
    expect(guessDivision('Intrusion Detection')).toBe('Division 28');
  });

  it('maps "Security Camera" to Division 28', () => {
    expect(guessDivision('Security Camera')).toBe('Division 28');
  });

  it('maps "Smoke Detection" to Division 28', () => {
    expect(guessDivision('Smoke Detection')).toBe('Division 28');
  });

  it('defaults unknown names to Division 27', () => {
    expect(guessDivision('General Electrical')).toBe('Division 27');
  });
});
