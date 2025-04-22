-- Add file-related fields to resources table
ALTER TABLE IF EXISTS "resources" ADD COLUMN IF NOT EXISTS "file_name" TEXT;
ALTER TABLE IF EXISTS "resources" ADD COLUMN IF NOT EXISTS "file_size" INTEGER;
ALTER TABLE IF EXISTS "resources" ADD COLUMN IF NOT EXISTS "file_type" TEXT;