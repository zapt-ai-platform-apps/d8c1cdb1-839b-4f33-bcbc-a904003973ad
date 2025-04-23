import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { resources } from '../drizzle/schema.js';
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
      // Get all resources
      const result = await db.select().from(resources).orderBy(resources.createdAt);
      
      return res.status(200).json(result);
    } 
    else if (req.method === 'POST') {
      console.log('Creating resource with data:', req.body);
      
      // Extract resource data - check if it's nested or direct
      const resourceData = req.body.resource || req.body;
      
      // Validate required fields
      const { title, type, link } = resourceData;
      
      if (!title || !type || !link) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: {
            title: title ? 'provided' : 'missing',
            type: type ? 'provided' : 'missing',
            link: link ? 'provided' : 'missing'
          }
        });
      }
      
      // Extract all fields with proper defaults
      const insertData = {
        title,
        type,
        description: resourceData.description || null,
        link,
        fileName: resourceData.fileName || null,
        fileType: resourceData.fileType || null,
        fileSize: resourceData.fileSize ? parseInt(resourceData.fileSize, 10) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Inserting resource with data:', insertData);
      
      // Insert the resource
      const result = await db.insert(resources).values(insertData).returning();
      
      if (!result || result.length === 0) {
        throw new Error('Failed to insert resource into database');
      }
      
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
    // Ensure client is defined before trying to end it
    if (typeof client !== 'undefined') {
      await client.end();
    }
  }
}