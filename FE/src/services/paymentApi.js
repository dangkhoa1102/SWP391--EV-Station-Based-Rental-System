import { apiClient } from './api'

const paymentApi = {
  // Create payment for deposit, rental, or checkout
  // PaymentType: 0 = Deposit, 1 = Rental, 2 = Checkout (penalty/damage)
  createPayment: async (bookingId, paymentType = 0, description = 'Payment', extraAmount = 0) => {
    try {
      console.log('💳 Creating payment for booking:', bookingId, '| Type:', paymentType, '| Extra amount:', extraAmount)
      
      const payload = {
        bookingId: bookingId,
        paymentType: paymentType,
        description: description
      }
      
      if (extraAmount > 0) {
        payload.extraAmount = extraAmount
      }
      
      const res = await apiClient.post('/Payment/create', payload)
      console.log('✅ Payment created:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error creating payment:', e.response?.data || e.message)
      throw e
    }
  },

  // Sync payment status after PayOS redirect
  syncPayment: async (bookingId) => {
    try {
      console.log('🔄 Syncing payment for booking:', bookingId)
      const res = await apiClient.post(`/Payment/sync/${encodeURIComponent(bookingId)}`)
      console.log('✅ Payment synced:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error syncing payment:', e.response?.data || e.message)
      throw e
    }
  }
}

export default paymentApi
