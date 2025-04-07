CREATE TABLE IF NOT EXISTS "companies" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "industry" TEXT,
  "location" TEXT,
  "contact_name" TEXT,
  "contact_role" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "social_media" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "engagements" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "date_of_contact" DATE,
  "ai_training_delivered" TEXT,
  "notes" TEXT,
  "status" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "follow_up_actions" (
  "id" SERIAL PRIMARY KEY,
  "engagement_id" INTEGER NOT NULL REFERENCES "engagements"("id") ON DELETE CASCADE,
  "task" TEXT NOT NULL,
  "due_date" DATE,
  "completed" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "additional_activities" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "additional_courses" BOOLEAN DEFAULT FALSE,
  "t_levels" BOOLEAN DEFAULT FALSE,
  "apprenticeships" BOOLEAN DEFAULT FALSE,
  "details" TEXT,
  "number_of_learners" INTEGER,
  "total_value" DECIMAL(10, 2),
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "files" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "type" TEXT,
  "url" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tags" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "company_tags" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "tag_id" INTEGER NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  UNIQUE("company_id", "tag_id")
);

CREATE TABLE IF NOT EXISTS "resources" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "link" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "resource_distributions" (
  "id" SERIAL PRIMARY KEY,
  "resource_id" INTEGER NOT NULL REFERENCES "resources"("id") ON DELETE CASCADE,
  "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
  "tag_id" INTEGER REFERENCES "tags"("id") ON DELETE CASCADE,
  "date_sent" TIMESTAMP DEFAULT NOW(),
  "clicks" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Insert default tag categories
INSERT INTO "tags" ("name", "type") VALUES 
-- Sector tags
('Construction', 'Sector'),
('Health', 'Sector'),
('Creative', 'Sector'),
('Manufacturing', 'Sector'),
('Digital', 'Sector'),
('Education', 'Sector'),
('Retail', 'Sector'),
('Hospitality', 'Sector'),
-- Location tags
('Rochdale', 'Location'),
('Middleton', 'Location'),
('Heywood', 'Location'),
('Manchester', 'Location'),
('Bury', 'Location'),
('Oldham', 'Location'),
-- Engagement Type tags
('Training Only', 'Engagement Type'),
('Full Course', 'Engagement Type'),
('Repeat Client', 'Engagement Type'),
('New Client', 'Engagement Type'),
('Referral', 'Engagement Type')
ON CONFLICT DO NOTHING;