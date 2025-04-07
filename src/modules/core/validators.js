import { z } from 'zod';
import * as Sentry from '@sentry/browser';

/**
 * Creates a validator function for the given schema
 * @param {z.ZodType} schema - Zod schema to validate against
 * @param {string} contextName - Name of what's being validated (e.g., 'User', 'Order')
 * @returns {function} - Enhanced validator function with additional context options
 */
export const createValidator = (schema, contextName) => {
  /**
   * Validates data against the schema
   * @param {any} data - Data to validate
   * @param {Object} options - Additional validation context
   * @param {string} options.actionName - The specific action/event (e.g., 'login', 'createOrder')
   * @param {string} options.location - Where in the code this validation is happening
   * @param {string} options.direction - 'incoming' or 'outgoing' data
   * @param {string} options.moduleFrom - Source module (if crossing boundaries)
   * @param {string} options.moduleTo - Target module (if crossing boundaries)
   * @returns {any} - The validated data
   */
  return (data, options = {}) => {
    const {
      actionName = 'unknown',
      location = 'unknown',
      direction = 'unknown',
      moduleFrom = 'unknown',
      moduleTo = 'unknown'
    } = options;
    
    try {
      return schema.parse(data);
    } catch (error) {
      // Create full context for error reporting
      const validationContext = {
        type: contextName,
        action: actionName,
        location,
        direction,
        flow: `${moduleFrom} → ${moduleTo}`,
        timestamp: new Date().toISOString()
      };
      
      // Safe version of data for logging
      const safeData = typeof data === 'object' ? 
        JSON.stringify(data, (key, value) => 
          ['password', 'token', 'secret'].includes(key) ? '[REDACTED]' : value
        ) : String(data);
        
      // Format validation errors
      const formattedErrors = error.errors?.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n') || error.message;
      
      // Create descriptive error message with full context
      const errorMessage = `Validation failed in ${validationContext.action} (${validationContext.flow})\n` +
                          `Context: ${contextName} (${direction})\n` +
                          `Location: ${location}\n` +
                          `Errors:\n${formattedErrors}`;
      
      // Log to console with detailed info
      console.error(errorMessage, '\nReceived:', safeData);
      
      // Send to Sentry with full context
      Sentry.captureException(error, {
        extra: {
          ...validationContext,
          receivedData: safeData,
          validationErrors: formattedErrors
        },
        tags: {
          validationType: contextName,
          validationAction: actionName,
          validationDirection: direction,
          moduleFlow: `${moduleFrom}-to-${moduleTo}`
        }
      });
      
      // Throw with improved message
      throw new Error(errorMessage);
    }
  };
};