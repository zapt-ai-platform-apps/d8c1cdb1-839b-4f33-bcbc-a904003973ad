import React, { useState } from 'react';
import { api as activitiesApi } from '../api';
import * as Sentry from '@sentry/browser';

const ActivityForm = ({ companyId, activity = null, onCancel, onSuccess }) => {
  const isEditing = !!activity;
  
  const [formData, setFormData] = useState({
    additionalCourses: activity?.additionalCourses || false,
    tLevels: activity?.tLevels || false,
    apprenticeships: activity?.apprenticeships || false,
    details: activity?.details || '',
    numberOfLearners: activity?.numberOfLearners || 0,
    totalValue: activity?.totalValue || 0
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? '' : Number(value);
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const activityData = {
        companyId,
        additionalCourses: formData.additionalCourses,
        tLevels: formData.tLevels,
        apprenticeships: formData.apprenticeships,
        details: formData.details,
        numberOfLearners: formData.numberOfLearners,
        totalValue: formData.totalValue
      };
      
      let result;
      if (isEditing) {
        result = await activitiesApi.updateActivity(activity.id, activityData);
      } else {
        result = await activitiesApi.createActivity(activityData);
      }
      
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} activity:`, error);
      setError(error.message);
      Sentry.captureException(error, {
        extra: {
          component: 'ActivityForm',
          action: isEditing ? 'updateActivity' : 'addActivity',
          formData
        }
      });
      setSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {isEditing ? 'Edit Learning Activity' : 'Add New Learning Activity'}
      </h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label className="form-label">Activity Type</label>
            <div className="mt-1 space-y-2">
              <div className="flex items-center">
                <input
                  id="additionalCourses"
                  name="additionalCourses"
                  type="checkbox"
                  checked={formData.additionalCourses}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="additionalCourses" className="ml-2 text-sm text-gray-700">
                  Additional Courses
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="tLevels"
                  name="tLevels"
                  type="checkbox"
                  checked={formData.tLevels}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="tLevels" className="ml-2 text-sm text-gray-700">
                  T-Levels
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="apprenticeships"
                  name="apprenticeships"
                  type="checkbox"
                  checked={formData.apprenticeships}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="apprenticeships" className="ml-2 text-sm text-gray-700">
                  Apprenticeships
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="details" className="form-label">Details</label>
            <textarea
              id="details"
              name="details"
              rows={3}
              value={formData.details}
              onChange={handleChange}
              className="form-textarea box-border"
              placeholder="Describe the learning activities in detail..."
            />
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="numberOfLearners" className="form-label">Number of Learners</label>
              <input
                type="number"
                id="numberOfLearners"
                name="numberOfLearners"
                min="0"
                value={formData.numberOfLearners}
                onChange={handleNumberChange}
                className="form-input box-border"
              />
            </div>
            
            <div>
              <label htmlFor="totalValue" className="form-label">Total Value (£)</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  id="totalValue"
                  name="totalValue"
                  min="0"
                  step="0.01"
                  value={formData.totalValue}
                  onChange={handleNumberChange}
                  className="form-input pl-7 box-border"
                  placeholder="0.00"
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

export default ActivityForm;