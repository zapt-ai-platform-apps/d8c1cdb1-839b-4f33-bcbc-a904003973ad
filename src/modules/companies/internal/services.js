import { supabase } from '@/shared/services/supabaseClient';
import * as Sentry from '@sentry/browser';
import { safeStringId, safeStringIds } from './utilities';

export async function fetchCompanyById(id) {
  try {
    const safeId = safeStringId(id);
    console.log(`Fetching company with ID: ${safeId}`);
    
    const response = await fetch(`/api/companies/${safeId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Check if response is HTML instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML response instead of JSON', { contentType });
      throw new Error('Invalid response format: expected JSON, received HTML');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch company:', errorText);
      throw new Error(`Failed to fetch company: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Company data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching company:', error);
    Sentry.captureException(error, {
      extra: { id, action: 'fetchCompanyById' }
    });
    throw error;
  }
}

/**
 * Parse company data fields that might be stored as strings but represent structured data
 * @param {Object} company - Company data
 * @returns {Object} - Company with parsed fields
 */
export function parseCompanyData(company) {
  if (!company) return null;
  
  const parsedCompany = { ...company };
  
  // Helper function to safely parse potential JSON strings or handle different formats
  const safeParseStringField = (field) => {
    if (!parsedCompany[field]) return [];
    
    // If it's already an array, return it as is
    if (Array.isArray(parsedCompany[field])) return parsedCompany[field];
    
    // If it's not a string (but also not an array), return empty array
    if (typeof parsedCompany[field] !== 'string') return [];
    
    // If it's the literal string "[object Object]", return empty array as this is invalid
    if (parsedCompany[field] === "[object Object]") return [];
    
    try {
      // Check if it looks like JSON (starts with [ or {)
      if (parsedCompany[field].trim().startsWith('[') || parsedCompany[field].trim().startsWith('{')) {
        return JSON.parse(parsedCompany[field]);
      } else {
        // Fallback to comma-separated format
        return parsedCompany[field]
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);
      }
    } catch (error) {
      console.error(`Error parsing ${field} field:`, error, `Value: "${parsedCompany[field]}"`);
      Sentry.captureException(error, {
        extra: { field, value: parsedCompany[field], action: 'parseCompanyData' }
      });
      // Fallback to comma-separated format even if JSON parsing fails
      return parsedCompany[field].split(',').map(item => item.trim()).filter(Boolean);
    }
  };
  
  // Fields that might contain arrays as strings
  const arrayFields = ['resourcesSent', 'aiToolsDelivered', 'additionalSignUps'];
  
  // Parse each field
  arrayFields.forEach(field => {
    parsedCompany[field] = safeParseStringField(field);
  });
  
  return parsedCompany;
}

// Other service functions remain the same
export async function fetchCompanies() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/companies', {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching companies:', error);
    Sentry.captureException(error, {
      extra: { action: 'fetchCompanies' }
    });
    throw error;
  }
}

/**
 * Prepare company data for sending to API
 * Ensures consistent handling of array fields by converting them to JSON strings
 */
export function prepareCompanyDataForAPI(companyData) {
  const preparedData = { ...companyData };
  
  // Fields that might be arrays and need to be serialized
  const arrayFields = ['resourcesSent', 'aiToolsDelivered', 'additionalSignUps'];
  
  // Convert arrays to JSON strings for storage
  arrayFields.forEach(field => {
    if (Array.isArray(preparedData[field])) {
      preparedData[field] = JSON.stringify(preparedData[field]);
    }
    // Handle react-select format (array of objects with value/label)
    else if (Array.isArray(preparedData[field]) && preparedData[field].length > 0 && preparedData[field][0]?.value) {
      preparedData[field] = JSON.stringify(preparedData[field].map(item => item.value || item));
    }
  });
  
  return preparedData;
}

export async function createCompany(companyData, selectedTagIds) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Ensure proper serialization of array data
    const preparedData = prepareCompanyDataForAPI(companyData);
    
    // Make sure tag IDs are safely handled
    const safeTagIds = safeStringIds(selectedTagIds);
    
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company: preparedData,
        tagIds: safeTagIds,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create company: ${response.status} ${response.statusText || errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating company:', error);
    Sentry.captureException(error, {
      extra: { company: companyData, tags: selectedTagIds, action: 'createCompany' }
    });
    throw error;
  }
}

export async function updateCompany(id, companyData, selectedTagIds) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Use safeStringId to ensure the ID doesn't lose precision
    const safeId = safeStringId(id);
    console.log(`Updating company with ID: ${safeId}`);
    
    // Ensure proper serialization of array data
    const preparedData = prepareCompanyDataForAPI(companyData);
    
    // Make sure tag IDs are safely handled
    const safeTagIds = safeStringIds(selectedTagIds);
    
    const response = await fetch(`/api/companies/${safeId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        company: preparedData,
        tagIds: safeTagIds,
      }),
    });
    
    // Log the response status and headers for debugging
    console.log(`Update response status: ${response.status}`, {
      headers: {
        contentType: response.headers.get('content-type'),
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Update failed with status ${response.status}:`, errorText);
      throw new Error(`Failed to update company: ${response.status} ${response.statusText || errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating company:', error);
    Sentry.captureException(error, {
      extra: { id, safeId: safeStringId(id), company: companyData, tags: selectedTagIds, action: 'updateCompany' }
    });
    throw error;
  }
}

export async function deleteCompany(id) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Use safeStringId to ensure the ID doesn't lose precision
    const safeId = safeStringId(id);
    
    const response = await fetch(`/api/companies/${safeId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete company: ${response.status} ${response.statusText || errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting company:', error);
    Sentry.captureException(error, {
      extra: { id, safeId: safeStringId(id), action: 'deleteCompany' }
    });
    throw error;
  }
}