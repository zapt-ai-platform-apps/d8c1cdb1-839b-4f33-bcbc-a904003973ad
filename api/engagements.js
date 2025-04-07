import { engagements, followUpActions } from '../drizzle/schema.js';
import { getDB, handleApiError } from './_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/engagements`);
  const db = getDB();
  
  try {
    // GET - retrieve engagements
    if (req.method === 'GET') {
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const results = await db
        .select()
        .from(engagements)
        .where(eq(engagements.companyId, Number(companyId)));
      
      return res.status(200).json(results);
    } 
    
    // POST - create new engagement
    else if (req.method === 'POST') {
      const { engagement, followUps = [] } = req.body;
      
      const [newEngagement] = await db
        .insert(engagements)
        .values({
          companyId: engagement.companyId,
          dateOfContact: engagement.dateOfContact,
          aiTrainingDelivered: engagement.aiTrainingDelivered,
          notes: engagement.notes,
          status: engagement.status,
          updatedAt: new Date(),
        })
        .returning();
      
      // Insert follow-up actions if provided
      if (followUps.length > 0) {
        const followUpValues = followUps.map(followUp => ({
          engagementId: newEngagement.id,
          task: followUp.task,
          dueDate: followUp.dueDate,
          completed: followUp.completed || false,
          updatedAt: new Date(),
        }));
        
        await db.insert(followUpActions).values(followUpValues);
      }
      
      return res.status(201).json(newEngagement);
    } 
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: '/api/engagements',
      body: req.body,
      query: req.query
    });
  }
}