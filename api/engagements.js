import { getDB, authenticateUser, handleApiError, Sentry } from './_apiUtils.js';
import { desc, eq } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    await authenticateUser(req);
    const db = getDB();

    if (req.method === 'GET') {
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      // Preserve the company ID as a string when fetching from database
      console.log(`API: Fetching engagements for company ID: ${companyId}`);
      
      const engagements = await db.query.engagements.findMany({
        where: eq(db.query.engagements.companyId, companyId),
        orderBy: [desc(db.query.engagements.dateOfContact)],
        with: {
          followUpActions: true
        }
      });
      
      return res.status(200).json(engagements);
    } 
    else if (req.method === 'POST') {
      const { engagement, followUps } = req.body;
      
      // Log received company ID to trace precision issues
      console.log(`API: Creating engagement with company ID: ${engagement.companyId} (${typeof engagement.companyId})`);
      
      // Check if company exists first
      const company = await db.query.companies.findFirst({
        where: eq(db.query.companies.id, engagement.companyId)
      });
      
      if (!company) {
        console.error(`Company with ID ${engagement.companyId} not found`);
        return res.status(404).json({ 
          error: `Company with ID ${engagement.companyId} does not exist` 
        });
      }
      
      // Create engagement
      const [newEngagement] = await db.insert(db.query.engagements).values({
        companyId: engagement.companyId,
        dateOfContact: engagement.dateOfContact,
        aiTrainingDelivered: engagement.aiTrainingDelivered,
        notes: engagement.notes,
        status: engagement.status,
      }).returning();
      
      // Create follow-up actions if any
      if (followUps && followUps.length > 0) {
        const followUpValues = followUps.map(followUp => ({
          engagementId: newEngagement.id,
          task: followUp.task,
          dueDate: followUp.dueDate,
          completed: followUp.completed || false
        }));
        
        const followUpResults = await db.insert(db.query.followUpActions).values(followUpValues).returning();
        newEngagement.followUpActions = followUpResults;
      } else {
        newEngagement.followUpActions = [];
      }
      
      return res.status(201).json(newEngagement);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(error, res, { 
      endpoint: 'api/engagements',
      method: req.method,
      query: req.query
    });
  }
}