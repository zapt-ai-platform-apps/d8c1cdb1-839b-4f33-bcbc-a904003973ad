import { companies, companyTags, tags, engagements, additionalActivities, files } from '../../drizzle/schema.js';
import { getDB, handleApiError } from '../_apiUtils.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`[API] ${req.method} /api/companies/${id}`);
  
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid company ID' });
  }
  
  const companyId = Number(id);
  const db = getDB();
  
  try {
    // GET - retrieve company with all related data
    if (req.method === 'GET') {
      // Get company details
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId)
      });
      
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      // Get company tags
      const companyTagsResult = await db
        .select({
          id: tags.id,
          name: tags.name,
          type: tags.type,
        })
        .from(companyTags)
        .innerJoin(tags, eq(companyTags.tagId, tags.id))
        .where(eq(companyTags.companyId, companyId));
      
      // Get company engagements
      const companyEngagements = await db
        .select()
        .from(engagements)
        .where(eq(engagements.companyId, companyId));
      
      // Get company additional activities
      const companyActivities = await db
        .select()
        .from(additionalActivities)
        .where(eq(additionalActivities.companyId, companyId));
      
      // Get company files
      const companyFiles = await db
        .select()
        .from(files)
        .where(eq(files.companyId, companyId));
      
      // Combine all data
      const fullCompanyData = {
        ...company,
        tags: companyTagsResult,
        engagements: companyEngagements,
        activities: companyActivities,
        files: companyFiles
      };
      
      return res.status(200).json(fullCompanyData);
    } 
    
    // PUT - update company
    else if (req.method === 'PUT') {
      const { company, tagIds = [] } = req.body;
      
      // Update company details
      const [updatedCompany] = await db
        .update(companies)
        .set({
          name: company.name,
          industry: company.industry,
          location: company.location,
          contactName: company.contactName,
          contactRole: company.contactRole,
          email: company.email,
          phone: company.phone,
          website: company.website,
          socialMedia: company.socialMedia,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId))
        .returning();
      
      // Delete existing tags and add new ones
      await db
        .delete(companyTags)
        .where(eq(companyTags.companyId, companyId));
      
      if (tagIds.length > 0) {
        const tagValues = tagIds.map(tagId => ({
          companyId: companyId,
          tagId: tagId,
        }));
        
        await db.insert(companyTags).values(tagValues);
      }
      
      return res.status(200).json(updatedCompany);
    } 
    
    // DELETE - delete company
    else if (req.method === 'DELETE') {
      await db
        .delete(companies)
        .where(eq(companies.id, companyId));
      
      return res.status(204).send();
    } 
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: `/api/companies/${id}`,
      body: req.body
    });
  }
}