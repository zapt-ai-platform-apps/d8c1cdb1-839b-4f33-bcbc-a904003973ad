import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api as resourcesApi } from '../api';
import { PageHeader } from '../../core';
import { LoadingSpinner } from '../../core';
import { eventBus } from '../../core/events';
import { events as resourceEvents } from '../events';
import * as Sentry from '@sentry/browser';

const ResourceForm = () => {
  const [resource, setResource] = useState({
    title: '',
    type: 'Slide Deck',
    description: '',
    link: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [file, setFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadOption, setUploadOption] = useState('link'); // Default to link option
  const [cloudinaryStatus, setCloudinaryStatus] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const resourceTypes = [
    'Slide Deck',
    'Guide',
    'Video',
    'Newsletter',
    'Course Link',
    'Document'
  ];
  
  useEffect(() => {
    // If editing, fetch the resource data
    if (isEditing) {
      const fetchResourceData = async () => {
        try {
          setLoading(true);
          const data = await resourcesApi.getResourceById(parseInt(id, 10));
          setResource(data);
          
          // Determine if this resource has a file or link
          if (data.fileName) {
            setUploadOption('file');
            setUploadFileName(data.fileName);
          } else {
            setUploadOption('link');
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching resource:', error);
          Sentry.captureException(error, {
            extra: { component: 'ResourceForm', action: 'fetchResourceData', resourceId: id }
          });
          setError('Failed to load resource. Please try again.');
          setLoading(false);
        }
      };
      
      fetchResourceData();
    }
  }, [id, isEditing]);
  
  // Check Cloudinary configuration on mount
  useEffect(() => {
    const checkCloudinaryConfig = async () => {
      if (uploadOption === 'file') {
        try {
          // Make a simple request to verify Cloudinary configuration
          const response = await fetch('/api/files', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          // If the request is successful, we'll assume Cloudinary is configured
          if (response.ok) {
            setCloudinaryStatus('ready');
          } else {
            // Try to get detailed error information
            const data = await response.json();
            if (data.error && data.error.includes('Cloudinary')) {
              setCloudinaryStatus('error');
              setUploadError('File upload service is not properly configured. Please contact your administrator.');
            }
          }
        } catch (error) {
          console.error('Error checking Cloudinary configuration:', error);
          // Don't set an error message yet since the user might not upload a file
        }
      }
    };
    
    checkCloudinaryConfig();
  }, [uploadOption]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setResource(prev => ({ ...prev, [name]: value }));
  };
  
  const handleOptionChange = (option) => {
    setUploadOption(option);
    
    // Clear file selection when switching to link option
    if (option === 'link') {
      setFile(null);
      setUploadFileName('');
    }
    
    // Focus the file input when switching to file option
    if (option === 'file' && fileInputRef.current) {
      setTimeout(() => {
        fileInputRef.current.click();
      }, 100);
    }
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('File selected:', selectedFile.name);
      setFile(selectedFile);
      setUploadFileName(selectedFile.name);
      setUploadError(null);
      setUploadOption('file');
    }
  };
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const uploadFile = async () => {
    if (!file) return null;
    
    try {
      setFileUploading(true);
      setUploadError(null);
      
      console.log('Preparing to upload file:', file.name, 'type:', file.type, 'size:', file.size);
      const formData = new FormData();
      formData.append('file', file);
      
      // Log the FormData to verify it contains the file
      console.log('FormData created with file attached');
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to upload file. Please try again later.';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            console.error('File upload error details:', errorData.details || 'No details provided');
            
            // Check for Cloudinary configuration errors
            if (errorMessage.includes('Cloudinary') || (errorData.details && errorData.details.includes('Cloudinary'))) {
              setCloudinaryStatus('error');
              errorMessage = 'The file upload service is not properly configured. Please contact your administrator.';
            }
          } else {
            const errorText = await response.text();
            console.error('Non-JSON error response:', errorText);
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      const uploadedFile = await response.json();
      console.log('File uploaded successfully:', uploadedFile);
      setFileUploading(false);
      
      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      Sentry.captureException(error, {
        extra: { 
          component: 'ResourceForm', 
          action: 'uploadFile', 
          fileName: file?.name,
          fileType: file?.type,
          fileSize: file?.size
        }
      });
      setUploadError(error.message || 'Failed to upload file. Please try again.');
      setFileUploading(false);
      return null;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      let resourceData = { ...resource };
      
      // If file option is selected and we have a file
      if (uploadOption === 'file') {
        // If we're editing and the file hasn't changed, we don't need to upload again
        if (isEditing && !file && resource.fileName) {
          console.log('Using existing file for resource');
        } 
        // Otherwise we need to upload the new file
        else if (file) {
          console.log('Uploading file before saving resource');
          const uploadedFile = await uploadFile();
          
          // Check if file upload failed and exit if so
          if (!uploadedFile) {
            console.error('File upload failed or was canceled');
            setError('File upload failed. Please check the error message and try again.');
            setSaving(false);
            return; // Exit early if file upload failed
          }
          
          // Use the file's URL for the resource link
          resourceData.link = uploadedFile.url;
          
          // Store file metadata
          resourceData.fileName = uploadedFile.name;
          resourceData.fileType = uploadedFile.type;
          resourceData.fileSize = file.size;
        } else {
          // We're in file mode but no file is selected
          setError('Please select a file to upload or switch to link mode.');
          setSaving(false);
          return;
        }
      } else if (uploadOption === 'link') {
        // Clear file metadata when using a link
        resourceData.fileName = null;
        resourceData.fileType = null;
        resourceData.fileSize = null;
        
        // Make sure we have a link
        if (!resourceData.link) {
          setError('Please enter a link or upload a file.');
          setSaving(false);
          return;
        }
      }
      
      console.log('Saving resource with data:', resourceData);
      
      // Save or update the resource
      if (isEditing) {
        await resourcesApi.updateResource(parseInt(id, 10), resourceData);
        eventBus.publish(resourceEvents.RESOURCE_UPDATED, { resource: resourceData });
      } else {
        const newResource = await resourcesApi.createResource(resourceData);
        eventBus.publish(resourceEvents.RESOURCE_CREATED, { resource: newResource });
      }
      
      // Navigate back to the resource list
      navigate('/resources');
    } catch (error) {
      console.error('Error saving resource:', error);
      Sentry.captureException(error, {
        extra: { component: 'ResourceForm', action: 'handleSubmit', resourceData: resource }
      });
      setError('Failed to save resource. Please try again.');
      setSaving(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={isEditing ? 'Edit Resource' : 'Add New Resource'}
        backLink="/resources"
      />
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {cloudinaryStatus === 'error' && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="font-medium">File Upload Configuration Issue</p>
          <p>The file upload service (Cloudinary) is not properly configured. Please contact your administrator to set up the required environment variables:</p>
          <ul className="list-disc ml-5 mt-2">
            <li>CLOUDINARY_CLOUD_NAME</li>
            <li>CLOUDINARY_API_KEY</li>
            <li>CLOUDINARY_API_SECRET</li>
          </ul>
          <p className="mt-2">You can still create resources with links instead of file uploads.</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={resource.title}
                onChange={handleChange}
                required
                className="form-input box-border w-full"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={resource.type}
                onChange={handleChange}
                required
                className="form-select w-full"
              >
                {resourceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={resource.description || ''}
                onChange={handleChange}
                rows={4}
                className="form-textarea box-border w-full"
                placeholder="Enter resource description..."
              />
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resource File/Link</h3>
              
              <div className="space-y-4">
                <div className="flex space-x-6 mb-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="uploadOption"
                      value="file"
                      checked={uploadOption === 'file'}
                      onChange={() => handleOptionChange('file')}
                      className="form-radio"
                    />
                    <span className="ml-2">Upload File</span>
                  </label>
                  
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="uploadOption"
                      value="link"
                      checked={uploadOption === 'link'}
                      onChange={() => handleOptionChange('link')}
                      className="form-radio"
                    />
                    <span className="ml-2">Add Link</span>
                  </label>
                </div>
                
                {uploadOption === 'file' && (
                  <div className="ml-6 mt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      id="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <div className="flex flex-col space-y-2">
                      <div 
                        onClick={handleUploadClick}
                        className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:bg-gray-50"
                      >
                        <span className="text-sm truncate max-w-xs">
                          {uploadFileName || 'Click to select file'}
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-medium">
                          Browse
                        </span>
                      </div>
                      
                      {uploadError && (
                        <div className="text-red-600 text-sm mt-1">
                          {uploadError}
                        </div>
                      )}
                      
                      {fileUploading && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="text-sm text-gray-500">Uploading...</span>
                        </div>
                      )}
                      
                      {file && !fileUploading && !uploadError && (
                        <div className="text-green-600 text-sm mt-1">
                          File selected: {file.name}
                        </div>
                      )}
                      
                      {cloudinaryStatus === 'error' && (
                        <div className="text-yellow-600 text-sm mt-1">
                          <p>Note: File uploads are currently unavailable due to a configuration issue.</p>
                          <p>Please use the "Add Link" option instead.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {uploadOption === 'link' && (
                  <div className="ml-6 mt-2">
                    <input
                      type="url"
                      id="link"
                      name="link"
                      value={resource.link || ''}
                      onChange={handleChange}
                      className="form-input box-border w-full"
                      placeholder="https://..."
                      required={uploadOption === 'link'}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/resources')}
              className="btn-outline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || fileUploading}
              className="btn-primary cursor-pointer"
            >
              {saving || fileUploading ? 'Saving...' : isEditing ? 'Update Resource' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceForm;