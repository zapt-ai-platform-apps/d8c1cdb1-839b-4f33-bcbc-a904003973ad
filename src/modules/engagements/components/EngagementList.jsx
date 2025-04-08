import React, { useState } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import EngagementForm from './EngagementForm';
import { api as engagementsApi } from '../api';
import * as Sentry from '@sentry/browser';

const EngagementList = ({ engagements, onRefresh }) => {
  const [editingEngagement, setEditingEngagement] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async (engagementId) => {
    if (!window.confirm('Are you sure you want to delete this engagement?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      await engagementsApi.deleteEngagement(engagementId);
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting engagement:", error);
      alert('Failed to delete engagement');
      Sentry.captureException(error, {
        extra: {
          component: 'EngagementList',
          action: 'deleteEngagement',
          engagementId
        }
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleEdit = (engagement) => {
    setEditingEngagement(engagement);
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'badge-green';
      case 'In Progress':
        return 'badge-blue';
      case 'Follow-Up Needed':
        return 'badge-yellow';
      case 'Initial Contact':
        return 'badge-purple';
      default:
        return 'badge-gray';
    }
  };
  
  if (editingEngagement) {
    return (
      <EngagementForm
        companyId={editingEngagement.companyId}
        engagement={editingEngagement}
        onCancel={() => setEditingEngagement(null)}
        onSuccess={() => {
          setEditingEngagement(null);
          if (onRefresh) onRefresh();
        }}
      />
    );
  }
  
  if (!engagements || engagements.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No engagements recorded yet</p>
      </div>
    );
  }
  
  // Sort engagements by date, most recent first
  const sortedEngagements = [...engagements].sort(
    (a, b) => new Date(b.dateOfContact) - new Date(a.dateOfContact)
  );
  
  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
      <ul className="divide-y divide-gray-200">
        {sortedEngagements.map(engagement => {
          const aiTools = engagementsApi.getAITools(engagement.aiTrainingDelivered);
          
          return (
            <li key={engagement.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(engagement.dateOfContact).toLocaleDateString()}
                    </p>
                    <span className={getStatusBadgeClass(engagement.status)}>
                      {engagement.status}
                    </span>
                  </div>
                  
                  {aiTools.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">AI Training Delivered:</p>
                      <div className="flex flex-wrap gap-1">
                        {aiTools.map((tool, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {engagement.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{engagement.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => handleEdit(engagement)}
                    className="mr-2 text-gray-400 hover:text-gray-500 cursor-pointer"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(engagement.id)}
                    disabled={isDeleting}
                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EngagementList;