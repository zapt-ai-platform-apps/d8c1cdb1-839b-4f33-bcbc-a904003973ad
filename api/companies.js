import { companies, companyTags, tags } from '../drizzle/schema.js';
import { getDB, handleApiError, authenticateUser } from './_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    console.log(`[API] ${req.method} /api/companies`);
    
    const db = getDB();
    
    // GET - list all companies
    if (req.method === 'GET') {
      const allCompanies = await db.select().from(companies);
      
      // For each company, get its tags
      const companiesWithTags = await Promise.all(
        allCompanies.map(async (company) => {
          const companyTagsResult = await db
            .select({
              id: tags.id,
              name: tags.name,
              type: tags.type,
            })
            .from(companyTags)
            .innerJoin(tags, eq(companyTags.tagId, tags.id))
            .where(eq(companyTags.companyId, company.id));
          
          return {
            ...company,
            tags: companyTagsResult,
          };
        })
      );
      
      return res.status(200).json(companiesWithTags);
    } 
    
    // POST - create a new company
    else if (req.method === 'POST') {
      const { company, tagIds = [] } = req.body;
      
      // Process tagIds to handle potentially large values
      const processedTagIds = tagIds.map(tagId => {
        const numericTagId = Number(tagId);
        if (!Number.isSafeInteger(numericTagId) || isNaN(numericTagId)) {
          return BigInt(tagId);
        }
        return numericTagId;
      });

      // Create the company
      const [newCompany] = await db
        .insert(companies)
        .values({
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
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      // Add tags if any
      if (processedTagIds.length > 0) {
        const tagValues = processedTagIds.map(tagId => ({
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
      body: req.body
    });
  }
}