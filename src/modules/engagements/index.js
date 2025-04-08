import { api } from './api';
import { events } from './events';

// Re-export UI components
export { default as EngagementForm } from './components/EngagementForm';
export { default as EngagementList } from './components/EngagementList';

// Initialize the engagements module
export const initializeEngagements = () => {
  console.log('Engagements module initialized');
  return Promise.resolve();
};

export { api, events };