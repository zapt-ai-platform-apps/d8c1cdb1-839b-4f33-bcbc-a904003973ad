import { eventBus } from '../../core/events';
import { events } from '../events';
import { validateActivity, validateActivityList } from '../validators';
import * as Sentry from '@sentry/browser';

/**
 * Fetch activities for a company
 */
export const fetchActivities = async (companyId) => {
  try {
    console.log(`Fetching activities for company ${companyId}`);
    
    const response = await fetch(`/api/activities?companyId=${companyId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateActivityList(data, {
      actionName: 'fetchActivities',
      location: 'activities/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'activities'
    });
    
    // Publish event for successful fetch
    eventBus.publish(events.ACTIVITY_LIST_UPDATED, { activities: validatedData, companyId });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching activities:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchActivities',
        companyId
      }
    });
    throw error;
  }
};

/**
 * Create a new activity
 */
export const createActivity = async (activityData) => {
  try {
    // Validate data before sending
    validateActivity(activityData, {
      actionName: 'createActivity',
      location: 'activities/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'activities',
      moduleTo: 'api'
    });
    
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activity: activityData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create activity');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateActivity(data, {
      actionName: 'createActivityResponse',
      location: 'activities/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'activities'
    });
    
    // Publish event for new activity
    eventBus.publish(events.ACTIVITY_CREATED, { activity: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error creating activity:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'createActivity',
        activityData
      }
    });
    throw error;
  }
};

/**
 * Update an existing activity
 */
export const updateActivity = async (activityId, activityData) => {
  try {
    // Validate data before sending
    validateActivity(activityData, {
      actionName: 'updateActivity',
      location: 'activities/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'activities',
      moduleTo: 'api'
    });
    
    const response = await fetch(`/api/activities/${activityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activity: activityData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update activity');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateActivity(data, {
      actionName: 'updateActivityResponse',
      location: 'activities/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'activities'
    });
    
    // Publish event for updated activity
    eventBus.publish(events.ACTIVITY_UPDATED, { activity: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error updating activity:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'updateActivity',
        activityId,
        activityData
      }
    });
    throw error;
  }
};

/**
 * Delete an activity
 */
export const deleteActivity = async (activityId) => {
  try {
    const response = await fetch(`/api/activities/${activityId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete activity');
    }
    
    // Publish event for deleted activity
    eventBus.publish(events.ACTIVITY_DELETED, { activityId });
    
    return true;
  } catch (error) {
    console.error("Error deleting activity:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'deleteActivity',
        activityId
      }
    });
    throw error;
  }
};