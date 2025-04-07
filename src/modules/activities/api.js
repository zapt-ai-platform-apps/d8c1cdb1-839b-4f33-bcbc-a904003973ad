import { 
  fetchActivities, 
  createActivity, 
  updateActivity, 
  deleteActivity 
} from './internal/services';
import { eventBus } from '../core/events';
import { events } from './events';

/**
 * Activities module public API
 */
export const api = {
  /**
   * Get activities for a company
   * @param {number} companyId - Company ID
   * @returns {Promise<Array>} - List of activities
   */
  getActivities: fetchActivities,
  
  /**
   * Create a new activity
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>} - Created activity
   */
  createActivity,
  
  /**
   * Update an existing activity
   * @param {number} activityId - Activity ID
   * @param {Object} activityData - Updated activity data
   * @returns {Promise<Object>} - Updated activity
   */
  updateActivity,
  
  /**
   * Delete an activity
   * @param {number} activityId - Activity ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteActivity,
  
  /**
   * Subscribe to activity events
   * @param {string} eventName - Event to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onEvent: (eventName, callback) => {
    if (!events[eventName]) {
      console.warn(`Unknown activity event: ${eventName}`);
      return () => {};
    }
    
    return eventBus.subscribe(events[eventName], callback);
  }
};

// Re-export events for convenience
export { events };