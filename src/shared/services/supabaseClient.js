import { initializeZapt } from '@zapt/zapt-js';
import * as Sentry from '@sentry/browser';

// Initialize Zapt and get Supabase client
export const { supabase, recordLogin } = initializeZapt(import.meta.env.VITE_PUBLIC_APP_ID);

// Initialize session tracking
let hasRecordedLogin = false;
let currentSession = null;

/**
 * Updates the current cached session and records login if needed
 * @param {Object} session - The new session object
 */
async function updateSessionState(session) {
  currentSession = session;
  
  if (!hasRecordedLogin && session?.user?.email) {
    try {
      console.log('Recording login for user');
      await recordLogin(session.user.email, import.meta.env.VITE_PUBLIC_APP_ENV);
      hasRecordedLogin = true;
    } catch (error) {
      console.error('Failed to record login:', error);
      Sentry.captureException(error, {
        extra: { context: 'recordLogin' }
      });
    }
  }
}

// Check for active session and record login
export async function checkAndRecordLogin() {
  if (hasRecordedLogin) return;
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error.message);
      return;
    }
    
    await updateSessionState(data?.session);
  } catch (error) {
    console.error('Failed to check session:', error);
    Sentry.captureException(error, {
      extra: { context: 'checkAndRecordLogin' }
    });
  }
}

// Enhanced refresh token logic
export async function refreshSession() {
  try {
    console.log('Attempting to refresh session token');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error.message);
      return null;
    }
    
    if (data?.session) {
      console.log('Session refreshed successfully');
      await updateSessionState(data.session);
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    Sentry.captureException(error, {
      extra: { context: 'refreshSession' }
    });
    return null;
  }
}

// Setup auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event);
  
  if (event === 'SIGNED_IN') {
    await updateSessionState(session);
  } else if (event === 'TOKEN_REFRESHED') {
    await updateSessionState(session);
  } else if (event === 'SIGNED_OUT') {
    currentSession = null;
    hasRecordedLogin = false;
    console.log('User signed out, session cleared');
  }
});

// Setup a session refresh interval
const THIRTY_MINUTES = 30 * 60 * 1000;
setInterval(async () => {
  if (currentSession) {
    // Only refresh if we have a session and it's not expired
    const expiresAt = new Date(currentSession.expires_at * 1000);
    const now = new Date();
    
    // Refresh when we're within 5 minutes of expiration
    if ((expiresAt - now) < 5 * 60 * 1000) {
      console.log('Session nearing expiration, refreshing token');
      await refreshSession();
    }
  }
}, THIRTY_MINUTES);

// Call this function when the app initializes
checkAndRecordLogin();

// Export the ability to get the current session
export function getCurrentSession() {
  return currentSession;
}