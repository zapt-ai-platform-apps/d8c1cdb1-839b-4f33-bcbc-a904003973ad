import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api as resourcesApi } from '../api';
import { api as tagsApi } from '../../tags/api';
import { PageHeader } from '../../core'; // Fixed import path
import { LoadingSpinner } from '../../core';
import Select from 'react-select';
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
      
      console.log('Preparing to upload file:', file.name);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to upload file. Please try again later.';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            console.error('File upload error details:', errorData.details || 'No details provided');
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
      if (uploadOption === 'file' && file) {
        console.log('Uploading file before saving resource');
        const uploadedFile = await uploadFile();
        if (!uploadedFile) {
          setSaving(false);
          return; // Exit if file upload failed
        }
        
        // Use the file's URL for the resource link
        resourceData.link = uploadedFile.url;
        
        // Store file metadata
        resourceData.fileName = uploadedFile.name;
        resourceData.fileType = uploadedFile.type;
        resourceData.fileSize = file.size;
      } else if (uploadOption === 'link') {
        // Clear file metadata when using a link
        resourceData.fileName = null;
        resourceData.fileType = null;
        resourceData.fileSize = null;
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