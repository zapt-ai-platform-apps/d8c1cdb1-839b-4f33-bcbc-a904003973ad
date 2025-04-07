import { api } from './api';
import { events } from './events';

// Initialize the tags module
export const initializeTags = () => {
  console.log('Tags module initialized');
  return Promise.resolve();
};

export { api, events };