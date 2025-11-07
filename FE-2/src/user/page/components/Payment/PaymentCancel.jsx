import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import API from '../../../services/userApi'
import { useToast } from '../../../../components/ToastProvider'

export default function PaymentCancel() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    const handleCancelPayment = async () => {
      console.log('🎯 PaymentCancel component mounted!')
      console.log('📍 Current URL:', window.location.href)
      
      try {
        // Get parameters from URL
        const orderCode = searchParams.get('orderCode')
        const status = searchParams.get('status')
        const cancel = searchParams.get('cancel')

        console.log('🚫 Payment cancelled:', { orderCode, status, cancel })

        // Check if this is a cancellation
        if (cancel === 'true' && status === 'CANCELLED') {
          // Get booking ID from localStorage
          const bookingId = localStorage.getItem('currentBookingId')
          const userId = localStorage.getItem('userId')

          if (bookingId && userId) {
            console.log('🚫 Cancelling booking:', bookingId)
            
            try {
              // Call cancel booking API
              await API.cancelBooking(bookingId, userId)
              console.log('✅ Booking cancelled successfully')
              
              // Clear booking data from localStorage
              localStorage.removeItem('currentBookingId')
              localStorage.removeItem('depositAmount')
              
              // Show success message
              showToast('Payment cancelled. Your booking has been cancelled.', 'info', 3000)
            } catch (error) {
              console.error('❌ Error cancelling booking:', error)
              showToast('Payment cancelled but failed to cancel booking. Please contact support.', 'error', 5000)
            }
          } else {
            console.warn('⚠️ No booking ID found in localStorage')
            showToast('Payment cancelled.', 'info', 3000)
          }

          // Redirect to home page after 2 seconds
          setTimeout(() => {
            navigate('/')
          }, 2000)
        } else {
          // Invalid parameters, redirect immediately
          showToast('Invalid payment cancellation.', 'error', 3000)
          setTimeout(() => {
            navigate('/')
          }, 1500)
        }
      } catch (error) {
        console.error('❌ Error handling payment cancellation:', error)
        showToast('An error occurred. Redirecting to home...', 'error', 3000)
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } finally {
        setProcessing(false)
      }
    }

    handleCancelPayment()
  }, [searchParams, navigate, showToast])

  return (
    <main style={{ 
      minHeight: '60vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '500px',
        padding: '2rem',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        {processing ? (
          <>
            <div style={{ 
              fontSize: '48px', 
              color: '#ffc107',
              marginBottom: '1rem'
            }}>
              ⏳
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Processing Cancellation...</h2>
            <p style={{ color: '#666' }}>Please wait while we cancel your booking.</p>
          </>
        ) : (
          <>
            <div style={{ 
              fontSize: '48px', 
              color: '#6c757d',
              marginBottom: '1rem'
            }}>
              ❌
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Payment Cancelled</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Your payment has been cancelled and your booking has been removed.
            </p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>
              Redirecting to home page...
            </p>
          </>
        )}
      </div>
    </main>
  )
}
