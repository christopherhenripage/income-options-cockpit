import { describe, it, expect } from 'vitest';
import {
  validateUUID,
  validateStockSymbol,
  validateTag,
  sanitizeString,
  timingSafeEqual,
  patterns,
} from './validation';

describe('validateUUID', () => {
  it('accepts valid UUIDs', () => {
    expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
  });

  it('rejects invalid UUIDs', () => {
    expect(validateUUID('not-a-uuid')).toBe(false);
    expect(validateUUID('550e8400-e29b-41d4-a716')).toBe(false);
    expect(validateUUID('')).toBe(false);
    expect(validateUUID('550e8400e29b41d4a716446655440000')).toBe(false);
  });
});

describe('validateStockSymbol', () => {
  it('accepts valid stock symbols', () => {
    expect(validateStockSymbol('AAPL')).toBe(true);
    expect(validateStockSymbol('MSFT')).toBe(true);
    expect(validateStockSymbol('A')).toBe(true);
    expect(validateStockSymbol('GOOGL')).toBe(true);
  });

  it('rejects invalid stock symbols', () => {
    expect(validateStockSymbol('aapl')).toBe(false); // lowercase
    expect(validateStockSymbol('TOOLONG')).toBe(false); // >5 chars
    expect(validateStockSymbol('AA1')).toBe(false); // contains number
    expect(validateStockSymbol('')).toBe(false);
    expect(validateStockSymbol('A B')).toBe(false); // space
  });
});

describe('validateTag', () => {
  it('accepts valid tags', () => {
    expect(validateTag('earnings')).toBe(true);
    expect(validateTag('high-iv')).toBe(true);
    expect(validateTag('weekly_trade')).toBe(true);
    expect(validateTag('Q1-2024')).toBe(true);
  });

  it('rejects invalid tags', () => {
    expect(validateTag('')).toBe(false);
    expect(validateTag('tag with space')).toBe(false);
    expect(validateTag('tag@special')).toBe(false);
    expect(validateTag('a'.repeat(51))).toBe(false); // too long
  });
});

describe('sanitizeString', () => {
  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString('\n\ttest\n')).toBe('test');
  });

  it('enforces max length', () => {
    const long = 'a'.repeat(2000);
    expect(sanitizeString(long, 100).length).toBe(100);
    expect(sanitizeString(long).length).toBe(1000);
  });

  it('handles empty strings', () => {
    expect(sanitizeString('')).toBe('');
    expect(sanitizeString('   ')).toBe('');
  });
});

describe('timingSafeEqual', () => {
  it('returns true for equal strings', () => {
    expect(timingSafeEqual('secret', 'secret')).toBe(true);
    expect(timingSafeEqual('', '')).toBe(true);
    expect(timingSafeEqual('a'.repeat(100), 'a'.repeat(100))).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(timingSafeEqual('secret', 'secre1')).toBe(false);
    expect(timingSafeEqual('secret', 'SECRET')).toBe(false);
    expect(timingSafeEqual('a', 'ab')).toBe(false);
    expect(timingSafeEqual('', 'a')).toBe(false);
  });

  it('handles different length strings securely', () => {
    // Should return false without leaking timing info
    expect(timingSafeEqual('short', 'muchlongerstring')).toBe(false);
  });
});

describe('patterns', () => {
  it('has valid UUID pattern', () => {
    expect(patterns.uuid.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('has valid stock symbol pattern', () => {
    expect(patterns.stockSymbol.test('AAPL')).toBe(true);
    expect(patterns.stockSymbol.test('A')).toBe(true);
  });

  it('has valid date pattern', () => {
    expect(patterns.dateISO.test('2024-01-15')).toBe(true);
    expect(patterns.dateISO.test('2024-1-5')).toBe(false);
  });
});
