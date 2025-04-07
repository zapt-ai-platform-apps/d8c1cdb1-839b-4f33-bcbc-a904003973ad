import { resources, resourceDistributions, companies, tags } from '../drizzle/schema.js';
import { getDB, handleApiError } from './_apiUtils.js';
import { eq, inArray } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/resources`);
  const db = getDB();
  
  try {
    // GET - retrieve resources
    if (req.method === 'GET') {
      const results = await db
        .select()
        .from(resources)
        .orderBy(resources.createdAt);
      
      return res.status(200).json(results);
    } 
    
    // POST - create new resource
    else if (req.method === 'POST') {
      const { resource } = req.body;
      
      if (!resource.title || !resource.type || !resource.link) {
        return res.status(400).json({ error: 'Resource title, type, and link are required' });
      }
      
      const [newResource] = await db
        .insert(resources)
        .values({
          title: resource.title,
          type: resource.type,
          description: resource.description,
          link: resource.link,
          updatedAt: new Date(),
        })
        .returning();
      
      return res.status(201).json(newResource);
    } 
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: '/api/resources',
      body: req.body
    });
  }
}