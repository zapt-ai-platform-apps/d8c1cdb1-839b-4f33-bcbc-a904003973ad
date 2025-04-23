import { z } from 'zod';
import { createValidator } from '@/modules/core/validators';

// Define schema for Engagement
const engagementSchema = z.object({
  companyId: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? val : String(val)
  ),
  dateOfContact: z.string().optional().nullable(),
  aiTrainingDelivered: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

// Define schema for Follow-up action
const followUpActionSchema = z.object({
  task: z.string(),
  dueDate: z.string().optional().nullable(),
  completed: z.boolean().default(false),
});

// Create validators
export const validateEngagement = createValidator(engagementSchema, 'Engagement');
export const validateFollowUpAction = createValidator(followUpActionSchema, 'FollowUpAction');