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

          if (bookingId) {
            console.log('🚫 Payment cancelled for booking:', bookingId)
            
            // DO NOT cancel the booking - just clear the payment session
            // User can retry payment later
            console.log('✅ Payment session cleared - booking status unchanged')
            
            // Clear payment data from localStorage
            localStorage.removeItem('currentBookingId')
            localStorage.removeItem('depositAmount')
            
            // Show message and redirect to booking history
            showToast('Payment cancelled. You can retry payment from your booking history.', 'info', 3000)
          } else {
            console.warn('⚠️ No booking ID found in localStorage')
            showToast('Payment cancelled.', 'info', 3000)
          }

          // Redirect to booking history page after 2 seconds
          setTimeout(() => {
            navigate('/booking-history')
          }, 2000)
        } else {
          // Invalid parameters, redirect immediately
          showToast('Invalid payment cancellation.', 'error', 3000)
          setTimeout(() => {
            navigate('/booking-history')
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
            <p style={{ color: '#000' }}>Clearing payment session. You can retry payment later.</p>
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
            <p style={{ color: '#000', marginBottom: '1rem' }}>
              Your payment has been cancelled. Your booking is still active and you can retry payment anytime.
            </p>
            <p style={{ color: '#000', fontSize: '0.9rem' }}>
              Redirecting to booking history...
            </p>
          </>
        )}
      </div>
    </main>
  )
}
