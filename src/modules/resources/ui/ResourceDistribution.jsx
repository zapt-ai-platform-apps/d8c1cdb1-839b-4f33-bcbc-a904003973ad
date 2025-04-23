import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Select from 'react-select';
import { DocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../core';
import { api as resourcesApi } from '../api';
import { api as companiesApi } from '../../companies/api';
import { api as tagsApi } from '../../tags/api';
import * as Sentry from '@sentry/browser';

const ResourceDistribution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [resource, setResource] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Selected recipients
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Load resource data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch in parallel
        const [resourceData, companiesData, tagsData] = await Promise.all([
          resourcesApi.getResourceById(id),
          companiesApi.getCompanies(),
          tagsApi.getTags()
        ]);
        
        setResource(resourceData);
        setCompanies(companiesData);
        setTags(tagsData);
      } catch (error) {
        console.error("Error loading distribution data:", error);
        setError(error.message);
        Sentry.captureException(error, {
          extra: {
            component: 'ResourceDistribution',
            action: 'fetchResourceData',
            resourceId: id
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleDistribute = async (e) => {
    e.preventDefault();
    
    if (selectedCompanies.length === 0 && selectedTags.length === 0) {
      setError('Please select at least one company or tag to distribute to');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // FIXED: Pass id directly as string instead of using parseInt
      // This prevents precision loss with large numbers
      const result = await resourcesApi.distributeResource(
        id, // Directly use string ID from URL params
        selectedCompanies.map(c => c.value),
        selectedTags.map(t => t.value)
      );
      
      console.log('Distribution result:', result);
      setSuccess(true);
      
      // Reset selections
      setSelectedCompanies([]);
      setSelectedTags([]);
      
      // Auto-navigate back after a delay
      setTimeout(() => {
        navigate('/resources');
      }, 3000);
    } catch (error) {
      console.error("Error distributing resource:", error);
      setError(error.message);
      Sentry.captureException(error, {
        extra: {
          component: 'ResourceDistribution',
          action: 'distributeResource',
          resourceId: id,
          selectedCompanies: selectedCompanies.map(c => c.value),
          selectedTags: selectedTags.map(t => t.value)
        }
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner size="large" message="Loading resource details..." />;
  }
  
  if (!resource) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-medium text-red-600 mb-4">Resource Not Found</h2>
        <Link to="/resources" className="btn-primary">
          Back to Resources
        </Link>
      </div>
    );
  }
  
  // Format companies for react-select
  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));
  
  // Group tags by type for react-select
  const tagOptionsByGroup = tags.reduce((acc, tag) => {
    if (!acc[tag.type]) {
      acc[tag.type] = [];
    }
    
    acc[tag.type].push({
      value: tag.id,
      label: tag.name
    });
    
    return acc;
  }, {});
  
  // Format tags for react-select with groups
  const tagOptions = Object.entries(tagOptionsByGroup).map(([group, options]) => ({
    label: group,
    options
  }));
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Distribute Resource</h1>
        <p className="mt-1 text-sm text-gray-500">
          Send this resource to selected companies or groups
        </p>
      </div>
      
      {/* Resource Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <DocumentIcon className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-medium text-gray-900">{resource.title}</h2>
            
            <div className="mt-2 flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resourcesApi.getResourceTypeColor(resource.type)}`}>
                {resource.type}
              </span>
              <a 
                href={resource.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-3 text-sm text-blue-600 hover:text-blue-800"
              >
                View Resource
              </a>
            </div>
            
            {resource.description && (
              <p className="mt-3 text-sm text-gray-600">{resource.description}</p>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
          <CheckIcon className="h-5 w-5 mr-2" />
          <p>Resource successfully distributed. Redirecting back to resources list...</p>
        </div>
      )}
      
      <form onSubmit={handleDistribute} className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <label className="form-label">Select Companies</label>
            <div className="mt-1">
              <Select
                isMulti
                options={companyOptions}
                value={selectedCompanies}
                onChange={setSelectedCompanies}
                placeholder="Select companies to receive this resource..."
                className="basic-multi-select"
                classNamePrefix="select"
              />
              <p className="mt-1 text-xs text-gray-500">
                {selectedCompanies.length} companies selected
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-sm text-gray-500">Or</span>
            </div>
          </div>
          
          <div>
            <label className="form-label">Select Tags (Distribute to all companies with these tags)</label>
            <div className="mt-1">
              <Select
                isMulti
                options={tagOptions}
                value={selectedTags}
                onChange={setSelectedTags}
                placeholder="Select tags to target companies..."
                className="basic-multi-select"
                classNamePrefix="select"
              />
              <p className="mt-1 text-xs text-gray-500">
                {selectedTags.length} tags selected
              </p>
            </div>
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
            disabled={submitting || success || (selectedCompanies.length === 0 && selectedTags.length === 0)}
            className="btn-primary cursor-pointer"
          >
            {submitting ? 'Distributing...' : 'Send Resource'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResourceDistribution;