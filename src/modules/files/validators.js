import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the file schema
export const fileSchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
  name: z.string().min(1, "File name is required"),
  type: z.string().optional().nullable(),
  url: z.string().url("Valid URL is required"),
  createdAt: z.date().optional(),
});

// File list schema
export const fileListSchema = z.array(fileSchema);

// Create validators
export const validateFile = createValidator(fileSchema, 'File');
export const validateFileList = createValidator(fileListSchema, 'FileList');