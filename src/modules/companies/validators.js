import { z } from 'zod';
import { createValidator } from '../core/validators';

// Define the company schema
export const companySchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactRole: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  socialMedia: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  aiToolsDelivered: z.string().optional().nullable(),
  additionalSignUps: z.string().optional().nullable(),
  valueToCollege: z.number().optional().nullable(),
  engagementNotes: z.string().optional().nullable(),
  resourcesSent: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

// Create validators
export const validateCompany = createValidator(companySchema, 'Company');

// Tag association schema
export const companyTagSchema = z.object({
  companyId: z.coerce.number(),
  tagIds: z.array(z.coerce.number())
});

export const validateCompanyTags = createValidator(companyTagSchema, 'CompanyTags');

// Company list response schema
export const companyListSchema = z.array(companySchema);
export const validateCompanyList = createValidator(companyListSchema, 'CompanyList');

// Company detail response schema (includes related data)
export const companyDetailSchema = companySchema.extend({
  tags: z.array(z.object({
    id: z.coerce.number(),
    name: z.string(),
    type: z.string()
  })).optional(),
  engagements: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
  files: z.array(z.any()).optional()
});

export const validateCompanyDetail = createValidator(companyDetailSchema, 'CompanyDetail');