import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as Sentry from "@sentry/node";

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

export function getDB() {
  try {
    const client = postgres(process.env.COCKROACH_DB_URL);
    return drizzle(client);
  } catch (error) {
    console.error("Error initializing database connection:", error);
    Sentry.captureException(error, {
      extra: {
        message: "Failed to initialize database connection"
      }
    });
    throw error;
  }
}

export async function handleApiError(error, res, context = {}) {
  console.error(`API Error:`, error);
  
  Sentry.captureException(error, {
    extra: {
      ...context
    }
  });
  
  return res.status(500).json({ 
    error: 'An error occurred on the server',
    message: error.message
  });
}