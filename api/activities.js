import { additionalActivities, companies } from '../drizzle/schema.js';
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
      
      // Validate company ID exists
      if (!activity || !activity.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      // Convert companyId to a number to ensure type safety
      const companyId = Number(activity.companyId);
      if (isNaN(companyId)) {
        return res.status(400).json({ error: 'Invalid company ID format' });
      }
      
      // Verify company exists
      const companyExists = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);
      
      if (!companyExists.length) {
        console.error(`Company with ID ${companyId} does not exist`);
        return res.status(404).json({ 
          error: `Company with ID ${companyId} does not exist`, 
          code: 'COMPANY_NOT_FOUND'
        });
      }
      
      console.log(`Adding activity for company ID: ${companyId}`);
      
      // Insert activity with validated company ID
      try {
        const [newActivity] = await db
          .insert(additionalActivities)
          .values({
            companyId: companyId,
            additionalCourses: activity.additionalCourses || false,
            tLevels: activity.tLevels || false,
            apprenticeships: activity.apprenticeships || false,
            details: activity.details,
            numberOfLearners: activity.numberOfLearners,
            totalValue: activity.totalValue,
            updatedAt: new Date(),
          })
          .returning();
        
        console.log(`Activity created with ID: ${newActivity.id}`);
        return res.status(201).json(newActivity);
      } catch (error) {
        console.error('Database error inserting activity:', error);
        // Check for foreign key constraint violation
        if (error.message && error.message.includes('violates foreign key constraint')) {
          return res.status(400).json({ 
            error: 'Cannot add activity: Company does not exist',
            details: error.message,
            code: 'FOREIGN_KEY_VIOLATION'
          });
        }
        throw error; // Let the outer error handler deal with other errors
      }
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