import { 
  fetchCompanies, 
  fetchCompanyById, 
  createCompany, 
  updateCompany, 
  deleteCompany,
  parseCompanyData
} from './internal/services';
import { eventBus } from '../core/events';
import { events } from './events';

/**
 * Companies module public API
 */
export const api = {
  /**
   * Get a list of companies, with optional filtering
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} - List of companies
   */
  getCompanies: fetchCompanies,
  
  /**
   * Get a single company by ID
   * @param {number} id - Company ID
   * @returns {Promise<Object>} - Company details
   */
  getCompanyById: fetchCompanyById,
  
  /**
   * Create a new company
   * @param {Object} companyData - Company data
   * @param {Array<number>} tagIds - Associated tag IDs
   * @returns {Promise<Object>} - Created company
   */
  createCompany,
  
  /**
   * Update an existing company
   * @param {number} id - Company ID
   * @param {Object} companyData - Updated company data
   * @param {Array<number>} tagIds - Associated tag IDs
   * @returns {Promise<Object>} - Updated company
   */
  updateCompany,
  
  /**
   * Delete a company
   * @param {number} id - Company ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteCompany,
  
  /**
   * Parse company data fields
   * @param {Object} company - Company data
   * @returns {Object} - Parsed fields
   */
  parseCompanyData,
  
  /**
   * Subscribe to company events
   * @param {string} eventName - Event to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onEvent: (eventName, callback) => {
    if (!events[eventName]) {
      console.warn(`Unknown company event: ${eventName}`);
      return () => {};
    }
    
    return eventBus.subscribe(events[eventName], callback);
  }
};

// Re-export events for convenience
export { events };