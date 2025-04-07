import { api } from './api';
import { eventBus, events } from './events';

// Re-export UI components
export { default as Layout } from './ui/Layout';
export { default as LoadingSpinner } from './ui/LoadingSpinner';
export { default as NotFound } from './ui/NotFound';
export { default as PageHeader } from './ui/PageHeader';
export { default as ZaptBadge } from './ui/ZaptBadge';

// Initialize the core module
export const initializeCore = () => {
  api.initialize();
  return Promise.resolve();
};

export { api, eventBus, events };