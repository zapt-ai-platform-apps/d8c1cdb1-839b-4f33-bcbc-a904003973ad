import { describe, it, expect } from 'vitest';
import { safeStringId, safeStringIds } from './utilities';

describe('safeStringId', () => {
  it('should convert number to string', () => {
    expect(safeStringId(123)).toBe('123');
  });

  it('should return string as is', () => {
    expect(safeStringId('123')).toBe('123');
  });

  it('should handle large numbers without precision loss', () => {
    const largeId = '1065784524843483150';
    expect(safeStringId(largeId)).toBe(largeId);
    
    // Test with numeric input
    const numericLargeId = 1065784524843483150;
    expect(safeStringId(numericLargeId)).toBe(String(numericLargeId));
  });

  it('should handle BigInt values', () => {
    const bigIntId = BigInt('1065784524843483150');
    expect(safeStringId(bigIntId)).toBe('1065784524843483150');
  });

  it('should return null for null input', () => {
    expect(safeStringId(null)).toBe(null);
  });

  it('should return null for undefined input', () => {
    expect(safeStringId(undefined)).toBe(null);
  });
});

describe('safeStringIds', () => {
  it('should convert array of numbers to array of strings', () => {
    expect(safeStringIds([123, 456])).toEqual(['123', '456']);
  });

  it('should handle array with mixed types', () => {
    expect(safeStringIds([123, '456', BigInt('789')])).toEqual(['123', '456', '789']);
  });

  it('should handle array with large numbers', () => {
    const largeId = '1065784524843483150';
    expect(safeStringIds([largeId])).toEqual([largeId]);
  });

  it('should return empty array for non-array input', () => {
    expect(safeStringIds('not an array')).toEqual([]);
    expect(safeStringIds(null)).toEqual([]);
    expect(safeStringIds(undefined)).toEqual([]);
    expect(safeStringIds(123)).toEqual([]);
  });
});