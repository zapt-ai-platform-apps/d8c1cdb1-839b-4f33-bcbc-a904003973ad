import { additionalActivities, companies } from '../../drizzle/schema.js';
import { getDB, handleApiError } from '../_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/activities/${req.query.id}`);
  const db = getDB();
  const activityId = Number(req.query.id);
  
  if (isNaN(activityId)) {
    return res.status(400).json({ error: 'Invalid activity ID' });
  }
  
  try {
    // GET - retrieve a single activity
    if (req.method === 'GET') {
      const activity = await db
        .select()
        .from(additionalActivities)
        .where(eq(additionalActivities.id, activityId))
        .limit(1);
      
      if (!activity.length) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      
      return res.status(200).json(activity[0]);
    } 
    
    // PUT - update an activity
    else if (req.method === 'PUT') {
      const { activity } = req.body;
      
      // Validate the activity exists
      const existingActivity = await db
        .select()
        .from(additionalActivities)
        .where(eq(additionalActivities.id, activityId))
        .limit(1);
      
      if (!existingActivity.length) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      
      // If company ID is being updated, verify the new company exists
      if (activity.companyId && activity.companyId !== existingActivity[0].companyId) {
        const companyId = Number(activity.companyId);
        
        if (isNaN(companyId)) {
          return res.status(400).json({ error: 'Invalid company ID format' });
        }
        
        const companyExists = await db
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.id, companyId))
          .limit(1);
        
        if (!companyExists.length) {
          return res.status(404).json({ 
            error: `Company with ID ${companyId} does not exist`, 
            code: 'COMPANY_NOT_FOUND'
          });
        }
      }
      
      // Update the activity
      const [updatedActivity] = await db
        .update(additionalActivities)
        .set({
          companyId: activity.companyId !== undefined ? Number(activity.companyId) : existingActivity[0].companyId,
          additionalCourses: activity.additionalCourses !== undefined ? activity.additionalCourses : existingActivity[0].additionalCourses,
          tLevels: activity.tLevels !== undefined ? activity.tLevels : existingActivity[0].tLevels,
          apprenticeships: activity.apprenticeships !== undefined ? activity.apprenticeships : existingActivity[0].apprenticeships,
          details: activity.details !== undefined ? activity.details : existingActivity[0].details,
          numberOfLearners: activity.numberOfLearners !== undefined ? activity.numberOfLearners : existingActivity[0].numberOfLearners,
          totalValue: activity.totalValue !== undefined ? activity.totalValue : existingActivity[0].totalValue,
          updatedAt: new Date(),
        })
        .where(eq(additionalActivities.id, activityId))
        .returning();
      
      return res.status(200).json(updatedActivity);
    } 
    
    // DELETE - delete an activity
    else if (req.method === 'DELETE') {
      const deletedActivity = await db
        .delete(additionalActivities)
        .where(eq(additionalActivities.id, activityId))
        .returning();
      
      if (!deletedActivity.length) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      
      return res.status(200).json({ message: 'Activity deleted successfully' });
    } 
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: `/api/activities/${activityId}`,
      activityId,
      body: req.body
    });
  }
}