import React, { useState } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import ActivityForm from './ActivityForm';
import * as Sentry from '@sentry/browser';

const ActivityList = ({ activities, onRefresh }) => {
  const [editingActivity, setEditingActivity] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert('Failed to delete activity');
      Sentry.captureException(error, {
        extra: {
          component: 'ActivityList',
          action: 'deleteActivity',
          activityId
        }
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleEdit = (activity) => {
    setEditingActivity(activity);
  };
  
  if (editingActivity) {
    return (
      <ActivityForm
        companyId={editingActivity.companyId}
        activity={editingActivity}
        onCancel={() => setEditingActivity(null)}
        onSuccess={() => {
          setEditingActivity(null);
          if (onRefresh) onRefresh();
        }}
      />
    );
  }
  
  if (activities.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No learning activities recorded yet</p>
      </div>
    );
  }
  
  // Sort activities by date, most recent first
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Activity Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Learners
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedActivities.map(activity => (
            <tr key={activity.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                  {activity.additionalCourses && (
                    <span className="badge-blue">Additional Courses</span>
                  )}
                  {activity.tLevels && (
                    <span className="badge-purple">T-Levels</span>
                  )}
                  {activity.apprenticeships && (
                    <span className="badge-green">Apprenticeships</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-md break-words">
                  {activity.details || '—'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {activity.numberOfLearners || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  £{activity.totalValue?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleEdit(activity)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(activity.id)}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
              Total Value:
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
              £{sortedActivities
                .reduce((sum, activity) => sum + Number(activity.totalValue || 0), 0)
                .toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ActivityList;