import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../services/userApi'

export default function PaymentSuccess(){
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // This page is loaded when PayOS redirects to /payment-success after successful payment
    console.log('✅ Payment successful! Syncing payment status...')
    
    const syncPayment = async () => {
      try {
        // Get bookingId from localStorage
        const bookingId = localStorage.getItem('currentBookingId')
        
        if (!bookingId) {
          console.warn('⚠️ No booking ID found in localStorage')
          setError('Booking ID not found')
          setSyncing(false)
          // Still redirect to booking history after a moment
          setTimeout(() => navigate('/booking-history'), 2000)
          return
        }
        
        console.log('🔄 Syncing payment for booking:', bookingId)
        
        // Call /api/Payment/sync/{bookingId} to update payment status
        await API.post(`/Payment/sync/${bookingId}`)
        
        console.log('✅ Payment status synced successfully')
        setSyncing(false)
        
        // Wait a moment before redirecting
        setTimeout(() => {
          // Clear related localStorage items
          try {
            localStorage.removeItem('currentBookingId')
            localStorage.removeItem('depositAmount')
          } catch (e) {
            console.warn('Failed to clear storage:', e)
          }
          
          // Redirect to booking history
          navigate('/booking-history')
        }, 1500)
        
      } catch (err) {
        console.error('❌ Error syncing payment:', err)
        setError('Failed to sync payment status')
        setSyncing(false)
        
        // Still redirect to booking history after showing error
        setTimeout(() => navigate('/booking-history'), 3000)
      }
    }
    
    syncPayment()
  }, [navigate])

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        {syncing ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h1>Processing Payment...</h1>
            <p style={{ color: '#666', marginTop: '8px' }}>Please wait while we confirm your payment.</p>
          </>
        ) : error ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1>Payment Sync Issue</h1>
            <p style={{ color: '#666', marginTop: '8px' }}>{error}</p>
            <p style={{ color: '#999', marginTop: '8px', fontSize: '14px' }}>Redirecting to booking history...</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h1>Payment Successful!</h1>
            <p style={{ color: '#666', marginTop: '8px' }}>Your payment has been processed.</p>
            <p style={{ color: '#999', marginTop: '8px', fontSize: '14px' }}>Redirecting to booking history...</p>
          </>
        )}
      </div>
    </main>
  )
}
