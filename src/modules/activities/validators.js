import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the activity schema
export const activitySchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
  additionalCourses: z.boolean().default(false),
  tLevels: z.boolean().default(false),
  apprenticeships: z.boolean().default(false),
  details: z.string().optional().nullable(),
  numberOfLearners: z.number().nullable().optional(),
  totalValue: z.number().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Create validators
export const validateActivity = createValidator(activitySchema, 'Activity');

// Activity list schema
export const activityListSchema = z.array(activitySchema);
export const validateActivityList = createValidator(activityListSchema, 'ActivityList');