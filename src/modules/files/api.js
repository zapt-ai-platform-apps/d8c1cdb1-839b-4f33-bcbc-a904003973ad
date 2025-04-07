import { 
  fetchFiles, 
  createFile, 
  deleteFile,
  getFileIconType
} from './internal/services';
import { eventBus } from '../core/events';
import { events } from './events';

/**
 * Files module public API
 */
export const api = {
  /**
   * Get files for a company
   * @param {number} companyId - Company ID
   * @returns {Promise<Array>} - List of files
   */
  getFiles: fetchFiles,
  
  /**
   * Create a new file or link
   * @param {Object} fileData - File data
   * @returns {Promise<Object>} - Created file
   */
  createFile,
  
  /**
   * Delete a file
   * @param {number} fileId - File ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteFile,
  
  /**
   * Get icon type based on file type
   * @param {string} type - File type
   * @returns {string} - Icon type identifier
   */
  getFileIconType,
  
  /**
   * Subscribe to file events
   * @param {string} eventName - Event to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onEvent: (eventName, callback) => {
    if (!events[eventName]) {
      console.warn(`Unknown file event: ${eventName}`);
      return () => {};
    }
    
    return eventBus.subscribe(events[eventName], callback);
  }
};

// Re-export events for convenience
export { events };