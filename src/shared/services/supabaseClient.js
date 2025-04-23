import { initializeZapt } from '@zapt/zapt-js';
import * as Sentry from '@sentry/browser';

// Initialize Zapt and get Supabase client
export const { supabase, recordLogin } = initializeZapt(import.meta.env.VITE_PUBLIC_APP_ID);

// Initialize session tracking
let hasRecordedLogin = false;

// Check for active session and record login
export async function checkAndRecordLogin() {
  if (hasRecordedLogin) return;
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error.message);
      return;
    }
    
    const user = data?.session?.user;
    if (user?.email) {
      console.log('Recording login for user');
      await recordLogin(user.email, import.meta.env.VITE_PUBLIC_APP_ENV);
      hasRecordedLogin = true;
    }
  } catch (error) {
    console.error('Failed to record login:', error);
    Sentry.captureException(error, {
      extra: { context: 'recordLogin' }
    });
  }
}

// Setup auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event);
  
  if (event === 'SIGNED_IN' && session?.user?.email && !hasRecordedLogin) {
    try {
      await recordLogin(session.user.email, import.meta.env.VITE_PUBLIC_APP_ENV);
      hasRecordedLogin = true;
    } catch (error) {
      console.error('Failed to record login on auth change:', error);
      Sentry.captureException(error);
    }
  } else if (event === 'SIGNED_OUT') {
    hasRecordedLogin = false;
  }
});

// Call this function when the app initializes
checkAndRecordLogin();