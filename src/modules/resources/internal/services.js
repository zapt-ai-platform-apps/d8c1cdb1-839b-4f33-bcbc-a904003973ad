import { eventBus } from '../../core/events';
import { events } from '../events';
import { 
  validateResource, 
  validateResourceList, 
  validateDistribution 
} from '../validators';
import * as Sentry from '@sentry/browser';

/**
 * Fetch all resources
 */
export const fetchResources = async () => {
  try {
    console.log("Fetching resources...");
    
    const response = await fetch('/api/resources');
    
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateResourceList(data, {
      actionName: 'fetchResources',
      location: 'resources/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'resources'
    });
    
    // Publish event for successful fetch
    eventBus.publish(events.RESOURCE_LIST_UPDATED, { resources: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching resources:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchResources'
      }
    });
    throw error;
  }
};

/**
 * Fetch a single resource by ID
 */
export const fetchResourceById = async (id) => {
  try {
    console.log(`Fetching resource data for ID: ${id}`);
    
    const response = await fetch(`/api/resources/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch resource data');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateResource(data, {
      actionName: 'fetchResourceById',
      location: 'resources/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'resources'
    });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching resource:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchResourceById',
        resourceId: id
      }
    });
    throw error;
  }
};

/**
 * Create a new resource
 */
export const createResource = async (resourceData) => {
  try {
    // Process URL if needed - only if it's not an uploaded file URL
    let url = resourceData.link;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const processedData = {
      ...resourceData,
      link: url
    };
    
    // Validate data before sending
    validateResource(processedData, {
      actionName: 'createResource',
      location: 'resources/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'resources',
      moduleTo: 'api'
    });
    
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resource: processedData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create resource');
    }
    
    const data = await response.json();
    
    // Show what we received for debugging
    console.log('Resource creation response:', data);
    
    // Validate response data
    const validatedData = validateResource(data, {
      actionName: 'createResourceResponse',
      location: 'resources/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'resources'
    });
    
    // Publish event for new resource
    eventBus.publish(events.RESOURCE_CREATED, { resource: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error creating resource:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'createResource',
        resourceData
      }
    });
    throw error;
  }
};

/**
 * Update an existing resource
 */
export const updateResource = async (id, resourceData) => {
  try {
    // Process URL if needed - only if it's not an uploaded file URL
    let url = resourceData.link;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const processedData = {
      ...resourceData,
      link: url
    };
    
    // Validate data before sending
    validateResource(processedData, {
      actionName: 'updateResource',
      location: 'resources/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'resources',
      moduleTo: 'api'
    });
    
    const response = await fetch(`/api/resources/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resource: processedData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update resource');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateResource(data, {
      actionName: 'updateResourceResponse',
      location: 'resources/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'resources'
    });
    
    // Publish event for updated resource
    eventBus.publish(events.RESOURCE_UPDATED, { resource: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error updating resource:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'updateResource',
        resourceId: id,
        resourceData
      }
    });
    throw error;
  }
};

/**
 * Distribute a resource to selected companies or tags
 */
export const distributeResource = async (resourceId, companyIds = [], tagIds = []) => {
  try {
    const distributionData = {
      resourceId,
      companyIds,
      tagIds
    };
    
    // Validate data before sending
    validateDistribution(distributionData, {
      actionName: 'distributeResource',
      location: 'resources/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'resources',
      moduleTo: 'api'
    });
    
    const response = await fetch('/api/resources/distribute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(distributionData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to distribute resource');
    }
    
    const data = await response.json();
    
    // Publish event for distribution
    eventBus.publish(events.RESOURCE_DISTRIBUTED, { 
      resourceId,
      companyIds,
      tagIds,
      result: data
    });
    
    return data;
  } catch (error) {
    console.error("Error distributing resource:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'distributeResource',
        resourceId,
        companyIds,
        tagIds
      }
    });
    throw error;
  }
};

/**
 * Get resource type color class
 */
export const getResourceTypeColor = (type) => {
  switch (type) {
    case 'Slide Deck':
      return 'bg-blue-100 text-blue-800';
    case 'Guide':
      return 'bg-green-100 text-green-800';
    case 'Video':
      return 'bg-purple-100 text-purple-800';
    case 'Newsletter':
      return 'bg-yellow-100 text-yellow-800';
    case 'Course Link':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};