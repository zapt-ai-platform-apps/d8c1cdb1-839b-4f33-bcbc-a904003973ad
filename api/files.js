import { files } from '../drizzle/schema.js';
import { getDB, handleApiError } from './_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`[API] ${req.method} /api/files`);
  const db = getDB();
  
  try {
    // GET - retrieve files for a company
    if (req.method === 'GET') {
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const results = await db
        .select()
        .from(files)
        .where(eq(files.companyId, Number(companyId)));
      
      return res.status(200).json(results);
    } 
    
    // POST - add new file
    else if (req.method === 'POST') {
      const { file } = req.body;
      
      const [newFile] = await db
        .insert(files)
        .values({
          companyId: file.companyId,
          name: file.name,
          type: file.type,
          url: file.url,
        })
        .returning();
      
      return res.status(201).json(newFile);
    } 
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: '/api/files',
      body: req.body,
      query: req.query
    });
  }
}