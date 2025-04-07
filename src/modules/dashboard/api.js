import { fetchDashboardData, prepareChartData } from './internal/services';
import { eventBus } from '../core/events';
import { events } from './events';

/**
 * Dashboard module public API
 */
export const api = {
  /**
   * Get dashboard data
   * @returns {Promise<Object>} - Dashboard data
   */
  getDashboardData: fetchDashboardData,
  
  /**
   * Prepare chart data from dashboard data
   * @param {Object} dashboardData - Raw dashboard data
   * @returns {Object} - Prepared chart data
   */
  prepareChartData,
  
  /**
   * Subscribe to dashboard events
   * @param {string} eventName - Event to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onEvent: (eventName, callback) => {
    if (!events[eventName]) {
      console.warn(`Unknown dashboard event: ${eventName}`);
      return () => {};
    }
    
    return eventBus.subscribe(events[eventName], callback);
  }
};

// Re-export events for convenience
export { events };