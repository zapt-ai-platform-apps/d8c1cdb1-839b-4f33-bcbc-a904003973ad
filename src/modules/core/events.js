/**
 * Event names definition for the core module
 */
export const events = {
  // General application events
  APP_INITIALIZED: 'app/initialized',
  APP_ERROR: 'app/error',
  
  // Navigation events
  NAVIGATION_CHANGE: 'navigation/change',
  
  // UI events
  UI_MODAL_OPEN: 'ui/modal/open',
  UI_MODAL_CLOSE: 'ui/modal/close',
  UI_SIDEBAR_TOGGLE: 'ui/sidebar/toggle',
  
  // Authentication events
  USER_SIGNED_IN: 'auth/user/signed-in',
  USER_SIGNED_OUT: 'auth/user/signed-out',
};

/**
 * Event bus for application-wide pub/sub communication
 */
export class EventBus {
  subscribers = {};

  /**
   * Subscribe to an event
   * @param {string} event - Event name to subscribe to
   * @param {function} callback - Function to call when event is published
   * @returns {function} - Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
    
    // Return unsubscribe function
    return () => this.unsubscribe(event, callback);
  }

  /**
   * Publish an event with optional data
   * @param {string} event - Event name to publish
   * @param {any} data - Data to pass to subscribers
   */
  publish(event, data) {
    if (!this.subscribers[event]) return;
    
    this.subscribers[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event subscriber for ${event}:`, error);
      }
    });
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name to unsubscribe from
   * @param {function} callback - Function to unsubscribe
   */
  unsubscribe(event, callback) {
    if (!this.subscribers[event]) return;
    
    this.subscribers[event] = this.subscribers[event]
      .filter(cb => cb !== callback);
  }
}

/**
 * Singleton instance of the EventBus
 */
export const eventBus = new EventBus();