import { initializeZapt } from '@zapt/zapt-js';
import * as Sentry from '@sentry/node';

// Initialize Sentry for backend error tracking
Sentry.init({
  dsn: process.env.VITE_PUBLIC_SENTRY_DSN,
  environment: process.env.VITE_PUBLIC_APP_ENV,
  initialScope: {
    tags: {
      type: 'backend',
      projectId: process.env.VITE_PUBLIC_APP_ID
    }
  }
});

const { supabase } = initializeZapt(process.env.VITE_PUBLIC_APP_ID);

export async function authenticateUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    const error = new Error('Missing Authorization header');
    Sentry.captureException(error, {
      extra: { 
        path: req.url,
        method: req.method
      }
    });
    throw error;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    Sentry.captureException(error, { 
      extra: { 
        path: req.url,
        method: req.method,
        authHeader: 'Bearer ****' // Redacted for security
      }
    });
    throw new Error('Invalid token');
  }

  return user;
}

export { Sentry };