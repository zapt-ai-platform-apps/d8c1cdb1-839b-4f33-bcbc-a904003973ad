import { tags } from '../drizzle/schema.js';
import { getDB, handleApiError } from './_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/tags`);
  const db = getDB();
  
  try {
    // GET - retrieve tags, optionally filtered by type
    if (req.method === 'GET') {
      const { type } = req.query;
      
      let query = db.select().from(tags);
      
      if (type) {
        query = query.where(eq(tags.type, type));
      }
      
      const results = await query;
      return res.status(200).json(results);
    } 
    
    // POST - create new tag
    else if (req.method === 'POST') {
      const { tag } = req.body;
      
      if (!tag.name || !tag.type) {
        return res.status(400).json({ error: 'Tag name and type are required' });
      }
      
      const [newTag] = await db
        .insert(tags)
        .values({
          name: tag.name,
          type: tag.type,
        })
        .returning();
      
      return res.status(201).json(newTag);
    } 
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: '/api/tags',
      body: req.body,
      query: req.query
    });
  }
}