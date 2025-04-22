import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the resource schema
export const resourceSchema = z.object({
  id: z.coerce.number().optional(),  // Coerce string IDs to numbers
  title: z.string().min(1, "Resource title is required"),
  type: z.string().min(1, "Resource type is required"),
  description: z.string().optional().nullable(),
  link: z.string().url("Valid URL is required"),
  createdAt: z.coerce.date().optional(),  // Coerce string dates to Date objects
  updatedAt: z.coerce.date().optional(),  // Coerce string dates to Date objects
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  fileType: z.string().optional().nullable(),
});

// Distribution schema
export const distributionSchema = z.object({
  resourceId: z.coerce.number(),  // Coerce string IDs to numbers
  companyIds: z.array(z.coerce.number()).optional(),
  tagIds: z.array(z.coerce.number()).optional(),
});

// Resource list schema
export const resourceListSchema = z.array(resourceSchema);

// Create validators
export const validateResource = createValidator(resourceSchema, 'Resource');
export const validateResourceList = createValidator(resourceListSchema, 'ResourceList');
export const validateDistribution = createValidator(distributionSchema, 'Distribution');