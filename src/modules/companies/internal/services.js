import { supabase } from '@/shared/services/supabaseClient';
import * as Sentry from '@sentry/browser';

export async function fetchCompanyById(id) {
  try {
    console.log(`Fetching company with ID: ${id}`);
    
    const response = await fetch(`/api/companies/${id}`, {
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
  
  // Helper function to safely parse potential JSON strings
  const safeParseStringField = (field) => {
    if (!parsedCompany[field]) return [];
    
    if (typeof parsedCompany[field] !== 'string') return parsedCompany[field];
    
    try {
      // Check if it looks like JSON
      if (parsedCompany[field].trim().startsWith('[')) {
        return JSON.parse(parsedCompany[field]);
      } else {
        // Fallback to comma-separated format
        return parsedCompany[field]
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);
      }
    } catch (error) {
      console.error(`Error parsing ${field} field:`, error);
      Sentry.captureException(error, {
        extra: { field, value: parsedCompany[field], action: 'parseCompanyData' }
      });
      return [];
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

export async function createCompany(companyData, selectedTagIds) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company: companyData,
        tagIds: selectedTagIds,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create company: ${response.statusText}`);
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
    const response = await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        company: companyData,
        tagIds: selectedTagIds,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update company: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating company:', error);
    Sentry.captureException(error, {
      extra: { id, company: companyData, tags: selectedTagIds, action: 'updateCompany' }
    });
    throw error;
  }
}

export async function deleteCompany(id) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`/api/companies/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete company: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting company:', error);
    Sentry.captureException(error, {
      extra: { id, action: 'deleteCompany' }
    });
    throw error;
  }
}