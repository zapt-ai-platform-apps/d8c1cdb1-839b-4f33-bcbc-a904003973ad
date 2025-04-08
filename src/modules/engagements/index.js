import { api } from './api';
import { events } from './events';

// Re-export UI components
export { default as EngagementForm } from './ui/EngagementForm';
export { default as EngagementList } from './ui/EngagementList';

// Initialize the engagements module
export const initializeEngagements = () => {
  console.log('Engagements module initialized');
  return Promise.resolve();
};

export { api, events };