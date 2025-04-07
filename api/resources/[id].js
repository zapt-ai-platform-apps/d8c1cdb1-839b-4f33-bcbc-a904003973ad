import { resources, resourceDistributions } from '../../drizzle/schema.js';
import { getDB, handleApiError } from '../_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`[API] ${req.method} /api/resources/${id}`);
  
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid resource ID' });
  }
  
  const resourceId = Number(id);
  const db = getDB();
  
  try {
    // GET - retrieve single resource with distribution data
    if (req.method === 'GET') {
      const resource = await db.query.resources.findFirst({
        where: eq(resources.id, resourceId)
      });
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Get distribution history
      const distributions = await db
        .select()
        .from(resourceDistributions)
        .where(eq(resourceDistributions.resourceId, resourceId));
      
      return res.status(200).json({
        ...resource,
        distributions
      });
    }
    
    // PUT - update resource
    else if (req.method === 'PUT') {
      const { resource } = req.body;
      
      const [updatedResource] = await db
        .update(resources)
        .set({
          title: resource.title,
          type: resource.type,
          description: resource.description,
          link: resource.link,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, resourceId))
        .returning();
      
      return res.status(200).json(updatedResource);
    }
    
    // DELETE - delete resource
    else if (req.method === 'DELETE') {
      await db
        .delete(resources)
        .where(eq(resources.id, resourceId));
      
      return res.status(204).send();
    }
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: `/api/resources/${id}`,
      body: req.body
    });
  }
}