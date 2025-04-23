import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { TrashIcon } from '@heroicons/react/24/outline';
import { api as engagementsApi } from '../api';
import * as Sentry from '@sentry/browser';

const EngagementForm = ({ companyId, engagement = null, onCancel, onSuccess }) => {
  const isEditing = !!engagement;
  
  const [formData, setFormData] = useState({
    dateOfContact: engagement?.dateOfContact ? new Date(engagement.dateOfContact) : new Date(),
    aiTrainingDelivered: [],
    notes: engagement?.notes || '',
    status: engagement?.status || 'Initial Contact',
    followUps: []
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Parse AI training tools on component mount
  useEffect(() => {
    if (engagement?.aiTrainingDelivered) {
      const tools = engagementsApi.getAITools(engagement.aiTrainingDelivered);
      setFormData(prev => ({ ...prev, aiTrainingDelivered: tools }));
    }
  }, [engagement]);
  
  // Fetch follow-up actions if editing
  useEffect(() => {
    if (isEditing) {
      const fetchFollowUps = async () => {
        try {
          const data = await engagementsApi.getEngagementById(engagement.id);
          
          if (data.followUps) {
            setFormData(prev => ({
              ...prev,
              followUps: data.followUps.map(followUp => ({
                ...followUp,
                dueDate: followUp.dueDate ? new Date(followUp.dueDate) : null
              }))
            }));
          }
        } catch (error) {
          console.error("Error fetching follow-ups:", error);
          Sentry.captureException(error, {
            extra: {
              component: 'EngagementForm',
              action: 'fetchFollowUps',
              engagementId: engagement.id
            }
          });
        }
      };
      
      fetchFollowUps();
    }
  }, [isEditing, engagement]);
  
  const aiTools = [
    "Gamma",
    "Synthesia",
    "ChatGPT",
    "Newarc",
    "Custom GPTs"
  ];
  
  const statusOptions = [
    "Initial Contact",
    "In Progress",
    "Follow-Up Needed",
    "Completed"
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, dateOfContact: date }));
  };
  
  const handleToolToggle = (tool) => {
    setFormData(prev => {
      if (prev.aiTrainingDelivered.includes(tool)) {
        return {
          ...prev,
          aiTrainingDelivered: prev.aiTrainingDelivered.filter(t => t !== tool)
        };
      } else {
        return {
          ...prev,
          aiTrainingDelivered: [...prev.aiTrainingDelivered, tool]
        };
      }
    });
  };
  
  // Follow-up actions management
  const addFollowUp = () => {
    setFormData(prev => ({
      ...prev,
      followUps: [
        ...prev.followUps,
        {
          task: '',
          dueDate: new Date(),
          completed: false
        }
      ]
    }));
  };
  
  const removeFollowUp = (index) => {
    setFormData(prev => ({
      ...prev,
      followUps: prev.followUps.filter((_, i) => i !== index)
    }));
  };
  
  const updateFollowUp = (index, field, value) => {
    setFormData(prev => {
      const updatedFollowUps = [...prev.followUps];
      updatedFollowUps[index] = {
        ...updatedFollowUps[index],
        [field]: value
      };
      return { ...prev, followUps: updatedFollowUps };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Ensure companyId is a number, not a string or BigInt
      const parsedCompanyId = Number(companyId);
      
      // Log the companyId to help with debugging
      console.log(`Submitting engagement with companyId: ${companyId} (type: ${typeof companyId}), parsed: ${parsedCompanyId} (type: ${typeof parsedCompanyId})`);
      
      if (isNaN(parsedCompanyId)) {
        throw new Error(`Invalid company ID: ${companyId}. Must be a valid number.`);
      }
      
      const engagementData = {
        companyId: parsedCompanyId,
        dateOfContact: formData.dateOfContact,
        aiTrainingDelivered: formData.aiTrainingDelivered,
        notes: formData.notes,
        status: formData.status
      };
      
      let result;
      if (isEditing) {
        result = await engagementsApi.updateEngagement(
          engagement.id, 
          engagementData, 
          formData.followUps
        );
      } else {
        result = await engagementsApi.createEngagement(
          engagementData, 
          formData.followUps
        );
      }
      
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} engagement:`, error);
      setError(error.message);
      Sentry.captureException(error, {
        extra: {
          component: 'EngagementForm',
          action: isEditing ? 'updateEngagement' : 'addEngagement',
          formData,
          companyId,
          parsedCompanyId: Number(companyId)
        }
      });
      setSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {isEditing ? 'Edit Engagement' : 'Add New Engagement'}
      </h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="dateOfContact" className="form-label">Date of Contact</label>
            <DatePicker
              selected={formData.dateOfContact}
              onChange={handleDateChange}
              className="form-input w-full box-border"
              dateFormat="dd/MM/yyyy"
              placeholderText="Select date"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="status" className="form-label">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-select"
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="sm:col-span-6">
            <label className="form-label">AI Training Delivered</label>
            <div className="mt-1 flex flex-wrap gap-3">
              {aiTools.map(tool => (
                <label key={tool} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.aiTrainingDelivered.includes(tool)}
                    onChange={() => handleToolToggle(tool)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{tool}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="sm:col-span-6">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              className="form-textarea box-border"
              placeholder="Details about the engagement..."
            />
          </div>
          
          <div className="sm:col-span-6 border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">Follow-Up Actions</h4>
              <button
                type="button"
                onClick={addFollowUp}
                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                + Add Action
              </button>
            </div>
            
            {formData.followUps.length === 0 ? (
              <p className="text-sm text-gray-500">No follow-up actions added</p>
            ) : (
              <div className="space-y-4">
                {formData.followUps.map((followUp, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-start border border-gray-200 rounded-md p-3">
                    <div className="col-span-6">
                      <label className="text-xs text-gray-500">Task</label>
                      <input
                        type="text"
                        value={followUp.task}
                        onChange={(e) => updateFollowUp(index, 'task', e.target.value)}
                        className="form-input mt-1 box-border"
                        placeholder="Action item..."
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs text-gray-500">Due Date</label>
                      <DatePicker
                        selected={followUp.dueDate}
                        onChange={(date) => updateFollowUp(index, 'dueDate', date)}
                        className="form-input mt-1 w-full box-border"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Due date"
                      />
                    </div>
                    <div className="col-span-2 pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={followUp.completed}
                          onChange={(e) => updateFollowUp(index, 'completed', e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Completed</span>
                      </label>
                    </div>
                    <div className="col-span-1 pt-6">
                      <button
                        type="button"
                        onClick={() => removeFollowUp(index)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default EngagementForm;