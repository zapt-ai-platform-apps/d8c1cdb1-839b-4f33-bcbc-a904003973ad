import { api } from './api';
import { events } from './events';

// Re-export UI components
export { default as CompanyDetail } from './ui/CompanyDetail';
export { default as CompanyForm } from './ui/CompanyForm';
export { default as CompanyList } from './ui/CompanyList';

// Initialize the companies module
export const initializeCompanies = () => {
  console.log('Companies module initialized');
  return Promise.resolve();
};

export { api, events };