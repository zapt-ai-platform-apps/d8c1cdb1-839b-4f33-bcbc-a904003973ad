import { fetchDashboardData, prepareChartData } from './internal/services';

// Public API for dashboard module
export const api = {
  /**
   * Get dashboard data
   * @returns {Promise<Object>} Dashboard data
   */
  getDashboardData: async () => {
    return await fetchDashboardData();
  },
  
  /**
   * Prepare chart data from dashboard data
   * @param {Object} dashboardData - Dashboard data
   * @returns {Object} Prepared chart data
   */
  prepareChartData: (dashboardData) => {
    return prepareChartData(dashboardData);
  }
};