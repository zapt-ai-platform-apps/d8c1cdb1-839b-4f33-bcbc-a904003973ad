import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the resource schema
export const resourceSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Resource title is required"),
  type: z.string().min(1, "Resource type is required"),
  description: z.string().optional().nullable(),
  link: z.string().url("Valid URL is required"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Distribution schema
export const distributionSchema = z.object({
  resourceId: z.number(),
  companyIds: z.array(z.number()).optional(),
  tagIds: z.array(z.number()).optional(),
});

// Resource list schema
export const resourceListSchema = z.array(resourceSchema);

// Create validators
export const validateResource = createValidator(resourceSchema, 'Resource');
export const validateResourceList = createValidator(resourceListSchema, 'ResourceList');
export const validateDistribution = createValidator(distributionSchema, 'Distribution');