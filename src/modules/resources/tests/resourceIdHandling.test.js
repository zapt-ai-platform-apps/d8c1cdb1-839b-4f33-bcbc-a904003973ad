import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchResourceById } from '../internal/services';

describe('Resource ID handling', () => {
  // Mock fetch before each test
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = vi.fn();
    
    // Set up successful response
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        id: '1065794930725519400', 
        title: 'Test Resource',
        type: 'Guide',
        link: 'https://example.com'
      })
    });
  });

  it('should maintain precision with large resource IDs', async () => {
    // The problematic large ID from the error
    const largeId = '1065794930725519400';
    
    // Call the function that fetches a resource by ID
    await fetchResourceById(largeId);
    
    // Check that fetch was called with the exact ID string
    expect(global.fetch).toHaveBeenCalledWith(`/api/resources/${largeId}`);
    
    // Make sure it's not calling with a modified/truncated ID
    const fetchUrl = global.fetch.mock.calls[0][0];
    expect(fetchUrl).to.equal(`/api/resources/${largeId}`);
    expect(fetchUrl).not.to.equal('/api/resources/1065794930725519360'); // Example of precision loss
  });

  it('handles errors and provides detailed error messages', async () => {
    // Mock a 404 response
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Resource not found'
    });
    
    // Expect the function to throw with the detailed error
    await expect(fetchResourceById('999')).rejects.toThrow('Failed to fetch resource data: 404 Resource not found');
  });
});