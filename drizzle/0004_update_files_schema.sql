-- Make companyId optional in files table
ALTER TABLE "files" ALTER COLUMN "company_id" DROP NOT NULL;