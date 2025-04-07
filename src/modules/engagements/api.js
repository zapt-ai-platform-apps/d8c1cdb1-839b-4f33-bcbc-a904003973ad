import { 
  fetchEngagements, 
  fetchEngagementById, 
  createEngagement, 
  updateEngagement, 
  deleteEngagement,
  getAITools
} from './internal/services';
import { eventBus } from '../core/events';
import { events } from './events';

/**
 * Engagements module public API
 */
export const api = {
  /**
   * Get engagements for a company
   * @param {number} companyId - Company ID
   * @returns {Promise<Array>} - List of engagements
   */
  getEngagements: fetchEngagements,
  
  /**
   * Get a single engagement by ID with its follow-ups
   * @param {number} engagementId - Engagement ID
   * @returns {Promise<Object>} - Engagement details with follow-ups
   */
  getEngagementById: fetchEngagementById,
  
  /**
   * Create a new engagement with optional follow-ups
   * @param {Object} engagementData - Engagement data
   * @param {Array} followUps - Follow-up actions
   * @returns {Promise<Object>} - Created engagement
   */
  createEngagement,
  
  /**
   * Update an existing engagement with its follow-ups
   * @param {number} engagementId - Engagement ID
   * @param {Object} engagementData - Updated engagement data
   * @param {Array} followUps - Updated follow-up actions
   * @returns {Promise<Object>} - Updated engagement
   */
  updateEngagement,
  
  /**
   * Delete an engagement
   * @param {number} engagementId - Engagement ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteEngagement,
  
  /**
   * Parse AI tools from JSON string
   * @param {string} aiToolsStr - AI tools JSON string
   * @returns {Array} - Array of AI tools
   */
  getAITools,
  
  /**
   * Subscribe to engagement events
   * @param {string} eventName - Event to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onEvent: (eventName, callback) => {
    if (!events[eventName]) {
      console.warn(`Unknown engagement event: ${eventName}`);
      return () => {};
    }
    
    return eventBus.subscribe(events[eventName], callback);
  }
};

// Re-export events for convenience
export { events };