import { additionalActivities } from '../../drizzle/schema.js';
import { getDB, handleApiError } from '../_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`[API] ${req.method} /api/activities/${id}`);
  
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid activity ID' });
  }
  
  const activityId = Number(id);
  const db = getDB();
  
  try {
    // GET - retrieve single activity
    if (req.method === 'GET') {
      const activity = await db.query.additionalActivities.findFirst({
        where: eq(additionalActivities.id, activityId)
      });
      
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      
      return res.status(200).json(activity);
    }
    
    // PUT - update activity
    else if (req.method === 'PUT') {
      const { activity } = req.body;
      
      const [updatedActivity] = await db
        .update(additionalActivities)
        .set({
          additionalCourses: activity.additionalCourses || false,
          tLevels: activity.tLevels || false,
          apprenticeships: activity.apprenticeships || false,
          details: activity.details,
          numberOfLearners: activity.numberOfLearners,
          totalValue: activity.totalValue,
          updatedAt: new Date(),
        })
        .where(eq(additionalActivities.id, activityId))
        .returning();
      
      return res.status(200).json(updatedActivity);
    }
    
    // DELETE - delete activity
    else if (req.method === 'DELETE') {
      await db
        .delete(additionalActivities)
        .where(eq(additionalActivities.id, activityId));
      
      return res.status(204).send();
    }
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: `/api/activities/${id}`,
      body: req.body
    });
  }
}