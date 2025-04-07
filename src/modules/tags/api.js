import { fetchTags, createTag } from './internal/services';
import { eventBus } from '../core/events';
import { events } from './events';

/**
 * Tags module public API
 */
export const api = {
  /**
   * Get all tags, optionally filtered by type
   * @param {string} type - Tag type to filter by
   * @returns {Promise<Array>} - List of tags
   */
  getTags: fetchTags,
  
  /**
   * Create a new tag
   * @param {Object} tagData - Tag data
   * @returns {Promise<Object>} - Created tag
   */
  createTag,
  
  /**
   * Subscribe to tag events
   * @param {string} eventName - Event to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onEvent: (eventName, callback) => {
    if (!events[eventName]) {
      console.warn(`Unknown tag event: ${eventName}`);
      return () => {};
    }
    
    return eventBus.subscribe(events[eventName], callback);
  }
};

// Re-export events for convenience
export { events };