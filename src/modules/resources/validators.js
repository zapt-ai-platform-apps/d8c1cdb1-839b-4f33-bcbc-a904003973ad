import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the resource schema with string IDs to preserve precision
export const resourceSchema = z.object({
  id: z.union([
    z.string(),
    z.number().transform(num => String(num))
  ]).optional(),  // Accept both string and number, convert to string
  title: z.string().min(1, "Resource title is required"),
  type: z.string().min(1, "Resource type is required"),
  description: z.string().optional().nullable(),
  link: z.string().url("Valid URL is required"),
  createdAt: z.union([
    z.string(),
    z.date()
  ]).transform(date => typeof date === 'string' ? new Date(date) : date).optional(),
  updatedAt: z.union([
    z.string(),
    z.date()
  ]).transform(date => typeof date === 'string' ? new Date(date) : date).optional(),
  fileName: z.string().optional().nullable(),
  fileSize: z.union([
    z.string().transform(str => parseInt(str, 10)),
    z.number()
  ]).optional().nullable(),
  fileType: z.string().optional().nullable(),
});

// Distribution schema - use string IDs to preserve precision
export const distributionSchema = z.object({
  resourceId: z.union([
    z.string(),
    z.number().transform(num => String(num))
  ]),
  companyIds: z.array(z.union([
    z.string(),
    z.number().transform(num => String(num))
  ])).optional(),
  tagIds: z.array(z.union([
    z.string(),
    z.number().transform(num => String(num))
  ])).optional(),
});

// Resource list schema
export const resourceListSchema = z.array(resourceSchema);

// Create validators
export const validateResource = createValidator(resourceSchema, 'Resource');
export const validateResourceList = createValidator(resourceListSchema, 'ResourceList');
export const validateDistribution = createValidator(distributionSchema, 'Distribution');