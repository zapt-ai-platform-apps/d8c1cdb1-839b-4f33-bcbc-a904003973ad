import { eventBus } from '../../core/events';
import { events } from '../events';
import { validateFile, validateFileList } from '../validators';
import * as Sentry from '@sentry/browser';

/**
 * Fetch files for a company
 */
export const fetchFiles = async (companyId) => {
  try {
    console.log(`Fetching files for company ${companyId}`);
    
    const response = await fetch(`/api/files?companyId=${companyId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateFileList(data, {
      actionName: 'fetchFiles',
      location: 'files/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'files'
    });
    
    // Publish event for successful fetch
    eventBus.publish(events.FILE_LIST_UPDATED, { files: validatedData, companyId });
    
    return validatedData;
  } catch (error) {
    console.error("Error fetching files:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'fetchFiles',
        companyId
      }
    });
    throw error;
  }
};

/**
 * Create a new file/link
 */
export const createFile = async (fileData) => {
  try {
    // Process URL if needed
    let url = fileData.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const processedData = {
      ...fileData,
      url
    };
    
    // Validate data before sending
    validateFile(processedData, {
      actionName: 'createFile',
      location: 'files/internal/services.js',
      direction: 'outgoing',
      moduleFrom: 'files',
      moduleTo: 'api'
    });
    
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: processedData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to add file/link');
    }
    
    const data = await response.json();
    
    // Validate response data
    const validatedData = validateFile(data, {
      actionName: 'createFileResponse',
      location: 'files/internal/services.js',
      direction: 'incoming',
      moduleFrom: 'api',
      moduleTo: 'files'
    });
    
    // Publish event for new file
    eventBus.publish(events.FILE_CREATED, { file: validatedData });
    
    return validatedData;
  } catch (error) {
    console.error("Error creating file:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'createFile',
        fileData
      }
    });
    throw error;
  }
};

/**
 * Delete a file
 */
export const deleteFile = async (fileId) => {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
    
    // Publish event for deleted file
    eventBus.publish(events.FILE_DELETED, { fileId });
    
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    Sentry.captureException(error, {
      extra: {
        action: 'deleteFile',
        fileId
      }
    });
    throw error;
  }
};

/**
 * Get file icon based on type
 */
export const getFileIconType = (type) => {
  if (!type) return 'document';
  
  const lowerType = type.toLowerCase();
  if (lowerType.includes('pdf')) return 'pdf';
  if (lowerType.includes('image') || lowerType.includes('photo')) return 'image';
  if (lowerType.includes('link')) return 'link';
  return 'document';
};