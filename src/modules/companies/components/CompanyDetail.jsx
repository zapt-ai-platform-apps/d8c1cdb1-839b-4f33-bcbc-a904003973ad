import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  LinkIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  TagIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/modules/core/components/LoadingSpinner';
import EngagementList from '@/modules/engagements/components/EngagementList';
import EngagementForm from '@/modules/engagements/components/EngagementForm';
import ActivityList from '@/modules/activities/components/ActivityList';
import ActivityForm from '@/modules/activities/components/ActivityForm';
import FileList from '@/modules/files/components/FileList';
import FileUpload from '@/modules/files/components/FileUpload';
import * as Sentry from '@sentry/browser';

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEngagementForm, setShowEngagementForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  // Fetch company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching company data for ID: ${id}`);
        
        const response = await fetch(`/api/companies/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch company data');
        }
        
        const data = await response.json();
        console.log("Company data received:", data);
        setCompany(data);
      } catch (error) {
        console.error("Error fetching company data:", error);
        setError(error.message);
        Sentry.captureException(error, {
          extra: {
            component: 'CompanyDetail',
            action: 'fetchCompanyData',
            companyId: id
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete company');
      }
      
      navigate('/companies', { replace: true });
    } catch (error) {
      console.error("Error deleting company:", error);
      alert('Failed to delete company');
      Sentry.captureException(error, {
        extra: {
          component: 'CompanyDetail',
          action: 'deleteCompany',
          companyId: id
        }
      });
      setIsDeleting(false);
    }
  };
  
  const refreshCompanyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${id}`);
      if (!response.ok) {
        throw new Error('Failed to refresh company data');
      }
      
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      console.error("Error refreshing company data:", error);
      Sentry.captureException(error, {
        extra: {
          component: 'CompanyDetail',
          action: 'refreshCompanyData',
          companyId: id
        }
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner size="large" message="Loading company details..." />;
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-medium text-red-600 mb-4">Error Loading Company</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/companies" className="btn-primary">
          Back to Companies
        </Link>
      </div>
    );
  }
  
  // Group tags by type
  const tagsByType = company.tags.reduce((acc, tag) => {
    if (!acc[tag.type]) {
      acc[tag.type] = [];
    }
    acc[tag.type].push(tag);
    return acc;
  }, {});
  
  return (
    <div>
      {/* Company header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {company.industry} {company.location ? `• ${company.location}` : ''}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/companies/${id}/edit`}
              className="btn-outline flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-danger flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
        
        {/* Contact information */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {company.contactName && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {company.contactName}
                  {company.contactRole && <span className="text-gray-500"> • {company.contactRole}</span>}
                </p>
              </div>
            )}
            
            {company.email && (
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <a href={`mailto:${company.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                  {company.email}
                </a>
              </div>
            )}
            
            {company.phone && (
              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <a href={`tel:${company.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                  {company.phone}
                </a>
              </div>
            )}
            
            {company.website && (
              <div className="flex items-start">
                <LinkIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                  Website
                </a>
              </div>
            )}
          </div>
          
          {/* Tags */}
          {Object.keys(tagsByType).length > 0 && (
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <TagIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-500">Tags</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(tagsByType).map(([type, tags]) => (
                  <div key={type} className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-500">{type}:</span>
                    {tags.map(tag => (
                      <span key={tag.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('engagements')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'engagements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Engagements
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'activities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Learning Activities
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Files & Links
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="bg-white shadow rounded-lg">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Company Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Recent Engagements</h3>
                {company.engagements.length > 0 ? (
                  <div className="space-y-3">
                    {company.engagements.slice(0, 3).map(engagement => (
                      <div key={engagement.id} className="border border-gray-200 rounded-md p-3">
                        <div className="flex justify-between">
                          <div className="font-medium text-gray-800">
                            {new Date(engagement.dateOfContact).toLocaleDateString()}
                          </div>
                          <div className="text-sm">
                            <span className={`
                              px-2 py-1 rounded-full text-xs font-medium
                              ${engagement.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                engagement.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                engagement.status === 'Follow-Up Needed' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}
                            `}>
                              {engagement.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {engagement.notes || 'No notes recorded'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-gray-200 rounded-md">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No engagements recorded</p>
                  </div>
                )}
                {company.engagements.length > 0 && (
                  <button 
                    onClick={() => setActiveTab('engagements')}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all engagements
                  </button>
                )}
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Learning Activities</h3>
                {company.activities.length > 0 ? (
                  <div className="space-y-3">
                    {company.activities.slice(0, 3).map(activity => (
                      <div key={activity.id} className="border border-gray-200 rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-800">
                              {activity.additionalCourses && 'Additional Courses'}
                              {activity.tLevels && (activity.additionalCourses ? ' • T-Levels' : 'T-Levels')}
                              {activity.apprenticeships && ((activity.additionalCourses || activity.tLevels) ? ' • Apprenticeships' : 'Apprenticeships')}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.details || 'No details provided'}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium text-gray-900">
                              £{activity.totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-gray-500">
                              {activity.numberOfLearners} {activity.numberOfLearners === 1 ? 'learner' : 'learners'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-gray-200 rounded-md">
                    <DocumentIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No learning activities recorded</p>
                  </div>
                )}
                {company.activities.length > 0 && (
                  <button 
                    onClick={() => setActiveTab('activities')}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all activities
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Engagements tab */}
        {activeTab === 'engagements' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Engagement History</h2>
              <button
                onClick={() => setShowEngagementForm(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Engagement
              </button>
            </div>
            
            {showEngagementForm ? (
              <EngagementForm
                companyId={parseInt(id, 10)}
                onCancel={() => setShowEngagementForm(false)}
                onSuccess={() => {
                  setShowEngagementForm(false);
                  refreshCompanyData();
                }}
              />
            ) : (
              <EngagementList 
                engagements={company.engagements} 
                onRefresh={refreshCompanyData} 
              />
            )}
          </div>
        )}
        
        {/* Activities tab */}
        {activeTab === 'activities' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Learning Activities</h2>
              <button
                onClick={() => setShowActivityForm(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Activity
              </button>
            </div>
            
            {showActivityForm ? (
              <ActivityForm
                companyId={parseInt(id, 10)}
                onCancel={() => setShowActivityForm(false)}
                onSuccess={() => {
                  setShowActivityForm(false);
                  refreshCompanyData();
                }}
              />
            ) : (
              <ActivityList 
                activities={company.activities} 
                onRefresh={refreshCompanyData} 
              />
            )}
          </div>
        )}
        
        {/* Files tab */}
        {activeTab === 'files' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Files & Links</h2>
              <button
                onClick={() => setShowFileUpload(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add File/Link
              </button>
            </div>
            
            {showFileUpload ? (
              <FileUpload
                companyId={parseInt(id, 10)}
                onCancel={() => setShowFileUpload(false)}
                onSuccess={() => {
                  setShowFileUpload(false);
                  refreshCompanyData();
                }}
              />
            ) : (
              <FileList 
                files={company.files} 
                onRefresh={refreshCompanyData} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDetail;