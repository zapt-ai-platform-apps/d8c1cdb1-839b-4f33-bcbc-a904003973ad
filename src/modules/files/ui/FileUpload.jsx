import React, { useState } from 'react';
import { LinkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { api as filesApi } from '../api';
import * as Sentry from '@sentry/browser';

const FileUpload = ({ companyId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Link',
    url: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const fileTypes = ['Link', 'PDF', 'Slide Deck', 'Image', 'Video', 'Document'];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Simple validation
      if (!formData.name.trim()) {
        throw new Error('Please enter a name for the file/link');
      }
      
      if (!formData.url.trim()) {
        throw new Error('Please enter a valid URL');
      }
      
      const fileData = {
        companyId,
        name: formData.name,
        type: formData.type,
        url: formData.url
      };
      
      const result = await filesApi.createFile(fileData);
      
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error('Error adding file/link:', error);
      setError(error.message);
      Sentry.captureException(error, {
        extra: {
          component: 'FileUpload',
          action: 'addFile',
          formData
        }
      });
      setSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add File or Link</h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="form-label">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input box-border"
              placeholder="Enter a descriptive name..."
            />
          </div>
          
          <div>
            <label htmlFor="type" className="form-label">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-select"
            >
              {fileTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="url" className="form-label">URL <span className="text-red-500">*</span></label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex items-stretch flex-grow focus-within:z-10">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {formData.type === 'Link' ? (
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  required
                  className="form-input pl-10 box-border"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FileUpload;