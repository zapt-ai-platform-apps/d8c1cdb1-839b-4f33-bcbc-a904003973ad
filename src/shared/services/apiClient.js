import { supabase } from './supabaseClient';
import * as Sentry from '@sentry/browser';

/**
 * Creates an authenticated fetch request with the proper headers
 * @param {string} url - The API endpoint to call
 * @param {Object} options - Request options (method, body, etc.)
 * @returns {Promise<Response>} - The fetch response
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError || 'No active session');
      throw new Error('No active session found. Please sign in again.');
    }
    
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
      throw new Error(errorMessage);
    }
    
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