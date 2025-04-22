import { companies, companyTags, tags } from '../drizzle/schema.js';
import { getDB, handleApiError, authenticateUser } from './_apiUtils.js';
import { desc } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/companies`);
  const db = getDB();
  
  try {
    // GET - list all companies
    if (req.method === 'GET') {
      const allCompanies = await db.query.companies.findMany({
        orderBy: [desc(companies.createdAt)]
      });
      console.log(`Retrieved ${allCompanies.length} companies`);
      return res.status(200).json(allCompanies);
    } 
    
    // POST - create a new company
    else if (req.method === 'POST') {
      const { company, tagIds = [] } = req.body;
      
      if (!company || !company.name) {
        return res.status(400).json({ error: 'Company name is required' });
      }
      
      // Insert company data
      const [newCompany] = await db
        .insert(companies)
        .values({
          name: company.name,
          industry: company.industry || null,
          location: company.location || null,
          contactName: company.contactName || null,
          contactRole: company.contactRole || null,
          email: company.email || null,
          phone: company.phone || null,
          website: company.website || null,
          socialMedia: company.socialMedia || null,
          sector: company.sector || null,
          aiToolsDelivered: company.aiToolsDelivered || null,
          additionalSignUps: company.additionalSignUps || null,
          valueToCollege: company.valueToCollege || null,
          engagementNotes: company.engagementNotes || null,
          resourcesSent: company.resourcesSent || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      // Insert tag associations if any
      if (tagIds.length > 0) {
        const tagValues = tagIds.map(tagId => ({
          companyId: newCompany.id,
          tagId: tagId,
        }));
        
        await db.insert(companyTags).values(tagValues);
      }
      
      console.log(`Created new company with ID: ${newCompany.id}`);
      return res.status(201).json(newCompany);
    } 
    
    // Other methods
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: '/api/companies',
      body: req.method === 'POST' ? req.body : undefined
    });
  }
}