import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { resources } from '../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';
import * as Sentry from '@sentry/node';

// Initialize Sentry
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

export default async function handler(req, res) {
  console.log(`API: ${req.method} request to /api/resources`);
  
  // Connect to the database
  const client = postgres(process.env.COCKROACH_DB_URL);
  const db = drizzle(client);
  
  try {
    // Handle different HTTP methods
    if (req.method === 'GET') {
      const result = await db.select().from(resources).orderBy(desc(resources.createdAt));
      return res.status(200).json(result);
    } 
    else if (req.method === 'POST') {
      console.log('Creating new resource with data:', req.body);
      
      // Create a new resource
      const { title, type, description, link, fileName, fileType, fileSize } = req.body;
      
      // Validate required fields
      if (!title || !type || !link) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Insert the new resource
      const result = await db.insert(resources).values({
        title,
        type,
        description,
        link,
        fileName,
        fileType,
        fileSize: fileSize ? parseInt(fileSize, 10) : null
      }).returning();
      
      console.log('Resource created successfully:', result[0]);
      
      return res.status(201).json(result[0]);
    } 
    else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error handling resources request:', error);
    Sentry.captureException(error, {
      extra: {
        route: '/api/resources',
        method: req.method,
        body: req.body
      }
    });
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  } finally {
    await client.end();
  }
}