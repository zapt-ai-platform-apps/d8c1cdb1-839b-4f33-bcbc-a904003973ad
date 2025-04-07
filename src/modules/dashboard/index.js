import { api } from './api';
import { events } from './events';

// Re-export UI components
export { default as Dashboard } from './ui/Dashboard';

// Initialize the dashboard module
export const initializeDashboard = () => {
  console.log('Dashboard module initialized');
  return Promise.resolve();
};

export { api, events };