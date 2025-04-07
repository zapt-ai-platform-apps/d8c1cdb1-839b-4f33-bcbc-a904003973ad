import { api } from './api';
import { events } from './events';

// Re-export UI components
export { default as ResourceList } from './ui/ResourceList';
export { default as ResourceForm } from './ui/ResourceForm';
export { default as ResourceDistribution } from './ui/ResourceDistribution';

// Initialize the resources module
export const initializeResources = () => {
  console.log('Resources module initialized');
  return Promise.resolve();
};

export { api, events };