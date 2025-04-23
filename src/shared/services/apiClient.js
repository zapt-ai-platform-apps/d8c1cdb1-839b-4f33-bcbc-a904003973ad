import { supabase } from './supabaseClient';
import * as Sentry from '@sentry/browser';

/**
 * Attempts to get an active session, with retry logic
 * @param {number} retryCount - Number of retries to attempt
 * @returns {Promise<Object>} - The session object
 */
async function getActiveSession(retryCount = 1) {
  let attempts = 0;
  let lastError = null;

  while (attempts < retryCount) {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data?.session) {
        return data.session;
      }
      
      // If we got here, there's no session but also no error
      throw new Error('No active session found');
    } catch (error) {
      lastError = error;
      attempts++;
      
      if (attempts < retryCount) {
        // Wait 500ms before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Retrying session retrieval, attempt ${attempts+1}/${retryCount}`);
      }
    }
  }
  
  // After all retries, throw the last error
  throw new Error(`Authentication required: ${lastError?.message || 'No active session found. Please sign in again.'}`);
}

/**
 * Creates an authenticated fetch request with the proper headers
 * @param {string} url - The API endpoint to call
 * @param {Object} options - Request options (method, body, etc.)
 * @returns {Promise<Response>} - The fetch response
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    const endpoint = url.split('/api/')[1] || url;
    console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
    
    // Get the current session with retry
    const session = await getActiveSession(2);
    
    // Set default headers with Authorization
    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Make the API call with the Authorization header
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle non-200 responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed with status ${response.status}`;
      console.error(`API Response Error: ${response.status} for ${endpoint}`, errorData);
      throw new Error(errorMessage);
    }
    
    console.log(`API Response Success: ${endpoint}`);
    return response;
  } catch (error) {
    // Log the error to Sentry
    Sentry.captureException(error, {
      extra: {
        url,
        method: options.method || 'GET',
        location: 'authenticatedFetch'
      }
    });
    
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Centralized API client with authenticated requests
 */
export const apiClient = {
  /**
   * Make a GET request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} queryParams - Query parameters to include
   * @returns {Promise<any>} - The response data
   */
  async get(endpoint, queryParams = {}) {
    const url = new URL(`/api/${endpoint}`, window.location.origin);
    
    // Add query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    
    const response = await authenticatedFetch(url.toString());
    return response.json();
  },
  
  /**
   * Make a POST request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @returns {Promise<any>} - The response data
   */
  async post(endpoint, data) {
    const response = await authenticatedFetch(`/api/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  /**
   * Make a PUT request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @returns {Promise<any>} - The response data
   */
  async put(endpoint, data) {
    const response = await authenticatedFetch(`/api/${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  /**
   * Make a DELETE request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - Optional request body
   * @returns {Promise<any>} - The response data
   */
  async delete(endpoint, data = null) {
    const options = {
      method: 'DELETE',
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await authenticatedFetch(`/api/${endpoint}`, options);
    return response.json();
  }
};