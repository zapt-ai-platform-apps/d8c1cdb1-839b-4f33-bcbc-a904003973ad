import { companies, companyTags, tags } from '../drizzle/schema.js';
import { getDB, handleApiError } from './_apiUtils.js';
import { eq, inArray, and, like } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/companies`);
  const db = getDB();
  
  try {
    // GET - retrieve companies, with optional filters
    if (req.method === 'GET') {
      const { search, tagIds, industryFilter, sectorFilter, locationFilter } = req.query;
      
      let query = db.select().from(companies);
      
      // Apply search filter
      if (search) {
        query = query.where(like(companies.name, `%${search}%`));
      }
      
      // Apply tag filters
      if (tagIds) {
        // Get company IDs that have the specified tags
        const tagList = tagIds.split(',').map(Number);
        const companiesWithTags = await db
          .select({ companyId: companyTags.companyId })
          .from(companyTags)
          .where(inArray(companyTags.tagId, tagList));
        
        const companyIdsWithTags = companiesWithTags.map(c => c.companyId);
        
        if (companyIdsWithTags.length > 0) {
          query = query.where(inArray(companies.id, companyIdsWithTags));
        } else {
          // No companies have these tags
          return res.status(200).json([]);
        }
      }
      
      // Apply industry filter
      if (industryFilter) {
        query = query.where(eq(companies.industry, industryFilter));
      }
      
      // Apply sector filter
      if (sectorFilter) {
        query = query.where(eq(companies.sector, sectorFilter));
      }
      
      // Apply location filter
      if (locationFilter) {
        query = query.where(eq(companies.location, locationFilter));
      }
      
      const results = await query;
      return res.status(200).json(results);
    } 
    
    // POST - create new company
    else if (req.method === 'POST') {
      const { company, tagIds = [] } = req.body;
      
      const [newCompany] = await db.insert(companies).values({
        name: company.name,
        industry: company.industry,
        location: company.location,
        contactName: company.contactName,
        contactRole: company.contactRole,
        email: company.email,
        phone: company.phone,
        website: company.website,
        socialMedia: company.socialMedia,
        sector: company.sector,
        aiToolsDelivered: company.aiToolsDelivered,
        additionalSignUps: company.additionalSignUps,
        valueToCollege: company.valueToCollege,
        engagementNotes: company.engagementNotes,
        resourcesSent: company.resourcesSent,
        updatedAt: new Date(),
      }).returning();
      
      if (tagIds.length > 0) {
        const tagValues = tagIds.map(tagId => ({
          companyId: newCompany.id,
          tagId: tagId,
        }));
        
        await db.insert(companyTags).values(tagValues);
      }
      
      return res.status(201).json(newCompany);
    } 
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: '/api/companies',
      body: req.body,
      query: req.query
    });
  }
}