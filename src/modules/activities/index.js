import { api } from './api';
import { events } from './events';

// Re-export UI components
export { default as ActivityForm } from './ui/ActivityForm';
export { default as ActivityList } from './ui/ActivityList';

// Initialize the activities module
export const initializeActivities = () => {
  console.log('Activities module initialized');
  return Promise.resolve();
};

export { api, events };