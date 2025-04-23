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
  
  // Get resource ID from URL - use BigInt to handle large numbers properly
  const resourceIdStr = req.query.id;
  
  try {
    // Connect to the database
    const client = postgres(process.env.COCKROACH_DB_URL);
    const db = drizzle(client);
    
    // Handle different HTTP methods
    if (req.method === 'GET') {
      console.log(`Fetching resource with ID: ${resourceIdStr}`);
      
      // Use a string comparison for the ID to avoid precision issues
      const sql = `
        SELECT * FROM resources 
        WHERE id::text = '${resourceIdStr}'
        LIMIT 1
      `;
      
      // Execute raw SQL to ensure precise ID matching
      const result = await client.unsafe(sql);
      
      if (result.length === 0) {
        console.log(`Resource not found with ID: ${resourceIdStr}`);
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      console.log('Resource found:', result[0]);
      return res.status(200).json(result[0]);
    } 
    else if (req.method === 'PUT') {
      console.log('Updating resource with data:', req.body);
      
      // Extract data - check if it's nested under 'resource'
      const resourceData = req.body.resource || req.body;
      
      const { title, type, description, link, fileName, fileType, fileSize } = resourceData;
      
      // Validate required fields
      if (!title || !type || !link) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if resource exists using string comparison
      const checkSql = `
        SELECT id FROM resources 
        WHERE id::text = '${resourceIdStr}'
        LIMIT 1
      `;
      
      const existingResource = await client.unsafe(checkSql);
      
      if (existingResource.length === 0) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Update with raw SQL to ensure precise ID matching
      const updateSql = `
        UPDATE resources
        SET 
          title = $1,
          type = $2,
          description = $3,
          link = $4,
          file_name = $5,
          file_type = $6,
          file_size = $7,
          updated_at = NOW()
        WHERE id::text = '${resourceIdStr}'
        RETURNING *
      `;
      
      const result = await client.unsafe(updateSql, [
        title,
        type,
        description,
        link,
        fileName,
        fileType,
        fileSize ? parseInt(fileSize, 10) : null
      ]);
      
      console.log('Resource updated successfully:', result[0]);
      
      return res.status(200).json(result[0]);
    } 
    else if (req.method === 'DELETE') {
      // Check if resource exists using string comparison
      const checkSql = `
        SELECT id FROM resources 
        WHERE id::text = '${resourceIdStr}'
        LIMIT 1
      `;
      
      const existingResource = await client.unsafe(checkSql);
      
      if (existingResource.length === 0) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Delete with raw SQL to ensure precise ID matching
      const deleteSql = `
        DELETE FROM resources
        WHERE id::text = '${resourceIdStr}'
      `;
      
      await client.unsafe(deleteSql);
      
      return res.status(204).send();
    } 
    else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error handling resource request:', error);
    Sentry.captureException(error, {
      extra: {
        route: `/api/resources/${resourceIdStr}`,
        method: req.method,
        resourceId: resourceIdStr,
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