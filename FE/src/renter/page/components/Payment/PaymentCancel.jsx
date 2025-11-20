import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import API from '../../../../services/api'
import { useToast } from '../../../../components/ToastProvider'
import './payment_cancel.css'

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
    <main className="payment-cancel-main">
      <div className="payment-cancel-container">
        {processing ? (
          <>
            <div className="payment-cancel-icon processing">
              ⏳
            </div>
            <h2>Processing Cancellation...</h2>
            <p>Clearing payment session. You can retry payment later.</p>
          </>
        ) : (
          <>
            <div className="payment-cancel-icon cancelled">
              ❌
            </div>
            <h2>Payment Cancelled</h2>
            <p>
              Your payment has been cancelled. Your booking is still active and you can retry payment anytime.
            </p>
            <p className="small">
              Redirecting to booking history...
            </p>
          </>
        )}
      </div>
    </main>
  )
}
