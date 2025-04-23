import { apiClient } from '@/shared/services/apiClient';
import { validateEngagement, validateFollowUpAction } from './validators';
import * as Sentry from '@sentry/browser';
import { refreshSession } from '@/shared/services/supabaseClient';

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
    
    try {
      // Try refreshing the session before making the request
      await refreshSession();
      return await apiClient.get('engagements', { companyId });
    } catch (error) {
      console.error('Failed to get engagements:', error);
      Sentry.captureException(error, {
        extra: { companyId, context: 'getEngagements' }
      });
      throw error;
    }
  },
  
  /**
   * Create a new engagement with optional follow-up actions
   * @param {Object} engagement - The engagement data to create
   * @param {Array} followUps - Optional follow-up actions
   * @returns {Promise<Object>} - The created engagement
   */
  async createEngagement(engagement, followUps = []) {
    try {
      // Try refreshing the session before making the request
      await refreshSession();
      
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
      
      return await apiClient.post('engagements', {
        engagement: validatedEngagement,
        followUps: validatedFollowUps
      });
    } catch (error) {
      console.error('Failed to create engagement:', error);
      Sentry.captureException(error, {
        extra: { 
          engagement, 
          followUps,
          context: 'createEngagement' 
        }
      });
      throw error;
    }
  },
  
  /**
   * Get a single engagement by ID
   * @param {string|number} id - The engagement ID
   * @returns {Promise<Object>} - The engagement data
   */
  async getEngagement(id) {
    try {
      // Try refreshing the session before making the request
      await refreshSession();
      return await apiClient.get(`engagements/${id}`);
    } catch (error) {
      console.error(`Failed to get engagement ${id}:`, error);
      Sentry.captureException(error, {
        extra: { id, context: 'getEngagement' }
      });
      throw error;
    }
  },
  
  /**
   * Update an existing engagement
   * @param {string|number} id - The engagement ID
   * @param {Object} engagement - The updated engagement data
   * @returns {Promise<Object>} - The updated engagement
   */
  async updateEngagement(id, engagement) {
    try {
      // Try refreshing the session before making the request
      await refreshSession();
      
      const validatedEngagement = validateEngagement(engagement, {
        actionName: 'updateEngagement',
        location: 'engagements/api.js',
        direction: 'outgoing',
        moduleFrom: 'engagements',
        moduleTo: 'server'
      });
      
      return await apiClient.put(`engagements/${id}`, validatedEngagement);
    } catch (error) {
      console.error(`Failed to update engagement ${id}:`, error);
      Sentry.captureException(error, {
        extra: { id, engagement, context: 'updateEngagement' }
      });
      throw error;
    }
  }
};