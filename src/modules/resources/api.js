import { 
  fetchResources, 
  fetchResourceById, 
  createResource, 
  updateResource, 
  distributeResource,
  getResourceTypeColor
} from './internal/services';
import { eventBus } from '../core/events';
import { events } from './events';

/**
 * Resources module public API
 */
export const api = {
  /**
   * Get all resources
   * @returns {Promise<Array>} - List of resources
   */
  getResources: fetchResources,
  
  /**
   * Get a single resource by ID
   * @param {number} id - Resource ID
   * @returns {Promise<Object>} - Resource details
   */
  getResourceById: fetchResourceById,
  
  /**
   * Create a new resource
   * @param {Object} resourceData - Resource data
   * @returns {Promise<Object>} - Created resource
   */
  createResource,
  
  /**
   * Update an existing resource
   * @param {number} id - Resource ID
   * @param {Object} resourceData - Updated resource data
   * @returns {Promise<Object>} - Updated resource
   */
  updateResource,
  
  /**
   * Distribute a resource to selected companies or tags
   * @param {number} resourceId - Resource ID
   * @param {Array<number>} companyIds - Companies to distribute to
   * @param {Array<number>} tagIds - Tags to distribute to
   * @returns {Promise<Object>} - Distribution result
   */
  distributeResource,
  
  /**
   * Get CSS class for resource type styling
   * @param {string} type - Resource type
   * @returns {string} - CSS classes for styling
   */
  getResourceTypeColor,
  
  /**
   * Subscribe to resource events
   * @param {string} eventName - Event to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onEvent: (eventName, callback) => {
    if (!events[eventName]) {
      console.warn(`Unknown resource event: ${eventName}`);
      return () => {};
    }
    
    return eventBus.subscribe(events[eventName], callback);
  }
};

// Re-export events for convenience
export { events };