import { engagements, followUpActions } from '../../drizzle/schema.js';
import { getDB, handleApiError } from '../_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`[API] ${req.method} /api/engagements/${id}`);
  
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid engagement ID' });
  }
  
  const engagementId = Number(id);
  const db = getDB();
  
  try {
    // GET - retrieve engagement with follow-ups
    if (req.method === 'GET') {
      const engagement = await db.query.engagements.findFirst({
        where: eq(engagements.id, engagementId)
      });
      
      if (!engagement) {
        return res.status(404).json({ error: 'Engagement not found' });
      }
      
      // Get follow-up actions
      const followUps = await db
        .select()
        .from(followUpActions)
        .where(eq(followUpActions.engagementId, engagementId));
      
      return res.status(200).json({
        ...engagement,
        followUps
      });
    }
    
    // PUT - update engagement
    else if (req.method === 'PUT') {
      const { engagement, followUps = [] } = req.body;
      
      const [updatedEngagement] = await db
        .update(engagements)
        .set({
          dateOfContact: engagement.dateOfContact,
          aiTrainingDelivered: engagement.aiTrainingDelivered,
          notes: engagement.notes,
          status: engagement.status,
          updatedAt: new Date(),
        })
        .where(eq(engagements.id, engagementId))
        .returning();
      
      // Delete existing follow-ups and add new ones
      await db
        .delete(followUpActions)
        .where(eq(followUpActions.engagementId, engagementId));
      
      if (followUps.length > 0) {
        const followUpValues = followUps.map(followUp => ({
          engagementId: engagementId,
          task: followUp.task,
          dueDate: followUp.dueDate,
          completed: followUp.completed || false,
          updatedAt: new Date(),
        }));
        
        await db.insert(followUpActions).values(followUpValues);
      }
      
      return res.status(200).json(updatedEngagement);
    }
    
    // DELETE - delete engagement
    else if (req.method === 'DELETE') {
      await db
        .delete(engagements)
        .where(eq(engagements.id, engagementId));
      
      return res.status(204).send();
    }
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: `/api/engagements/${id}`,
      body: req.body
    });
  }
}