import { describe, it, expect } from 'vitest';

describe('Resource ID Handling', () => {
  it('should demonstrate JavaScript numeric precision issues', () => {
    // Original large ID as string
    const originalId = '1066067726706802699';
    
    // Attempt to parse and convert back to string - simulates what happens in processing
    const asNumber = Number(originalId);
    const backToString = String(asNumber);
    
    // This demonstrates the precision loss problem
    expect(backToString).not.toBe(originalId);
    console.log(`Original: ${originalId}, After conversion: ${backToString}`);
    
    // BigInt preserves precision
    const asBigInt = BigInt(originalId);
    const fromBigInt = String(asBigInt);
    expect(fromBigInt).toBe(originalId);
    
    // Solution: always keep IDs as strings throughout the process
    const keptAsString = String(originalId);
    expect(keptAsString).toBe(originalId);
  });
});