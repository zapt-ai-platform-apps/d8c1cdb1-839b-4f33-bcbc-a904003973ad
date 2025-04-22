import * as Sentry from '@sentry/browser';

export async function fetchActivitiesForCompany(companyId) {
  try {
    if (!companyId) {
      throw new Error('Company ID is required to fetch activities');
    }
    
    const response = await fetch(`/api/activities?companyId=${companyId}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch activities');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching activities:', error);
    Sentry.captureException(error, {
      extra: { 
        function: 'fetchActivitiesForCompany',
        companyId,
      }
    });
    throw error;
  }
}

export async function createActivity(activityData) {
  try {
    if (!activityData || !activityData.companyId) {
      throw new Error('Company ID is required to create an activity');
    }

    // Ensure companyId is a number
    if (typeof activityData.companyId === 'string') {
      activityData.companyId = Number(activityData.companyId);
      
      if (isNaN(activityData.companyId)) {
        throw new Error('Invalid company ID format');
      }
    }
    
    console.log(`Creating activity for company ID: ${activityData.companyId}`);
    
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ activity: activityData }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create activity');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating activity:', error);
    Sentry.captureException(error, {
      extra: { 
        function: 'createActivity',
        activityData
      }
    });
    throw error;
  }
}

export async function updateActivity(activityId, activityData) {
  try {
    if (!activityId) {
      throw new Error('Activity ID is required to update an activity');
    }
    
    const response = await fetch(`/api/activities/${activityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ activity: activityData }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update activity');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating activity:', error);
    Sentry.captureException(error, {
      extra: { 
        function: 'updateActivity',
        activityId,
        activityData
      }
    });
    throw error;
  }
}

export async function deleteActivity(activityId) {
  try {
    if (!activityId) {
      throw new Error('Activity ID is required to delete an activity');
    }
    
    const response = await fetch(`/api/activities/${activityId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete activity');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting activity:', error);
    Sentry.captureException(error, {
      extra: { 
        function: 'deleteActivity',
        activityId
      }
    });
    throw error;
  }
}