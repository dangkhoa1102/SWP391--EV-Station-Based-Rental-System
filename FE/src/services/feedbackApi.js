import { apiClient } from './api'

const feedbackApi = {
  // Get all feedbacks (with pagination)
  getAllFeedbacks: async (pageNumber = 1, pageSize = 10) => {
    try {
      console.log('📋 Fetching all feedbacks - page:', pageNumber, 'size:', pageSize)
      const res = await apiClient.get('/Feedback/Get-All', {
        params: { pageNumber, pageSize }
      })
      console.log('✅ Feedbacks fetched:', res.data)
      return res.data?.data || res.data || []
    } catch (e) {
      console.error('❌ Error fetching feedbacks:', e.response?.data || e.message)
      throw e
    }
  },

  // Get feedback by ID
  getFeedbackById: async (feedbackId) => {
    try {
      console.log('🔍 Fetching feedback:', feedbackId)
      const res = await apiClient.get(`/Feedback/Get-By-${encodeURIComponent(feedbackId)}`)
      console.log('✅ Feedback fetched:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error fetching feedback:', e.response?.data || e.message)
      throw e
    }
  },

  // Get feedback by car ID
  getFeedbackByCarId: async (carId) => {
    try {
      console.log('🚗 Fetching feedbacks for car:', carId)
      const res = await apiClient.get(`/Feedback/Get-By-Car/${encodeURIComponent(carId)}`)
      console.log('✅ Car feedbacks fetched:', res.data)
      return res.data?.data || res.data || []
    } catch (e) {
      console.error('❌ Error fetching car feedbacks:', e.response?.data || e.message)
      throw e
    }
  },

  // Get feedback by user ID
  getFeedbackByUserId: async (userId) => {
    try {
      console.log('👤 Fetching feedbacks for user:', userId)
      const res = await apiClient.get(`/Feedback/Get-By-User/${encodeURIComponent(userId)}`)
      console.log('✅ User feedbacks fetched:', res.data)
      return res.data?.data || res.data || []
    } catch (e) {
      console.error('❌ Error fetching user feedbacks:', e.response?.data || e.message)
      throw e
    }
  },

  // Get feedback by booking ID
  getFeedbackByBookingId: async (bookingId) => {
    try {
      console.log('📅 Fetching feedback for booking:', bookingId)
      const res = await apiClient.get(`/Feedback/Get-By-Booking/${encodeURIComponent(bookingId)}`)
      console.log('✅ Booking feedback fetched:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error fetching booking feedback:', e.response?.data || e.message)
      throw e
    }
  },

  // Create feedback by user
  createFeedback: async (userId, feedbackData) => {
    try {
      console.log('📝 Creating feedback for user:', userId)
      console.log('📝 Feedback data:', feedbackData)
      // Ensure userId is included in request body if not already present
      const payload = { ...feedbackData, userId }
      console.log('📤 Sending payload:', payload)
      const res = await apiClient.post(`/Feedback/Create-By-User/${encodeURIComponent(userId)}`, payload)
      console.log('✅ Feedback created:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error creating feedback:', e.response?.data || e.message)
      console.error('❌ Full error response:', e.response)
      console.error('❌ Error status:', e.response?.status)
      console.error('❌ Error details:', e.response?.data?.errors)
      throw e
    }
  },

  // Update feedback
  updateFeedback: async (feedbackId, feedbackData, userId) => {
    try {
      console.log('✏️ Updating feedback:', feedbackId)
      console.log('📝 Updated data:', feedbackData)
      const res = await apiClient.put(`/Feedback/Update-By-${encodeURIComponent(feedbackId)}`, feedbackData, {
        params: userId ? { userId } : {}
      })
      console.log('✅ Feedback updated:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error updating feedback:', e.response?.data || e.message)
      throw e
    }
  },

  // Delete feedback
  deleteFeedback: async (feedbackId, userId) => {
    try {
      console.log('🗑️ Deleting feedback:', feedbackId)
      const res = await apiClient.delete(`/Feedback/Delete-By-${encodeURIComponent(feedbackId)}`, {
        params: userId ? { userId } : {}
      })
      console.log('✅ Feedback deleted:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error deleting feedback:', e.response?.data || e.message)
      throw e
    }
  },

  // Get feedback summary by car
  getFeedbackSummaryByCar: async (carId) => {
    try {
      console.log('📊 Fetching feedback summary for car:', carId)
      const res = await apiClient.get(`/Feedback/Get-Summary-By-Car/${encodeURIComponent(carId)}`)
      console.log('✅ Feedback summary fetched:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error fetching feedback summary:', e.response?.data || e.message)
      throw e
    }
  },

  // Get average rating by car
  getAverageRatingByCar: async (carId) => {
    try {
      console.log('⭐ Fetching average rating for car:', carId)
      const res = await apiClient.get(`/Feedback/Get-Average-Rating-By-Car/${encodeURIComponent(carId)}`)
      console.log('✅ Average rating fetched:', res.data)
      return res.data?.data || res.data || 0
    } catch (e) {
      console.error('❌ Error fetching average rating:', e.response?.data || e.message)
      throw e
    }
  }
}

export default feedbackApi
