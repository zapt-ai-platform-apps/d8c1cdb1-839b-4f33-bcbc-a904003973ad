import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { files, companies } from '../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';
import * as Sentry from '@sentry/node';
import formidable from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import * as cloudinary from 'cloudinary';
import fs from 'fs';
import path from 'path';

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

// Validate Cloudinary config - improved validation
const validateCloudinaryConfig = () => {
  const requiredVars = [
    { name: 'CLOUDINARY_CLOUD_NAME', value: process.env.CLOUDINARY_CLOUD_NAME },
    { name: 'CLOUDINARY_API_KEY', value: process.env.CLOUDINARY_API_KEY },
    { name: 'CLOUDINARY_API_SECRET', value: process.env.CLOUDINARY_API_SECRET }
  ];
  
  const missingVars = requiredVars.filter(v => !v.value || v.value.trim() === '');
  
  if (missingVars.length) {
    const missingNames = missingVars.map(v => v.name);
    console.error(`Missing or empty Cloudinary environment variables: ${missingNames.join(', ')}`);
    throw new Error(`Missing or empty Cloudinary environment variables: ${missingNames.join(', ')}`);
  }
  
  console.log('Cloudinary configuration validated successfully');
  return true;
};

// Export config to disable bodyParser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse form data with formidable
const parseForm = async (req) => {
  return new Promise((resolve, reject) => {
    // Create a temporary directory for files
    const tmpDir = path.join('/tmp', uuidv4());
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
    } catch (err) {
      console.error('Error creating temp directory:', err);
      return reject(new Error('Failed to create temporary directory for file upload'));
    }
    
    console.log(`Created temp directory: ${tmpDir}`);
    
    // Configure formidable to save files to disk first
    const form = formidable({
      maxFileSize: 20 * 1024 * 1024, // 20MB in bytes
      keepExtensions: true,
      multiples: true,
      uploadDir: tmpDir,
      filename: (name, ext, part) => {
        // Keep original filename with extensions
        return `${part.originalFilename}`;
      }
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Formidable parse error:', err);
        // Cleanup temp files
        try {
          if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          }
        } catch (cleanupErr) {
          console.error('Error cleaning up temp files:', cleanupErr);
        }
        return reject(err);
      }
      
      // Log the parsed form data for debugging
      console.log('Parsed form fields:', fields);
      console.log('Parsed files:', Object.keys(files));
      
      if (files.file) {
        const fileDetails = Array.isArray(files.file) ? files.file[0] : files.file;
        console.log('File details:', {
          name: fileDetails.originalFilename,
          path: fileDetails.filepath,
          type: fileDetails.mimetype,
          size: fileDetails.size
        });
      } else {
        console.error('No file found in form data with key "file"');
      }
      
      resolve({ fields, files, tmpDir });
    });
  });
};

// Function to upload file to Cloudinary with better error handling
const uploadToCloudinary = async (filePath, fileType) => {
  console.log(`Uploading file from path: ${filePath}, type: ${fileType}`);
  
  // Verify file exists at the path
  if (!fs.existsSync(filePath)) {
    console.error(`File not found at path: ${filePath}`);
    throw new Error(`File not found at path: ${filePath}`);
  }
  
  // Get file size for logging
  const stats = fs.statSync(filePath);
  console.log(`File size: ${stats.size} bytes`);
  
  try {
    console.log('Starting Cloudinary upload...');
    
    // Verify Cloudinary is properly configured before uploading
    validateCloudinaryConfig();
    
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'auto', // auto-detect file type
        folder: `gmfeip-crm/${process.env.VITE_PUBLIC_APP_ENV || 'dev'}`,
        use_filename: true,
        unique_filename: true
      };
      
      console.log('Cloudinary upload options:', uploadOptions);
      
      cloudinary.v2.uploader.upload(
        filePath,
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in uploadToCloudinary:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  console.log(`API: ${req.method} request to /api/files`);
  
  // Connect to the database
  const client = postgres(process.env.COCKROACH_DB_URL);
  const db = drizzle(client);
  
  let tmpDir = null;

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
      // Validate Cloudinary config before proceeding
      try {
        validateCloudinaryConfig();
      } catch (configError) {
        console.error('Cloudinary configuration error:', configError.message);
        Sentry.captureException(configError, {
          extra: {
            route: '/api/files',
            method: req.method,
            action: 'upload validation'
          }
        });
        return res.status(500).json({ 
          error: 'The file upload service is not properly configured. Please contact your administrator.',
          details: configError.message
        });
      }
      
      console.log('Parsing form data...');
      // Parse the form data
      const { fields, files: uploadedFiles, tmpDir: tempDir } = await parseForm(req);
      tmpDir = tempDir;
      
      console.log('Received file upload request with fields:', fields);
      
      if (!uploadedFiles.file) {
        console.error('No file found in upload request with key "file"');
        return res.status(400).json({ 
          error: 'Missing required parameter – file',
          message: 'No file was found in the upload request. Ensure you are sending a file with the key "file".'
        });
      }
      
      const file = Array.isArray(uploadedFiles.file) ? uploadedFiles.file[0] : uploadedFiles.file;
      console.log('File received:', {
        name: file.originalFilename,
        type: file.mimetype,
        size: file.size,
        filepath: file.filepath
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
        
        // Upload file to Cloudinary using the file path
        const result = await uploadToCloudinary(file.filepath, file.mimetype);
        
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
        
        // Return a more detailed error message
        return res.status(500).json({ 
          error: 'Failed to upload file to cloud storage',
          details: cloudinaryError.message || 'Unknown Cloudinary error occurred',
          suggestion: 'Please check Cloudinary configuration variables and credentials'
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
    // Clean up temporary directory if it exists
    if (tmpDir) {
      try {
        if (fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          console.log(`Cleaned up temp directory: ${tmpDir}`);
        }
      } catch (cleanupErr) {
        console.error('Error cleaning up temp files:', cleanupErr);
      }
    }
    
    await client.end();
  }
}