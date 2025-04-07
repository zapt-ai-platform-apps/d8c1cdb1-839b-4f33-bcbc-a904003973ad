import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the dashboard data schema
export const dashboardDataSchema = z.object({
  companiesCount: z.number(),
  engagementsCount: z.number(),
  upcomingTasks: z.array(z.object({
    id: z.number(),
    task: z.string(),
    dueDate: z.string(),
    completed: z.boolean(),
    engagementId: z.number()
  })),
  totalValue: z.number(),
  recentCompanies: z.array(z.any()),
  resourcesDistributedCount: z.number(),
  engagementStatusCounts: z.array(z.object({
    status: z.string(),
    count: z.number()
  }))
});

// Create validator
export const validateDashboardData = createValidator(dashboardDataSchema, 'DashboardData');