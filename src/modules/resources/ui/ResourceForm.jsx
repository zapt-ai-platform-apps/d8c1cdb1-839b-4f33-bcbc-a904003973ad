import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LoadingSpinner } from '../../core';
import { api as resourcesApi } from '../api';
import * as Sentry from '@sentry/browser';

const ResourceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      let result;
      if (isEditing) {
        result = await resourcesApi.updateResource(id, formData);
      } else {
        result = await resourcesApi.createResource(formData);
      }
      
      navigate('/resources');
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} resource:`, error);
      setError(error.message);
      Sentry.captureException(error, {
        extra: {
          component: 'ResourceForm',
          action: isEditing ? 'updateResource' : 'createResource',
          formData
        }
      });
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
            <label htmlFor="link" className="form-label">Link <span className="text-red-500">*</span></label>
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

export default ResourceForm;