import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { files } from '../../drizzle/schema.js';
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
  console.log(`API: ${req.method} request to /api/files/${req.query.id}`);
  
  // Connect to the database
  const client = postgres(process.env.COCKROACH_DB_URL);
  const db = drizzle(client);
  
  // Extract the file ID from the path parameter
  const { id } = req.query;
  const fileId = parseInt(id, 10);
  
  if (isNaN(fileId)) {
    return res.status(400).json({ error: 'Invalid file ID' });
  }

  try {
    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Get a specific file by ID
      const result = await db.select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      return res.status(200).json(result[0]);
    } 
    else if (req.method === 'DELETE') {
      // Delete a file by ID
      const result = await db.delete(files)
        .where(eq(files.id, fileId))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      return res.status(200).json({ message: 'File deleted successfully' });
    } 
    else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error(`Error handling request for file ID ${fileId}:`, error);
    Sentry.captureException(error, {
      extra: {
        route: `/api/files/${id}`,
        method: req.method,
        fileId
      }
    });
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  } finally {
    await client.end();
  }
}