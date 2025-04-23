import { apiClient } from '@/shared/services/apiClient';
import { validateEngagement, validateFollowUpAction } from './validators';

export const api = {
  /**
   * Get all engagements for a company
   * @param {string|number} companyId - The ID of the company
   * @returns {Promise<Array>} - Array of engagements
   */
  async getEngagements(companyId) {
    if (!companyId) {
      throw new Error('Company ID is required');
    }
    
    return apiClient.get('engagements', { companyId });
  },
  
  /**
   * Create a new engagement with optional follow-up actions
   * @param {Object} engagement - The engagement data to create
   * @param {Array} followUps - Optional follow-up actions
   * @returns {Promise<Object>} - The created engagement
   */
  async createEngagement(engagement, followUps = []) {
    // Validate engagement data before sending
    const validatedEngagement = validateEngagement(engagement, {
      actionName: 'createEngagement',
      location: 'engagements/api.js',
      direction: 'outgoing',
      moduleFrom: 'engagements',
      moduleTo: 'server'
    });
    
    // Validate each follow-up action if provided
    const validatedFollowUps = followUps.map(followUp => 
      validateFollowUpAction(followUp, {
        actionName: 'createEngagement',
        location: 'engagements/api.js',
        direction: 'outgoing',
        moduleFrom: 'engagements',
        moduleTo: 'server'
      })
    );
    
    console.log('Creating engagement with company ID:', validatedEngagement.companyId);
    
    return apiClient.post('engagements', {
      engagement: validatedEngagement,
      followUps: validatedFollowUps
    });
  },
  
  /**
   * Get a single engagement by ID
   * @param {string|number} id - The engagement ID
   * @returns {Promise<Object>} - The engagement data
   */
  async getEngagement(id) {
    return apiClient.get(`engagements/${id}`);
  },
  
  /**
   * Update an existing engagement
   * @param {string|number} id - The engagement ID
   * @param {Object} engagement - The updated engagement data
   * @returns {Promise<Object>} - The updated engagement
   */
  async updateEngagement(id, engagement) {
    const validatedEngagement = validateEngagement(engagement, {
      actionName: 'updateEngagement',
      location: 'engagements/api.js',
      direction: 'outgoing',
      moduleFrom: 'engagements',
      moduleTo: 'server'
    });
    
    return apiClient.put(`engagements/${id}`, validatedEngagement);
  }
};