import { apiClient } from './api'

const bookingApi = {
  // Create booking with deposit
  createBooking: async (bookingData, userId) => {
    try {
      console.log('📝 Creating booking for user:', userId)
      console.log('📝 Booking data:', bookingData)
      
      const payload = {
        carId: bookingData.carId,
        stationId: bookingData.pickupStationId || bookingData.returnStationId || bookingData.stationId,
        pickupDateTime: bookingData.pickupDateTime,
        expectedReturnDateTime: bookingData.expectedReturnDateTime
      }
      
      console.log('📤 Sending payload:', payload)
      
      const res = await apiClient.post(`/Bookings/Create-With-Deposit?userId=${encodeURIComponent(userId)}`, payload)
      console.log('✅ Booking created:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error creating booking:', e.response?.data || e.message)
      if (e.response?.data?.errors) {
        console.error('📋 Validation errors:', e.response.data.errors)
      }
      throw e
    }
  },

  // Confirm booking
  confirmBooking: async (bookingId, paymentMethod, paymentTransactionId = '') => {
    try {
      console.log('✅ Confirming booking:', bookingId)
      const payload = {
        bookingId: bookingId,
        paymentMethod: paymentMethod,
        paymentTransactionId: paymentTransactionId
      }
      const res = await apiClient.post('/Bookings/Confirm', payload)
      console.log('✅ Booking confirmed:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error confirming booking:', e.response?.data || e.message)
      throw e
    }
  },

  // Complete booking
  completeBooking: async (bookingId) => {
    try {
      console.log('✅ Completing booking:', bookingId)
      const res = await apiClient.post(`/Bookings/Complete-By-${encodeURIComponent(bookingId)}`)
      console.log('✅ Booking completed:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error completing booking:', e.response?.data || e.message)
      throw e
    }
  },

  // Get user's bookings
  getUserBookings: async (userId) => {
    try {
      console.log('📋 Fetching bookings for current user')
      const res = await apiClient.get('/Bookings/My-Bookings')
      console.log('✅ Raw /Bookings/My-Bookings response:', res.data)
      const responseData = res.data || {}

      if (Array.isArray(responseData)) {
        console.log('ℹ️ Returning bookings (direct array), count:', responseData.length)
        return responseData
      }

      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('ℹ️ Returning bookings from response.data, count:', responseData.data.length)
        return responseData.data
      }

      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        console.log('ℹ️ Returning bookings from response.data.data, count:', responseData.data.data.length)
        return responseData.data.data
      }

      if (responseData.data && responseData.data.items && Array.isArray(responseData.data.items)) {
        console.log('ℹ️ Returning bookings from response.data.items, count:', responseData.data.items.length)
        return responseData.data.items
      }

      if (responseData.items && Array.isArray(responseData.items)) {
        console.log('ℹ️ Returning bookings from response.items, count:', responseData.items.length)
        return responseData.items
      }

      if (responseData.bookings && Array.isArray(responseData.bookings)) {
        console.log('ℹ️ Returning bookings from response.bookings, count:', responseData.bookings.length)
        return responseData.bookings
      }

      if (responseData && (responseData.id || responseData.bookingId || responseData.bookingStatus)) {
        console.log('ℹ️ Response looks like a single booking object, wrapping in array')
        return [responseData]
      }

      console.warn('⚠️ No bookings array found in /Bookings/My-Bookings response; returning empty array')
      return []
    } catch (e) {
      console.error('❌ Error fetching user bookings:', e.response?.data || e.message)
      if (e.response && e.response.status === 401) {
        throw e
      }
      return []
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId, userId) => {
    try {
      console.log('🚫 Cancelling booking:', bookingId)
      const res = await apiClient.post(`/Bookings/Cancel-By-${encodeURIComponent(bookingId)}`, null, {
        params: { userId }
      })
      console.log('✅ Booking cancelled:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error cancelling booking:', e.response?.data || e.message)
      throw e
    }
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    try {
      console.log('📋 Fetching booking details for ID:', bookingId)
      const res = await apiClient.get(`/Bookings/Get-By-${encodeURIComponent(bookingId)}`)
      console.log('✅ Booking details:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error fetching booking details:', e.response?.data || e.message)
      throw e
    }
  }
}

export default bookingApi
