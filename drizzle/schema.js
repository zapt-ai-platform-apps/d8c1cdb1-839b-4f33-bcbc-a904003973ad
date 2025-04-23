import { pgTable, serial, text, timestamp, integer, boolean, date, decimal, unique } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  industry: text('industry'),
  location: text('location'),
  contactName: text('contact_name'),
  contactRole: text('contact_role'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  socialMedia: text('social_media'),
  sector: text('sector'),
  aiToolsDelivered: text('ai_tools_delivered'),
  additionalSignUps: text('additional_sign_ups'),
  valueToCollege: decimal('value_to_college', { precision: 10, scale: 2 }),
  engagementNotes: text('engagement_notes'),
  resourcesSent: text('resources_sent'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const engagements = pgTable('engagements', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  dateOfContact: date('date_of_contact'),
  aiTrainingDelivered: text('ai_training_delivered'),
  notes: text('notes'),
  status: text('status'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const followUpActions = pgTable('follow_up_actions', {
  id: serial('id').primaryKey(),
  engagementId: integer('engagement_id').notNull().references(() => engagements.id, { onDelete: 'cascade' }),
  task: text('task').notNull(),
  dueDate: date('due_date'),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const additionalActivities = pgTable('additional_activities', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  additionalCourses: boolean('additional_courses').default(false),
  tLevels: boolean('t_levels').default(false),
  apprenticeships: boolean('apprenticeships').default(false),
  details: text('details'),
  numberOfLearners: integer('number_of_learners'),
  totalValue: decimal('total_value', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }), // Made optional
  name: text('name').notNull(),
  type: text('type'),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'Sector', 'Location', 'Engagement Type'
  createdAt: timestamp('created_at').defaultNow(),
});

export const companyTags = pgTable('company_tags', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    companyTagUnique: unique().on(table.companyId, table.tagId),
  };
});

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'Slide Deck', 'Guide', 'Video', 'Newsletter', 'Course Link'
  description: text('description'),
  link: text('link').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const resourceDistributions = pgTable('resource_distributions', {
  id: serial('id').primaryKey(),
  resourceId: integer('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
  dateSent: timestamp('date_sent').defaultNow(),
  clicks: integer('clicks').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});