import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define schema for a follow-up action
export const followUpSchema = z.object({
  id: z.number().optional(),
  engagementId: z.number().optional(),
  task: z.string().min(1, "Task description is required"),
  dueDate: z.string().optional().nullable(),
  completed: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Define schema for a single engagement
export const engagementSchema = z.object({
  id: z.number().optional(),
  companyId: z.coerce.number(), // Changed from z.number() to handle string values
  dateOfContact: z.string().or(z.instanceof(Date)),
  aiTrainingDelivered: z.string().or(z.array(z.string())).optional(),
  notes: z.string().optional().default(''),
  status: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  followUps: z.array(followUpSchema).optional().default([])
});

// Define schema for a list of engagements
export const engagementListSchema = z.array(engagementSchema);

// Create validators with context
export const validateEngagement = createValidator(engagementSchema, 'Engagement');
export const validateEngagementList = createValidator(engagementListSchema, 'EngagementList');
export const validateFollowUp = createValidator(followUpSchema, 'FollowUp');