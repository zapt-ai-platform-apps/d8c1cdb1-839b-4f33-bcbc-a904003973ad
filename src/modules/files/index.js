import { api } from './api';
import { events } from './events';

// Re-export UI components
export { default as FileList } from './ui/FileList';
export { default as FileUpload } from './ui/FileUpload';

// Initialize the files module
export const initializeFiles = () => {
  console.log('Files module initialized');
  return Promise.resolve();
};

export { api, events };