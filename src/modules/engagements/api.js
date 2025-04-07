import { 
  fetchEngagements, 
  fetchEngagementById,
  createEngagement, 
  updateEngagement, 
  deleteEngagement,
  getAITools
} from './internal/services';

export const api = {
  getEngagements: fetchEngagements,
  getEngagementById: fetchEngagementById,
  createEngagement: createEngagement,
  updateEngagement: updateEngagement,
  deleteEngagement: deleteEngagement,
  getAITools: getAITools
};