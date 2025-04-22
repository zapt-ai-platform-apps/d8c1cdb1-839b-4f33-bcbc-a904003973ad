import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { files } from '../drizzle/schema.js';
import * as Sentry from '@sentry/node';
import { createReadStream, readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import formidable from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { mkdir } from 'fs/promises';
import * as cloudinary from 'cloudinary';

// Initialize Sentry
Sentry.init({
  dsn: process.env.VITE_PUBLIC_SENTRY_DSN,
  environment: process.env.VITE_PUBLIC_APP_ENV,
  initialScope: {
    tags: {
      type: 'backend',
      projectId: process.env.VITE_PUBLIC_APP_ID
    }
  }
});

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Export config to disable bodyParser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse form data with formidable
const parseForm = async (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 20 * 1024 * 1024, // 20MB in bytes
      keepExtensions: true,
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req, res) {
  console.log(`API: ${req.method} request to /api/files`);
  
  // Connect to the database
  const client = postgres(process.env.COCKROACH_DB_URL);
  const db = drizzle(client);

  try {
    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Get list of files, optionally filtered by companyId
      const companyId = req.query.companyId ? parseInt(req.query.companyId, 10) : null;
      
      let query = db.select().from(files);
      
      if (companyId) {
        query = query.where(eq(files.companyId, companyId));
      }
      
      const result = await query.orderBy(desc(files.createdAt));
      
      return res.status(200).json(result);
    } 
    else if (req.method === 'POST') {
      // Parse the form data
      const { fields, files: uploadedFiles } = await parseForm(req);
      
      if (!uploadedFiles.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const file = uploadedFiles.file;
      const companyId = fields.companyId ? parseInt(fields.companyId, 10) : null;
      
      // Upload file to Cloudinary
      const result = await cloudinary.v2.uploader.upload(file.filepath, {
        resource_type: 'auto', // auto-detect file type
        folder: `gmfeip-crm/${process.env.VITE_PUBLIC_APP_ENV}`
      });
      
      // Save file info to database
      const fileData = {
        name: file.originalFilename,
        type: file.mimetype,
        url: result.secure_url,
        companyId: companyId
      };
      
      const insertResult = await db.insert(files).values(fileData).returning();
      
      return res.status(201).json(insertResult[0]);
    } 
    else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error handling files request:', error);
    Sentry.captureException(error, {
      extra: {
        route: '/api/files',
        method: req.method,
        query: req.query
      }
    });
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  } finally {
    await client.end();
  }
}