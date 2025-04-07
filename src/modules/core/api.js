import { eventBus, events } from './events';

/**
 * Core module public API
 */
export const api = {
  /**
   * Initialize the core module
   */
  initialize: () => {
    console.log('Core module initialized');
    eventBus.publish(events.APP_INITIALIZED, { timestamp: new Date() });
  },
  
  /**
   * Report an application error
   * @param {Error} error - The error object
   * @param {object} context - Additional context information
   */
  reportError: (error, context = {}) => {
    console.error('Application error:', error);
    eventBus.publish(events.APP_ERROR, { error, context, timestamp: new Date() });
  },
  
  /**
   * Toggle the application sidebar
   * @param {boolean} isOpen - Whether the sidebar should be open
   */
  toggleSidebar: (isOpen) => {
    eventBus.publish(events.UI_SIDEBAR_TOGGLE, { isOpen });
  }
};

// Re-export the event bus and events for other modules to use
export { eventBus, events };