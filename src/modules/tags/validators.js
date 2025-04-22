import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the tag schema with more flexible input handling
export const tagSchema = z.object({
  id: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'string' ? parseInt(val, 10) : val)
    .optional(),
  name: z.string().min(1, "Tag name is required"),
  type: z.string().min(1, "Tag type is required"),
  createdAt: z.union([z.string(), z.date()])
    .transform(val => typeof val === 'string' ? new Date(val) : val)
    .optional(),
});

// Tag list schema
export const tagListSchema = z.array(tagSchema);

// Create validators
export const validateTag = createValidator(tagSchema, 'Tag');
export const validateTagList = createValidator(tagListSchema, 'TagList');