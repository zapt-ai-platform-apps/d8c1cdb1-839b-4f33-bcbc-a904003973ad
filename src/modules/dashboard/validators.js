import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the dashboard data schema
export const dashboardDataSchema = z.object({
  // Make the validator resilient by accepting both strings and numbers for count fields
  companiesCount: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? Number(val) : val
  ),
  engagementsCount: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? Number(val) : val
  ),
  upcomingTasks: z.array(z.object({
    id: z.number(),
    task: z.string(),
    dueDate: z.string(),
    completed: z.boolean(),
    engagementId: z.number()
  })),
  totalValue: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? Number(val) : val
  ),
  recentCompanies: z.array(z.any()),
  resourcesDistributedCount: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? Number(val) : val
  ),
  engagementStatusCounts: z.array(z.object({
    status: z.string(),
    count: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? Number(val) : val
    )
  }))
});

// Create validator
export const validateDashboardData = createValidator(dashboardDataSchema, 'DashboardData');