import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, BuildingOfficeIcon, MagnifyingGlassIcon, TagIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/modules/core/components/LoadingSpinner';
import PageHeader from '@/modules/core/components/PageHeader';
import * as Sentry from '@sentry/browser';

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        console.log("Fetching companies...");
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (searchTerm) {
          queryParams.append('search', searchTerm);
        }
        if (selectedTags.length > 0) {
          queryParams.append('tagIds', selectedTags.join(','));
        }
        
        const response = await fetch(`/api/companies?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        
        const data = await response.json();
        console.log("Companies data received:", data);
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setError(error.message);
        Sentry.captureException(error, {
          extra: {
            component: 'CompanyList',
            action: 'fetchCompanies',
            searchTerm,
            selectedTags
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [searchTerm, selectedTags]);
  
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
            component: 'CompanyList',
            action: 'fetchTags'
          }
        });
      }
    };

    fetchTags();
  }, []);
  
  const handleTagToggle = (tagId) => {
    setSelectedTags(prevSelected => {
      if (prevSelected.includes(tagId)) {
        return prevSelected.filter(id => id !== tagId);
      } else {
        return [...prevSelected, tagId];
      }
    });
  };
  
  // Group tags by type
  const tagsByType = tags.reduce((acc, tag) => {
    if (!acc[tag.type]) {
      acc[tag.type] = [];
    }
    acc[tag.type].push(tag);
    return acc;
  }, {});
  
  const renderTagFilters = () => {
    return Object.entries(tagsByType).map(([type, typeTags]) => (
      <div key={type} className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">{type}</h3>
        <div className="flex flex-wrap gap-2">
          {typeTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                selectedTags.includes(tag.id)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    ));
  };
  
  if (loading) {
    return <LoadingSpinner size="large" message="Loading companies..." />;
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-medium text-red-600 mb-4">Error Loading Companies</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Companies" 
        description="Manage and view all companies engaged with the GMFEIP programme"
        actionLabel="Add Company"
        actionLink="/companies/new"
        actionIcon={PlusIcon}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1 border bg-white rounded-lg shadow-sm p-4">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Search</h3>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search companies..."
                className="form-input pl-10 box-border"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center mb-3">
              <TagIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            </div>
            {renderTagFilters()}
          </div>
          
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>
        
        {/* Companies list */}
        <div className="lg:col-span-3">
          {companies.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-500 mb-4">
                {selectedTags.length > 0 || searchTerm
                  ? "No companies match your search criteria."
                  : "Start by adding your first company."}
              </p>
              <Link to="/companies/new" className="btn-primary inline-flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Company
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <Link to={`/companies/${company.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                            {company.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.industry || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.location || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.contactName ? (
                          <div>
                            <div>{company.contactName}</div>
                            {company.email && (
                              <div className="text-xs text-gray-400">{company.email}</div>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyList;