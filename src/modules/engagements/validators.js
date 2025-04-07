import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the follow-up action schema
export const followUpSchema = z.object({
  id: z.number().optional(),
  engagementId: z.number().optional(),
  task: z.string().min(1, "Task description is required"),
  dueDate: z.union([z.date(), z.string()]).optional().nullable(),
  completed: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Define the engagement schema
export const engagementSchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
  dateOfContact: z.union([z.date(), z.string()]),
  aiTrainingDelivered: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  followUps: z.array(followUpSchema).optional(),
});

// Engagement list schema
export const engagementListSchema = z.array(engagementSchema);

// Create validators
export const validateEngagement = createValidator(engagementSchema, 'Engagement');
export const validateEngagementList = createValidator(engagementListSchema, 'EngagementList');
export const validateFollowUp = createValidator(followUpSchema, 'FollowUp');