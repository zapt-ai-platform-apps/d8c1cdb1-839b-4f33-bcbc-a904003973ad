import { additionalActivities } from '../drizzle/schema.js';
import { getDB, handleApiError } from './_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/activities`);
  const db = getDB();
  
  try {
    // GET - retrieve activities for a company
    if (req.method === 'GET') {
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const results = await db
        .select()
        .from(additionalActivities)
        .where(eq(additionalActivities.companyId, Number(companyId)));
      
      return res.status(200).json(results);
    } 
    
    // POST - create new activity
    else if (req.method === 'POST') {
      const { activity } = req.body;
      
      const [newActivity] = await db
        .insert(additionalActivities)
        .values({
          companyId: activity.companyId,
          additionalCourses: activity.additionalCourses || false,
          tLevels: activity.tLevels || false,
          apprenticeships: activity.apprenticeships || false,
          details: activity.details,
          numberOfLearners: activity.numberOfLearners,
          totalValue: activity.totalValue,
          updatedAt: new Date(),
        })
        .returning();
      
      return res.status(201).json(newActivity);
    } 
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: '/api/activities',
      body: req.body,
      query: req.query
    });
  }
}