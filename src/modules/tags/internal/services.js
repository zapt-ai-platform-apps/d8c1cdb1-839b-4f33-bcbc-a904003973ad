import { eventBus } from '../../core/events';
import { events } from '../events';
import { validateTag, validateTagList } from '../validators';
import * as Sentry from '@sentry/browser';

/**
 * Fetch all tags, optionally filtered by type
 */
export const fetchTags = async (type = null) => {
  try {
    console.log("Fetching tags...");
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (type) {
      queryParams.append('type', type);
    }
    
    const response = await fetch(`/api/tags?${queryParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }
    
    const data = await response.json();
    console.log("Tags data received:", data);
    
    // Validate response data - with updated schema that handles string->number and string->date conversion
    const validatedData = validateTagList(data, {
      actionName: 'fetchTags',
      location: 'tags/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'tags'
    });
    
    // Publish event for successful fetch
    eventBus.publish(events.TAG_LIST_UPDATED, { tags: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching tags:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchTags',
        type,
        message: error.message,
        stack: error.stack
      }
    });
    throw error;
  }
};

/**
 * Create a new tag
 */
export const createTag = async (tagData) => {
  try {
    // Validate data before sending
    validateTag(tagData, {
      actionName: 'createTag',
      location: 'tags/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'tags',
      moduleTo: 'api'
    });
    
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag: tagData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create tag');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateTag(data, {
      actionName: 'createTagResponse',
      location: 'tags/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'tags'
    });
    
    // Publish event for new tag
    eventBus.publish(events.TAG_CREATED, { tag: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error creating tag:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'createTag',
        tagData,
        message: error.message,
        stack: error.stack
      }
    });
    throw error;
  }
};