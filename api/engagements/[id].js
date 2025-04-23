import { getDB, authenticateUser, handleApiError, Sentry } from '../_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    await authenticateUser(req);
    const db = getDB();
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Engagement ID is required' });
    }
    
    // Log the engagement ID being accessed
    console.log(`API: Accessing engagement with ID: ${id}`);

    if (req.method === 'GET') {
      const engagement = await db.query.engagements.findFirst({
        where: eq(db.query.engagements.id, id),
        with: {
          followUpActions: true
        }
      });
      
      if (!engagement) {
        return res.status(404).json({ error: 'Engagement not found' });
      }
      
      return res.status(200).json(engagement);
    } 
    else if (req.method === 'PUT') {
      const { engagement, followUps } = req.body;
      
      // Log company ID for debugging precision issues
      console.log(`API: Updating engagement with company ID: ${engagement.companyId} (${typeof engagement.companyId})`);
      
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
      
      // Update engagement
      const [updatedEngagement] = await db.update(db.query.engagements)
        .set({
          companyId: engagement.companyId,
          dateOfContact: engagement.dateOfContact,
          aiTrainingDelivered: engagement.aiTrainingDelivered,
          notes: engagement.notes,
          status: engagement.status,
          updatedAt: new Date()
        })
        .where(eq(db.query.engagements.id, id))
        .returning();
      
      if (!updatedEngagement) {
        return res.status(404).json({ error: 'Engagement not found' });
      }
      
      // Delete existing follow-ups
      await db.delete(db.query.followUpActions)
        .where(eq(db.query.followUpActions.engagementId, id));
      
      // Create new follow-ups
      if (followUps && followUps.length > 0) {
        const followUpValues = followUps.map(followUp => ({
          engagementId: id,
          task: followUp.task,
          dueDate: followUp.dueDate,
          completed: followUp.completed || false
        }));
        
        const followUpResults = await db.insert(db.query.followUpActions)
          .values(followUpValues)
          .returning();
          
        updatedEngagement.followUpActions = followUpResults;
      } else {
        updatedEngagement.followUpActions = [];
      }
      
      return res.status(200).json(updatedEngagement);
    } 
    else if (req.method === 'DELETE') {
      // Deleting engagement will cascade delete follow-ups due to DB constraint
      const [deletedEngagement] = await db.delete(db.query.engagements)
        .where(eq(db.query.engagements.id, id))
        .returning();
      
      if (!deletedEngagement) {
        return res.status(404).json({ error: 'Engagement not found' });
      }
      
      return res.status(200).json({ message: 'Engagement deleted successfully' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(error, res, { 
      endpoint: `api/engagements/${req.query.id}`,
      method: req.method,
      engagementId: req.query.id
    });
  }
}