import { describe, it, expect, vi } from 'vitest';
import { validateResource, validateDistribution } from '../validators';

// Mock fetch for service testing if needed
global.fetch = vi.fn();

describe('Resource ID Handling', () => {
  it('should handle large resource IDs correctly by converting to strings', () => {
    // This ID exceeds JavaScript's safe integer limit (2^53 - 1)
    const largeId = 1066067726706802699;
    
    // Check if ID is properly preserved as string in validator
    const resource = {
      id: largeId,
      title: 'Test Resource',
      type: 'Guide',
      link: 'https://example.com'
    };
    
    const validatedResource = validateResource(resource);
    
    // ID should be preserved exactly as a string
    expect(validatedResource.id).toBe(String(largeId));
    
    // The number format would potentially lose precision 
    // This demonstrates the problem we're fixing
    if (largeId !== Number(String(largeId))) {
      console.log('JavaScript numeric precision issue demonstrated:');
      console.log(`Original ID: ${largeId}`);
      console.log(`ID after conversion: ${Number(String(largeId))}`);
      console.log(`Difference: ${largeId - Number(String(largeId))}`);
    }
  });
  
  it('should validate distribution data with large IDs', () => {
    const distribution = {
      resourceId: 1066067726706802699,
      companyIds: [9007199254740990, 9007199254740991], // Max safe integer - 1 and max safe integer
      tagIds: [1, 2, 3]
    };
    
    const validatedDistribution = validateDistribution(distribution);
    
    // All IDs should be preserved as strings
    expect(validatedDistribution.resourceId).toBe(String(distribution.resourceId));
    expect(validatedDistribution.companyIds[0]).toBe(String(distribution.companyIds[0]));
    expect(validatedDistribution.companyIds[1]).toBe(String(distribution.companyIds[1]));
    expect(validatedDistribution.tagIds[0]).toBe(String(distribution.tagIds[0]));
  });
});