import { eventBus } from '../../core/events';
import { events } from '../events';
import { 
  validateEngagement, 
  validateEngagementList, 
  validateFollowUp 
} from '../validators';
import * as Sentry from '@sentry/browser';

/**
 * Helper to parse JSON strings with fallback
 */
export const parseJsonSafely = (jsonString, defaultValue = []) => {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    Sentry.captureException(error, {
      extra: {
        action: 'parseJsonSafely',
        jsonString
      }
    });
    
    // For arrays, try fallback to comma-separated values
    if (Array.isArray(defaultValue)) {
      return jsonString.split(',').map(item => item.trim());
    }
    
    return defaultValue;
  }
};

/**
 * Fetch engagements for a company
 */
export const fetchEngagements = async (companyId) => {
  try {
    console.log(`Fetching engagements for company ${companyId}`);
    
    const response = await fetch(`/api/engagements?companyId=${companyId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch engagements');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateEngagementList(data, {
      actionName: 'fetchEngagements',
      location: 'engagements/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'engagements'
    });
    
    // Publish event for successful fetch
    eventBus.publish(events.ENGAGEMENT_LIST_UPDATED, { engagements: validatedData, companyId });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching engagements:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchEngagements',
        companyId
      }
    });
    throw error;
  }
};

/**
 * Fetch a single engagement with its follow-ups
 */
export const fetchEngagementById = async (engagementId) => {
  try {
    console.log(`Fetching engagement details for ID ${engagementId}`);
    
    const response = await fetch(`/api/engagements/${engagementId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch engagement details');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateEngagement(data, {
      actionName: 'fetchEngagementById',
      location: 'engagements/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'engagements'
    });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching engagement details:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchEngagementById',
        engagementId
      }
    });
    throw error;
  }
};

/**
 * Create a new engagement with optional follow-ups
 */
export const createEngagement = async (engagementData, followUps = []) => {
  try {
    // Prepare data for API: Convert date and AI tools
    const preparedData = {
      ...engagementData,
      dateOfContact: engagementData.dateOfContact instanceof Date 
        ? engagementData.dateOfContact.toISOString().split('T')[0] 
        : engagementData.dateOfContact,
      aiTrainingDelivered: Array.isArray(engagementData.aiTrainingDelivered) 
        ? JSON.stringify(engagementData.aiTrainingDelivered) 
        : engagementData.aiTrainingDelivered
    };
    
    // Validate data before sending
    validateEngagement({
      ...preparedData,
      followUps: [] // Exclude follow-ups from initial validation
    }, {
      actionName: 'createEngagement',
      location: 'engagements/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'engagements',
      moduleTo: 'api'
    });
    
    // Prepare follow-ups
    const preparedFollowUps = followUps.map(followUp => ({
      ...followUp,
      dueDate: followUp.dueDate instanceof Date 
        ? followUp.dueDate.toISOString().split('T')[0] 
        : followUp.dueDate
    }));
    
    // Validate each follow-up
    preparedFollowUps.forEach(followUp => {
      validateFollowUp(followUp, {
        actionName: 'createEngagementFollowUp',
        location: 'engagements/internal/services.js',
        direction: 'outgoing',
        moduleFrom: 'engagements',
        moduleTo: 'api'
      });
    });
    
    const response = await fetch('/api/engagements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        engagement: preparedData,
        followUps: preparedFollowUps
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create engagement');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateEngagement(data, {
      actionName: 'createEngagementResponse',
      location: 'engagements/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'engagements'
    });
    
    // Publish event for new engagement
    eventBus.publish(events.ENGAGEMENT_CREATED, { engagement: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error creating engagement:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'createEngagement',
        engagementData,
        followUps
      }
    });
    throw error;
  }
};

/**
 * Update an existing engagement with its follow-ups
 */
export const updateEngagement = async (engagementId, engagementData, followUps = []) => {
  try {
    // Prepare data for API: Convert date and AI tools
    const preparedData = {
      ...engagementData,
      dateOfContact: engagementData.dateOfContact instanceof Date 
        ? engagementData.dateOfContact.toISOString().split('T')[0] 
        : engagementData.dateOfContact,
      aiTrainingDelivered: Array.isArray(engagementData.aiTrainingDelivered) 
        ? JSON.stringify(engagementData.aiTrainingDelivered) 
        : engagementData.aiTrainingDelivered
    };
    
    // Validate data before sending
    validateEngagement({
      ...preparedData,
      followUps: [] // Exclude follow-ups from initial validation
    }, {
      actionName: 'updateEngagement',
      location: 'engagements/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'engagements',
      moduleTo: 'api'
    });
    
    // Prepare follow-ups
    const preparedFollowUps = followUps.map(followUp => ({
      ...followUp,
      dueDate: followUp.dueDate instanceof Date 
        ? followUp.dueDate.toISOString().split('T')[0] 
        : followUp.dueDate
    }));
    
    // Validate each follow-up
    preparedFollowUps.forEach(followUp => {
      validateFollowUp(followUp, {
        actionName: 'updateEngagementFollowUp',
        location: 'engagements/internal/services.js',
        direction: 'outgoing',
        moduleFrom: 'engagements',
        moduleTo: 'api'
      });
    });
    
    const response = await fetch(`/api/engagements/${engagementId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        engagement: preparedData,
        followUps: preparedFollowUps
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update engagement');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateEngagement(data, {
      actionName: 'updateEngagementResponse',
      location: 'engagements/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'engagements'
    });
    
    // Publish event for updated engagement
    eventBus.publish(events.ENGAGEMENT_UPDATED, { engagement: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error updating engagement:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'updateEngagement',
        engagementId,
        engagementData,
        followUps
      }
    });
    throw error;
  }
};

/**
 * Delete an engagement
 */
export const deleteEngagement = async (engagementId) => {
  try {
    const response = await fetch(`/api/engagements/${engagementId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete engagement');
    }
    
    // Publish event for deleted engagement
    eventBus.publish(events.ENGAGEMENT_DELETED, { engagementId });
    
    return true;
  } catch (error) {
    console.error("Error deleting engagement:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'deleteEngagement',
        engagementId
      }
    });
    throw error;
  }
};

/**
 * Get AI tools from JSON string
 */
export const getAITools = (aiToolsStr) => {
  if (!aiToolsStr) return [];
  return parseJsonSafely(aiToolsStr, []);
};