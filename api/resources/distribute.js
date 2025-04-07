import { resourceDistributions, companyTags, tags } from '../../drizzle/schema.js';
import { getDB, handleApiError } from '../_apiUtils.js';
import { eq, inArray } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/resources/distribute`);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const db = getDB();
  
  try {
    const { resourceId, companyIds, tagIds } = req.body;
    
    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID is required' });
    }
    
    if ((!companyIds || companyIds.length === 0) && (!tagIds || tagIds.length === 0)) {
      return res.status(400).json({ error: 'Either company IDs or tag IDs must be provided' });
    }
    
    // Prepare distribution records
    const distributions = [];
    
    // Add company-specific distributions
    if (companyIds && companyIds.length > 0) {
      companyIds.forEach(companyId => {
        distributions.push({
          resourceId,
          companyId,
          dateSent: new Date(),
          clicks: 0,
          updatedAt: new Date(),
        });
      });
    }
    
    // Add tag-based distributions
    if (tagIds && tagIds.length > 0) {
      // For each tag, get all companies with that tag
      for (const tagId of tagIds) {
        const companiesWithTag = await db
          .select({ companyId: companyTags.companyId })
          .from(companyTags)
          .where(eq(companyTags.tagId, tagId));
        
        // Add a distribution for each company with this tag
        companiesWithTag.forEach(({ companyId }) => {
          // Check if this company is already in the distributions list
          const existingDistIndex = distributions.findIndex(d => 
            d.resourceId === resourceId && d.companyId === companyId);
          
          if (existingDistIndex === -1) {
            distributions.push({
              resourceId,
              companyId,
              tagId,
              dateSent: new Date(),
              clicks: 0,
              updatedAt: new Date(),
            });
          } else {
            // Company already in list, add the tag ID
            distributions[existingDistIndex].tagId = tagId;
          }
        });
      }
    }
    
    // Insert all distribution records
    const results = await db
      .insert(resourceDistributions)
      .values(distributions)
      .returning();
    
    return res.status(201).json({
      message: `Resource distributed to ${results.length} recipients`,
      distributions: results
    });
  } catch (error) {
    return handleApiError(error, res, {
      endpoint: '/api/resources/distribute',
      body: req.body
    });
  }
}