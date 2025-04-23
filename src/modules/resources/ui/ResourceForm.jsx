import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LoadingSpinner } from '../../core';
import { api as resourcesApi } from '../api';
import { useDropzone } from 'react-dropzone';
import * as Sentry from '@sentry/browser';

const ResourceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadOption, setUploadOption] = useState('link'); // 'link' or 'file'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'Slide Deck',
    description: '',
    link: ''
  });
  
  const resourceTypes = [
    'Slide Deck',
    'Guide',
    'Video',
    'Newsletter',
    'Course Link'
  ];
  
  // Fetch resource data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchResource = async () => {
        try {
          setLoading(true);
          const data = await resourcesApi.getResourceById(id);
          
          setFormData({
            title: data.title || '',
            type: data.type || 'Slide Deck',
            description: data.description || '',
            link: data.link || ''
          });
        } catch (error) {
          console.error("Error fetching resource:", error);
          setError(error.message);
          Sentry.captureException(error, {
            extra: {
              component: 'ResourceForm',
              action: 'fetchResource',
              resourceId: id
            }
          });
        } finally {
          setLoading(false);
        }
      };

      fetchResource();
    }
  }, [id, isEditing]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadFile(file);
      
      // Update form data with file information
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.split('.')[0], // Use filename as default title if empty
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }));
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'video/mp4': ['.mp4'],
      'application/zip': ['.zip']
    }
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // If we're using file upload, upload the file first
      if (uploadOption === 'file' && uploadFile) {
        console.log('Preparing to upload file:', {
          fileName: uploadFile.name,
          fileSize: uploadFile.size,
          fileType: uploadFile.type
        });
        
        const formDataUpload = new FormData();
        formDataUpload.append('file', uploadFile);
        
        console.log('Sending file upload request...');
        const response = await fetch('/api/files', {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (!response.ok) {
          // Try to get more detailed error information from the response
          let errorMessage = 'Failed to upload file';
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = `${errorMessage}: ${errorData.error}`;
            }
            if (errorData.details) {
              errorMessage = `${errorMessage} - ${errorData.details}`;
            }
          } catch (e) {
            // If we can't parse the error response, just use the status
            errorMessage = `${errorMessage} (Status: ${response.status})`;
          }
          
          console.error('File upload failed:', errorMessage);
          throw new Error(errorMessage);
        }
        
        console.log('File upload successful!');
        const fileData = await response.json();
        
        // Update formData with the file URL
        setFormData(prev => ({
          ...prev,
          link: fileData.url,
        }));
      }
      
      // Create or update the resource
      let result;
      if (isEditing) {
        console.log('Updating resource:', { id, formData });
        result = await resourcesApi.updateResource(id, formData);
      } else {
        console.log('Creating new resource:', formData);
        result = await resourcesApi.createResource(formData);
      }
      
      navigate('/resources');
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} resource:`, error);
      setError(error.message || 'An unknown error occurred');
      Sentry.captureException(error, {
        extra: {
          component: 'ResourceForm',
          action: isEditing ? 'updateResource' : 'createResource',
          uploadOption,
          fileDetails: uploadFile ? {
            name: uploadFile.name,
            size: uploadFile.size,
            type: uploadFile.type
          } : null,
          formData
        }
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner size="large" message={`Loading resource details...`} />;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Resource' : 'Add New Resource'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing 
            ? 'Update resource information'
            : 'Create a new resource to share with companies'
          }
        </p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="form-label">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="form-input box-border"
              placeholder="Resource title"
            />
          </div>
          
          <div>
            <label htmlFor="type" className="form-label">Type <span className="text-red-500">*</span></label>
            <select
              id="type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="form-select"
            >
              {resourceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="form-textarea box-border"
              placeholder="Provide a brief description of this resource..."
            />
          </div>
          
          <div>
            <label className="form-label mb-2">Resource Source <span className="text-red-500">*</span></label>
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setUploadOption('link')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  uploadOption === 'link' 
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                External Link
              </button>
              <button
                type="button"
                onClick={() => setUploadOption('file')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  uploadOption === 'file' 
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                Upload File
              </button>
            </div>
            
            {uploadOption === 'link' ? (
              <div>
                <label htmlFor="link" className="form-label">Link URL <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="link"
                  name="link"
                  required
                  value={formData.link}
                  onChange={handleChange}
                  className="form-input box-border"
                  placeholder="https://"
                />
              </div>
            ) : (
              <div>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  {uploadFile ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">{uploadFile.name}</div>
                      <div className="text-xs text-gray-500">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, Word, PowerPoint, Excel, images, videos, or ZIP (max 20MB)
                      </p>
                    </div>
                  )}
                </div>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploading: {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end space-x-3">
          <Link
            to="/resources"
            className="btn-outline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || (uploadOption === 'file' && !uploadFile)}
            className={`btn-primary cursor-pointer ${
              (submitting || (uploadOption === 'file' && !uploadFile)) ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResourceForm;