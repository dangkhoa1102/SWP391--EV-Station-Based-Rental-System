import { apiClient } from './api'

const feedbackApi = {
  // Create feedback
  createFeedback: async (userId, feedbackData) => {
    try {
      console.log('📝 Creating feedback for user:', userId)
      console.log('📝 Feedback data:', feedbackData)
      const res = await apiClient.post(`/Feedback/Create-By-User/${encodeURIComponent(userId)}`, feedbackData)
      console.log('✅ Feedback created:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error creating feedback:', e.response?.data || e.message)
      throw e
    }
  },

  // Update feedback
  updateFeedback: async (feedbackId, userId, feedbackData) => {
    try {
      console.log('✏️ Updating feedback:', feedbackId)
      console.log('📝 Updated data:', feedbackData)
      const res = await apiClient.put(`/Feedback/Update-By-${encodeURIComponent(feedbackId)}`, feedbackData, {
        params: { userId }
      })
      console.log('✅ Feedback updated:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error updating feedback:', e.response?.data || e.message)
      throw e
    }
  }
}

export default feedbackApi
