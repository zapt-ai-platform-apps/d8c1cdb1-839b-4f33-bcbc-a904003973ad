import { eventBus } from '../../core/events';
import { events } from '../events';
import { 
  validateCompany, 
  validateCompanyList, 
  validateCompanyDetail 
} from '../validators';
import * as Sentry from '@sentry/browser';

// Helper to parse JSON strings with fallback
export const parseJsonSafely = (jsonString, defaultValue = []) => {
  if (!jsonString) return defaultValue;
  
  try {
    // If it's already an array, return it
    if (Array.isArray(jsonString)) return jsonString;
    
    // If it's a string that looks like JSON (starts with [ or {), try to parse it
    if (typeof jsonString === 'string' && (jsonString.trim().startsWith('[') || jsonString.trim().startsWith('{'))) {
      return JSON.parse(jsonString);
    }
    
    // If it's a comma-separated string, split it
    if (typeof jsonString === 'string' && jsonString.includes(',')) {
      return jsonString.split(',').map(item => item.trim()).filter(Boolean);
    }
    
    // If it's a single value, return it as an array item
    if (typeof jsonString === 'string' && jsonString.trim()) {
      return [jsonString.trim()];
    }
    
    // Fallback for any other case
    return defaultValue;
  } catch (error) {
    console.error('Error parsing JSON:', error, { jsonString });
    Sentry.captureException(error, {
      extra: {
        action: 'parseJsonSafely',
        jsonString
      }
    });
    
    // Fallback to comma-separated values if parsing failed
    if (typeof jsonString === 'string') {
      return jsonString.split(',').map(item => item.trim()).filter(Boolean);
    }
    
    return defaultValue;
  }
};

/**
 * Fetch all companies, with optional filtering
 */
export const fetchCompanies = async (filters = {}) => {
  try {
    console.log("Fetching companies with filters:", filters);
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (filters.search) {
      queryParams.append('search', filters.search);
    }
    
    if (filters.tagIds && filters.tagIds.length > 0) {
      queryParams.append('tagIds', filters.tagIds.join(','));
    }
    
    if (filters.sectorFilter) {
      queryParams.append('sectorFilter', filters.sectorFilter);
    }
    
    if (filters.industryFilter) {
      queryParams.append('industryFilter', filters.industryFilter);
    }
    
    if (filters.locationFilter) {
      queryParams.append('locationFilter', filters.locationFilter);
    }
    
    const response = await fetch(`/api/companies?${queryParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch companies');
    }
    
    const data = await response.json();
    console.log("Companies data received:", data.length, "companies");
    
    // Validate response data
    const validatedData = validateCompanyList(data, {
      actionName: 'fetchCompanies',
      location: 'companies/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'companies'
    });
    
    // Publish event for successful fetch
    eventBus.publish(events.COMPANY_LIST_UPDATED, { companies: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching companies:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchCompanies',
        filters
      }
    });
    throw error;
  }
};

/**
 * Fetch a single company by ID
 */
export const fetchCompanyById = async (id) => {
  try {
    console.log(`Fetching company data for ID: ${id}`);
    
    const response = await fetch(`/api/companies/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch company data');
    }
    
    const data = await response.json();
    console.log(`Company data received for ID ${id}:`, data);
    
    // Validate response data
    const validatedData = validateCompanyDetail(data, {
      actionName: 'fetchCompanyById',
      location: 'companies/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'companies'
    });
    
    // Publish event for selected company
    eventBus.publish(events.COMPANY_SELECTED, { company: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching company:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchCompanyById',
        companyId: id
      }
    });
    throw error;
  }
};

/**
 * Create a new company
 */
export const createCompany = async (companyData, tagIds = []) => {
  try {
    // Prepare data for API: Convert multi-select values to JSON strings
    const preparedData = {
      ...companyData,
      aiToolsDelivered: Array.isArray(companyData.aiToolsDelivered) 
        ? JSON.stringify(companyData.aiToolsDelivered.map(tool => tool.value)) 
        : null,
      additionalSignUps: Array.isArray(companyData.additionalSignUps) 
        ? JSON.stringify(companyData.additionalSignUps.map(signup => signup.value)) 
        : null,
      resourcesSent: Array.isArray(companyData.resourcesSent) 
        ? JSON.stringify(companyData.resourcesSent) 
        : null
    };
    
    // Validate data before sending
    validateCompany(preparedData, {
      actionName: 'createCompany',
      location: 'companies/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'companies',
      moduleTo: 'api'
    });
    
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company: preparedData,
        tagIds
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create company');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateCompany(data, {
      actionName: 'createCompanyResponse',
      location: 'companies/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'companies'
    });
    
    // Publish event for new company
    eventBus.publish(events.COMPANY_CREATED, { company: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error creating company:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'createCompany',
        companyData,
        tagIds
      }
    });
    throw error;
  }
};

/**
 * Update an existing company
 */
export const updateCompany = async (id, companyData, tagIds = []) => {
  try {
    // Prepare data for API: Convert multi-select values to JSON strings
    const preparedData = {
      ...companyData,
      aiToolsDelivered: Array.isArray(companyData.aiToolsDelivered) 
        ? JSON.stringify(companyData.aiToolsDelivered.map(tool => tool.value)) 
        : null,
      additionalSignUps: Array.isArray(companyData.additionalSignUps) 
        ? JSON.stringify(companyData.additionalSignUps.map(signup => signup.value)) 
        : null,
      resourcesSent: Array.isArray(companyData.resourcesSent) 
        ? JSON.stringify(companyData.resourcesSent) 
        : null
    };
    
    // Validate data before sending
    validateCompany(preparedData, {
      actionName: 'updateCompany',
      location: 'companies/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'companies',
      moduleTo: 'api'
    });
    
    const response = await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company: preparedData,
        tagIds
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update company');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateCompany(data, {
      actionName: 'updateCompanyResponse',
      location: 'companies/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'companies'
    });
    
    // Publish event for updated company
    eventBus.publish(events.COMPANY_UPDATED, { company: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error updating company:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'updateCompany',
        companyId: id,
        companyData,
        tagIds
      }
    });
    throw error;
  }
};

/**
 * Delete a company
 */
export const deleteCompany = async (id) => {
  try {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete company');
    }
    
    // Publish event for deleted company
    eventBus.publish(events.COMPANY_DELETED, { companyId: id });
    
    return true;
  } catch (error) {
    console.error("Error deleting company:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'deleteCompany',
        companyId: id
      }
    });
    throw error;
  }
};

/**
 * Parse company data for display
 */
export const parseCompanyData = (company) => {
  if (!company) return { aiTools: [], signUps: [], resources: [] };
  
  let aiTools = parseJsonSafely(company.aiToolsDelivered, []);
  let signUps = parseJsonSafely(company.additionalSignUps, []);
  let resources = parseJsonSafely(company.resourcesSent, []);
  
  return { aiTools, signUps, resources };
};