import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the tag schema
export const tagSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Tag name is required"),
  type: z.string().min(1, "Tag type is required"),
  createdAt: z.date().optional(),
});

// Tag list schema
export const tagListSchema = z.array(tagSchema);

// Create validators
export const validateTag = createValidator(tagSchema, 'Tag');
export const validateTagList = createValidator(tagListSchema, 'TagList');