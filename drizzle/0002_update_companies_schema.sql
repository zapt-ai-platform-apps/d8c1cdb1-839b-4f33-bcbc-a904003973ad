-- Add new fields to companies table
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "sector" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "ai_tools_delivered" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "additional_sign_ups" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "value_to_college" DECIMAL(10, 2);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "engagement_notes" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "resources_sent" TEXT;