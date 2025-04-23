import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { files, companies } from '../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';
import * as Sentry from '@sentry/node';
import formidable from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import * as cloudinary from 'cloudinary';
import { Readable } from 'stream';

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

// Helper function to convert buffer to stream
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable._read = () => {}; // _read is required but you can noop it
  readable.push(buffer);
  readable.push(null);
  return readable;
};

// Helper function to parse form data with formidable
const parseForm = async (req) => {
  return new Promise((resolve, reject) => {
    // Configure formidable to keep files in memory
    const form = formidable({
      maxFileSize: 20 * 1024 * 1024, // 20MB in bytes
      keepExtensions: true,
      multiples: true,
      // This is the key change - ensure files are kept in memory
      fileWriteStreamHandler: () => {
        let fileData = Buffer.alloc(0);
        return {
          write: (chunk) => {
            fileData = Buffer.concat([fileData, chunk]);
            return true;
          },
          end: () => {},
          data: () => fileData,
        };
      }
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

// Function to upload file to Cloudinary using buffer
const uploadToCloudinary = (fileBuffer, fileType) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: 'auto', // auto-detect file type
        folder: `gmfeip-crm/${process.env.VITE_PUBLIC_APP_ENV}`
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    
    bufferToStream(fileBuffer).pipe(uploadStream);
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
      
      console.log('Received file upload request with fields:', fields);
      
      if (!uploadedFiles.file) {
        console.error('No file found in upload request');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const file = uploadedFiles.file;
      console.log('File details:', {
        name: file.originalFilename,
        type: file.mimetype,
        size: file.size
      });
      
      // Extract companyId if provided
      let companyId = null;
      if (fields.companyId && fields.companyId !== 'null' && fields.companyId !== '') {
        try {
          companyId = parseInt(fields.companyId, 10);
          
          // Verify company exists if ID is provided
          if (companyId) {
            const company = await db.select({ id: companies.id })
              .from(companies)
              .where(eq(companies.id, companyId))
              .limit(1);
              
            if (company.length === 0) {
              console.error(`Company with ID ${companyId} not found`);
              return res.status(400).json({ error: `Company with ID ${companyId} not found` });
            }
          }
        } catch (error) {
          console.error('Error parsing companyId:', error);
          Sentry.captureException(error);
          return res.status(400).json({ error: 'Invalid company ID format' });
        }
      }
      
      try {
        console.log('Uploading file to Cloudinary...');
        
        // Get the file buffer from the custom stream handler
        const fileBuffer = file.toJSON ? file.toJSON().data : file._writeStream?.data();
        
        if (!fileBuffer) {
          throw new Error('No file data found in the uploaded file');
        }
        
        console.log(`Got file buffer with size: ${fileBuffer.length} bytes`);
        
        // Upload file to Cloudinary using the buffer
        const result = await uploadToCloudinary(fileBuffer, file.mimetype);
        
        console.log('Cloudinary upload successful:', result.secure_url);
        
        // Prepare file data for database
        const fileData = {
          name: file.originalFilename,
          type: file.mimetype,
          url: result.secure_url,
        };
        
        // Only include companyId if it's provided and valid
        if (companyId) {
          fileData.companyId = companyId;
        }
        
        console.log('Inserting file data into database:', fileData);
        // Save file info to database
        const insertResult = await db.insert(files).values(fileData).returning();
        
        return res.status(201).json(insertResult[0]);
      } catch (cloudinaryError) {
        console.error('Error during Cloudinary upload:', cloudinaryError);
        Sentry.captureException(cloudinaryError, {
          extra: {
            fileName: file.originalFilename,
            fileType: file.mimetype,
            fileSize: file.size,
            formData: fields,
            uploadOption: fields.uploadOption
          }
        });
        return res.status(500).json({ 
          error: 'Failed to upload file to cloud storage',
          details: cloudinaryError.message
        });
      }
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