import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { resources } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
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
  console.log(`API: ${req.method} request to /api/resources/${req.query.id}`);
  
  // Get resource ID from URL
  const resourceId = parseInt(req.query.id, 10);
  
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: 'Invalid resource ID' });
  }
  
  // Connect to the database
  const client = postgres(process.env.COCKROACH_DB_URL);
  const db = drizzle(client);
  
  try {
    // Handle different HTTP methods
    if (req.method === 'GET') {
      const result = await db.select()
        .from(resources)
        .where(eq(resources.id, resourceId))
        .limit(1);
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      return res.status(200).json(result[0]);
    } 
    else if (req.method === 'PUT') {
      console.log('Updating resource with data:', req.body);
      
      // Update the resource
      const { title, type, description, link, fileName, fileType, fileSize } = req.body;
      
      // Validate required fields
      if (!title || !type || !link) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if resource exists
      const existingResource = await db.select({ id: resources.id })
        .from(resources)
        .where(eq(resources.id, resourceId))
        .limit(1);
      
      if (existingResource.length === 0) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Update the resource
      const result = await db.update(resources)
        .set({
          title,
          type,
          description,
          link,
          fileName,
          fileType,
          fileSize: fileSize ? parseInt(fileSize, 10) : null,
          updatedAt: new Date()
        })
        .where(eq(resources.id, resourceId))
        .returning();
      
      console.log('Resource updated successfully:', result[0]);
      
      return res.status(200).json(result[0]);
    } 
    else if (req.method === 'DELETE') {
      // Check if resource exists
      const existingResource = await db.select({ id: resources.id })
        .from(resources)
        .where(eq(resources.id, resourceId))
        .limit(1);
      
      if (existingResource.length === 0) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Delete the resource
      await db.delete(resources).where(eq(resources.id, resourceId));
      
      return res.status(204).send();
    } 
    else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error handling resource request:', error);
    Sentry.captureException(error, {
      extra: {
        route: `/api/resources/${resourceId}`,
        method: req.method,
        resourceId,
        body: req.body
      }
    });
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  } finally {
    await client.end();
  }
}