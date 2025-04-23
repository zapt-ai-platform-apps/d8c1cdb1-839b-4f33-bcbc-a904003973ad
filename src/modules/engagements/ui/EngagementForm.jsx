import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { api as engagementsApi } from '../api';
import * as Sentry from '@sentry/browser';

const EngagementForm = ({ companyId, onEngagementCreated }) => {
  const [dateOfContact, setDateOfContact] = useState(new Date());
  const [aiTrainingDelivered, setAiTrainingDelivered] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [followUps, setFollowUps] = useState([
    { task: '', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), completed: false }
  ]);
  
  const navigate = useNavigate();
  
  const handleFollowUpChange = (index, field, value) => {
    const updatedFollowUps = [...followUps];
    updatedFollowUps[index] = { ...updatedFollowUps[index], [field]: value };
    setFollowUps(updatedFollowUps);
  };
  
  const addFollowUp = () => {
    setFollowUps([
      ...followUps,
      { task: '', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), completed: false }
    ]);
  };
  
  const removeFollowUp = (index) => {
    const updatedFollowUps = followUps.filter((_, i) => i !== index);
    setFollowUps(updatedFollowUps);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Clear previous error
    setError(null);
    
    // Validate form
    const filteredFollowUps = followUps.filter(f => f.task.trim() !== '');
    if (filteredFollowUps.length === 0) {
      setError('Please add at least one follow-up action');
      return;
    }
    
    // Format the engagement data
    const engagement = {
      companyId,
      dateOfContact: dateOfContact.toISOString().split('T')[0],
      aiTrainingDelivered,
      notes,
      status
    };
    
    // Format follow-ups data
    const formattedFollowUps = filteredFollowUps.map(followUp => ({
      task: followUp.task,
      dueDate: followUp.dueDate ? followUp.dueDate.toISOString().split('T')[0] : null,
      completed: followUp.completed
    }));
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting engagement with company ID:', companyId);
      const result = await engagementsApi.createEngagement(engagement, formattedFollowUps);
      
      if (onEngagementCreated) {
        onEngagementCreated(result);
      }
      
      // Reset form
      setDateOfContact(new Date());
      setAiTrainingDelivered('');
      setNotes('');
      setStatus('In Progress');
      setFollowUps([
        { task: '', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), completed: false }
      ]);
    } catch (error) {
      console.error('Failed to create engagement:', error);
      Sentry.captureException(error, {
        extra: {
          engagement,
          followUps: formattedFollowUps,
          location: 'EngagementForm.handleSubmit'
        }
      });
      setError(error.message || 'Failed to create engagement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Log New Engagement</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Date of Contact</label>
          <DatePicker
            selected={dateOfContact}
            onChange={date => setDateOfContact(date)}
            className="box-border border border-gray-300 rounded p-2 w-full"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">AI Training Delivered</label>
          <textarea
            value={aiTrainingDelivered}
            onChange={(e) => setAiTrainingDelivered(e.target.value)}
            className="box-border border border-gray-300 rounded p-2 w-full"
            rows="3"
            placeholder="What AI training was delivered?"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="box-border border border-gray-300 rounded p-2 w-full"
            rows="3"
            placeholder="Additional notes about the engagement"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="box-border border border-gray-300 rounded p-2 w-full"
          >
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Follow-up Required">Follow-up Required</option>
            <option value="Deferred">Deferred</option>
          </select>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">Follow-up Actions</label>
            <button
              type="button"
              onClick={addFollowUp}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Another
            </button>
          </div>
          
          {followUps.map((followUp, index) => (
            <div key={index} className="flex gap-2 mb-2 items-start">
              <div className="flex-grow">
                <input
                  type="text"
                  value={followUp.task}
                  onChange={(e) => handleFollowUpChange(index, 'task', e.target.value)}
                  className="box-border border border-gray-300 rounded p-2 w-full mb-2"
                  placeholder="Action required"
                />
                <div className="flex gap-4">
                  <div className="flex-grow">
                    <label className="block text-sm text-gray-600 mb-1">Due Date</label>
                    <DatePicker
                      selected={followUp.dueDate}
                      onChange={(date) => handleFollowUpChange(index, 'dueDate', date)}
                      className="box-border border border-gray-300 rounded p-2 w-full"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      checked={followUp.completed}
                      onChange={(e) => handleFollowUpChange(index, 'completed', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-600">Completed</label>
                  </div>
                </div>
              </div>
              {followUps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFollowUp(index)}
                  className="text-red-500 hover:text-red-700 mt-2"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 cursor-pointer flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Engagement'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EngagementForm;