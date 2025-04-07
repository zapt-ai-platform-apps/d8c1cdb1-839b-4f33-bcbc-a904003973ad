import { companies, engagements, additionalActivities, resourceDistributions, followUpActions } from '../drizzle/schema.js';
import { getDB, handleApiError } from './_apiUtils.js';
import { eq, sql, and, gt, lt } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/dashboard`);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const db = getDB();
  
  try {
    // Get companies count
    const [companiesCount] = await db
      .select({ count: sql`count(*)` })
      .from(companies);
    
    // Get engagements count
    const [engagementsCount] = await db
      .select({ count: sql`count(*)` })
      .from(engagements);
    
    // Get upcoming tasks
    const today = new Date();
    const upcomingTasks = await db
      .select({
        id: followUpActions.id,
        task: followUpActions.task,
        dueDate: followUpActions.dueDate,
        completed: followUpActions.completed,
        engagementId: followUpActions.engagementId
      })
      .from(followUpActions)
      .where(
        and(
          eq(followUpActions.completed, false),
          gt(followUpActions.dueDate, today)
        )
      )
      .orderBy(followUpActions.dueDate)
      .limit(5);
    
    // Get total value from additional activities
    const [totalValue] = await db
      .select({
        sum: sql`sum(total_value)`
      })
      .from(additionalActivities);
    
    // Get recent companies
    const recentCompanies = await db
      .select()
      .from(companies)
      .orderBy(sql`created_at DESC`)
      .limit(5);
    
    // Get resources distribution count
    const [resourcesDistributedCount] = await db
      .select({ count: sql`count(*)` })
      .from(resourceDistributions);
    
    // Get engagement status counts
    const engagementStatusCounts = await db
      .select({
        status: engagements.status,
        count: sql`count(*)`
      })
      .from(engagements)
      .groupBy(engagements.status);
    
    // Package all data
    const dashboardData = {
      companiesCount: companiesCount.count,
      engagementsCount: engagementsCount.count,
      upcomingTasks,
      totalValue: totalValue.sum || 0,
      recentCompanies,
      resourcesDistributedCount: resourcesDistributedCount.count,
      engagementStatusCounts
    };
    
    return res.status(200).json(dashboardData);
  } catch (error) {
    return handleApiError(error, res, {
      endpoint: '/api/dashboard'
    });
  }
}