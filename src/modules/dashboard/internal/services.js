import { eventBus } from '../../core/events';
import { events } from '../events';
import { validateDashboardData } from '../validators';
import * as Sentry from '@sentry/browser';

/**
 * Fetch dashboard data
 */
export const fetchDashboardData = async () => {
  try {
    console.log("Fetching dashboard data...");
    
    const response = await fetch('/api/dashboard');
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateDashboardData(data, {
      actionName: 'fetchDashboardData',
      location: 'dashboard/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'dashboard'
    });
    
    // Publish event for successful fetch
    eventBus.publish(events.DASHBOARD_DATA_UPDATED, { data: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchDashboardData'
      }
    });
    throw error;
  }
};

/**
 * Prepare chart data for dashboard
 */
export const prepareChartData = (dashboardData) => {
  // Engagement status chart
  const statusData = {
    labels: dashboardData.engagementStatusCounts.map(item => item.status || 'Undefined'),
    datasets: [
      {
        data: dashboardData.engagementStatusCounts.map(item => item.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  return {
    statusData
  };
};