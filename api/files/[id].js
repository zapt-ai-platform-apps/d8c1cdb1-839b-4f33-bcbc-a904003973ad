import { files } from '../../drizzle/schema.js';
import { getDB, handleApiError } from '../_apiUtils.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`[API] ${req.method} /api/files/${id}`);
  
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid file ID' });
  }
  
  const fileId = Number(id);
  const db = getDB();
  
  try {
    // DELETE - delete file
    if (req.method === 'DELETE') {
      await db
        .delete(files)
        .where(eq(files.id, fileId));
      
      return res.status(204).send();
    }
    
    // Unsupported method
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return handleApiError(error, res, {
      method: req.method,
      endpoint: `/api/files/${id}`
    });
  }
}