import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LoadingSpinner from '@/modules/core/components/LoadingSpinner';
import * as Sentry from '@sentry/browser';

const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tags, setTags] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    location: '',
    contactName: '',
    contactRole: '',
    email: '',
    phone: '',
    website: '',
    socialMedia: '',
    selectedTags: []
  });
  
  // Fetch company data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchCompany = async () => {
        try {
          setLoading(true);
          console.log(`Fetching company data for ID: ${id}`);
          
          const response = await fetch(`/api/companies/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch company data');
          }
          
          const data = await response.json();
          console.log("Company data received:", data);
          
          setFormData({
            name: data.name || '',
            industry: data.industry || '',
            location: data.location || '',
            contactName: data.contactName || '',
            contactRole: data.contactRole || '',
            email: data.email || '',
            phone: data.phone || '',
            website: data.website || '',
            socialMedia: data.socialMedia || '',
            selectedTags: data.tags.map(tag => tag.id) || []
          });
        } catch (error) {
          console.error("Error fetching company:", error);
          setError(error.message);
          Sentry.captureException(error, {
            extra: {
              component: 'CompanyForm',
              action: 'fetchCompany',
              companyId: id
            }
          });
        } finally {
          setLoading(false);
        }
      };

      fetchCompany();
    }
  }, [id, isEditing]);
  
  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (!response.ok) {
          throw new Error('Failed to fetch tags');
        }
        
        const data = await response.json();
        setTags(data);
      } catch (error) {
        console.error("Error fetching tags:", error);
        Sentry.captureException(error, {
          extra: {
            component: 'CompanyForm',
            action: 'fetchTags'
          }
        });
      }
    };

    fetchTags();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagToggle = (tagId) => {
    setFormData(prev => {
      const selectedTags = [...prev.selectedTags];
      
      if (selectedTags.includes(tagId)) {
        return {
          ...prev,
          selectedTags: selectedTags.filter(id => id !== tagId)
        };
      } else {
        return {
          ...prev,
          selectedTags: [...selectedTags, tagId]
        };
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const company = {
        name: formData.name,
        industry: formData.industry,
        location: formData.location,
        contactName: formData.contactName,
        contactRole: formData.contactRole,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        socialMedia: formData.socialMedia
      };
      
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/companies/${id}` : '/api/companies';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company,
          tagIds: formData.selectedTags
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} company`);
      }
      
      const data = await response.json();
      navigate(isEditing ? `/companies/${id}` : `/companies/${data.id}`);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} company:`, error);
      setError(error.message);
      Sentry.captureException(error, {
        extra: {
          component: 'CompanyForm',
          action: isEditing ? 'updateCompany' : 'createCompany',
          formData
        }
      });
      setSubmitting(false);
    }
  };
  
  // Group tags by type
  const tagsByType = tags.reduce((acc, tag) => {
    if (!acc[tag.type]) {
      acc[tag.type] = [];
    }
    acc[tag.type].push(tag);
    return acc;
  }, {});
  
  if (loading) {
    return <LoadingSpinner size="large" message={`Loading company details...`} />;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Company' : 'Add New Company'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing 
            ? 'Update company information and tags'
            : 'Enter the company details to add it to the CRM'
          }
        </p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <label htmlFor="name" className="form-label">Company Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="form-input box-border"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="industry" className="form-label">Industry / Sector</label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="form-input box-border"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="location" className="form-label">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input box-border"
            />
          </div>
          
          <div className="sm:col-span-6 border-t border-gray-200 pt-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="contactName" className="form-label">Primary Contact Name</label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              className="form-input box-border"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="contactRole" className="form-label">Contact Role</label>
            <input
              type="text"
              id="contactRole"
              name="contactRole"
              value={formData.contactRole}
              onChange={handleChange}
              className="form-input box-border"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input box-border"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="phone" className="form-label">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input box-border"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="website" className="form-label">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="form-input box-border"
              placeholder="https://..."
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="socialMedia" className="form-label">Social Media</label>
            <input
              type="text"
              id="socialMedia"
              name="socialMedia"
              value={formData.socialMedia}
              onChange={handleChange}
              className="form-input box-border"
              placeholder="LinkedIn, Twitter, etc."
            />
          </div>
          
          <div className="sm:col-span-6 border-t border-gray-200 pt-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
            
            {Object.entries(tagsByType).map(([type, typeTags]) => (
              <div key={type} className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{type}</h4>
                <div className="flex flex-wrap gap-2">
                  {typeTags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                        formData.selectedTags.includes(tag.id)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end space-x-3">
          <Link
            to={isEditing ? `/companies/${id}` : '/companies'}
            className="btn-outline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;