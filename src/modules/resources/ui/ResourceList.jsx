import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner, PageHeader } from '../../core';
import { api as resourcesApi } from '../api';
import * as Sentry from '@sentry/browser';

const ResourceList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchResources = async () => {
    try {
      setLoading(true);
      
      const data = await resourcesApi.getResources();
      setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
      setError(error.message);
      Sentry.captureException(error, {
        extra: {
          component: 'ResourceList',
          action: 'fetchResources'
        }
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchResources();
  }, []);
  
  if (loading) {
    return <LoadingSpinner size="large" message="Loading resources..." />;
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-medium text-red-600 mb-4">Error Loading Resources</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchResources} 
          className="btn-primary cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader 
        title="Resources" 
        description="Manage and distribute resources to companies"
        actionLabel="Add Resource"
        actionLink="/resources/new"
        actionIcon={PlusIcon}
      />
      
      {resources.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
          <p className="text-gray-500 mb-4">
            Start by adding your first resource to share with companies.
          </p>
          <Link to="/resources/new" className="btn-primary inline-flex items-center cursor-pointer">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Resource
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resources.map(resource => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-blue-600 hover:text-blue-800">
                      <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        {resource.title}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resourcesApi.getResourceTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md truncate">
                      {resource.description || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/resources/${resource.id}/distribute`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Distribute
                    </Link>
                    <Link
                      to={`/resources/${resource.id}/edit`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResourceList;