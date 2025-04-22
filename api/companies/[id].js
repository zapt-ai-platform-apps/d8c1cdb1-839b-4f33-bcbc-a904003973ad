import { companies, companyTags, tags, engagements, additionalActivities, files } from '../../drizzle/schema.js';
import { getDB, handleApiError, authenticateUser } from '../_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    // Extract id from either query params or URL path segments
    // Normalize how we get the ID parameter from different environments
    const rawId = req.query.id || req.url.split('/').pop();
    
    console.log(`[API] ${req.method} /api/companies/${rawId}`, { 
      query: req.query,
      url: req.url,
      headers: {
        contentType: req.headers['content-type'],
        accept: req.headers['accept']
      }
    });
    
    if (!rawId) {
      console.error('Company ID is missing');
      return res.status(400).json({ error: 'Company ID is required' });
    }
    
    // Handle potential BigInt IDs (for IDs like 1065784524843483100)
    let companyId;
    try {
      companyId = BigInt(rawId);
      // Convert back to number for DB operations if within safe integer range
      if (companyId <= Number.MAX_SAFE_INTEGER) {
        companyId = Number(companyId);
      }
    } catch (error) {
      console.error(`Invalid company ID format: ${rawId}`, error);
      return res.status(400).json({ error: 'Invalid company ID format' });
    }
    
    const db = getDB();
    
    // Check response headers based on what client expects
    res.setHeader('Content-Type', 'application/json');
    
    // GET - retrieve company with all related data
    if (req.method === 'GET') {
      // Get company details
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId)
      });
      
      if (!company) {
        console.log(`Company not found: ${companyId}`);
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
      
      console.log(`Successfully retrieved company data for ID: ${companyId}`);
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
          sector: company.sector,
          aiToolsDelivered: company.aiToolsDelivered,
          additionalSignUps: company.additionalSignUps,
          valueToCollege: company.valueToCollege,
          engagementNotes: company.engagementNotes,
          resourcesSent: company.resourcesSent,
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
      
      console.log(`Successfully updated company ID: ${companyId}`);
      return res.status(200).json(updatedCompany);
    } 
    
    // DELETE - delete company
    else if (req.method === 'DELETE') {
      await db
        .delete(companies)
        .where(eq(companies.id, companyId));
      
      console.log(`Successfully deleted company ID: ${companyId}`);
      return res.status(204).send();
    } 
    
    // Unsupported method
    else {
      console.log(`Unsupported method: ${req.method}`);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: `/api/companies/${req.query?.id}`,
      url: req.url,
      body: req.body
    });
  }
}