import { initializeZapt } from '@zapt/zapt-js';
import * as Sentry from '@sentry/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema.js';

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

export function getDB() {
  try {
    const client = postgres(process.env.COCKROACH_DB_URL);
    // Import the drizzle schema and pass it to the drizzle instance
    const db = drizzle(client, { schema });
    
    // Validate that the db.query object has the expected properties
    if (!db.query || !db.query.companies) {
      console.error('Error in DB setup: query builder for companies table is missing');
      Sentry.captureMessage('Drizzle query builder setup failed', {
        level: 'error',
        extra: {
          schemaKeys: Object.keys(schema),
          dbQueryKeys: db.query ? Object.keys(db.query) : 'db.query is undefined'
        }
      });
    }
    
    return db;
  } catch (error) {
    console.error('DB initialization error:', error);
    Sentry.captureException(error, {
      extra: { context: 'Database initialization' }
    });
    throw error;
  }
}

export function handleApiError(error, res, context = {}) {
  console.error('API Error:', error.message);
  Sentry.captureException(error, { 
    extra: context
  });
  return res.status(500).json({ error: 'Internal server error' });
}

export { Sentry };