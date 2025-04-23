import { api } from '../api';
import { eventBus } from '@/modules/core/events';
import { events } from '../events';
import * as Sentry from '@sentry/browser';

export async function loadEngagements(companyId) {
  try {
    console.log('Loading engagements for company:', companyId);
    return await api.getEngagements(companyId);
  } catch (error) {
    console.error('Failed to load engagements:', error);
    Sentry.captureException(error, {
      extra: { companyId, location: 'loadEngagements' }
    });
    throw error;
  }
}

export async function createEngagement(engagement, followUps) {
  try {
    const result = await api.createEngagement(engagement, followUps);
    
    // Publish event so other modules can react
    eventBus.publish(events.ENGAGEMENT_CREATED, { 
      engagement: result,
      companyId: engagement.companyId
    });
    
    return result;
  } catch (error) {
    console.error('Failed to create engagement:', error);
    Sentry.captureException(error, {
      extra: { 
        engagement, 
        followUps,
        location: 'createEngagement' 
      }
    });
    throw error;
  }
}

export async function updateEngagement(id, engagement) {
  try {
    const result = await api.updateEngagement(id, engagement);
    
    eventBus.publish(events.ENGAGEMENT_UPDATED, { 
      engagement: result,
      id
    });
    
    return result;
  } catch (error) {
    console.error('Failed to update engagement:', error);
    Sentry.captureException(error, {
      extra: { 
        id,
        engagement,
        location: 'updateEngagement' 
      }
    });
    throw error;
  }
}