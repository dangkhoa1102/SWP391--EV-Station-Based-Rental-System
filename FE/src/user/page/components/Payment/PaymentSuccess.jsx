import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../services/userApi'

// Helper function to convert numbers to Vietnamese words
const numberToVietnameseWords = (num) => {
  const ones = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
  const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười năm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín']
  const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi']
  
  if (num === 0) return 'không'
  if (num < 0) return 'âm ' + numberToVietnameseWords(-num)
  
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) {
    const ten = Math.floor(num / 10)
    const one = num % 10
    return tens[ten] + (one > 0 ? ' ' + ones[one] : '')
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100)
    const rest = num % 100
    return ones[hundred] + ' trăm' + (rest > 0 ? ' ' + numberToVietnameseWords(rest) : '')
  }
  if (num < 1000000) {
    const thousand = Math.floor(num / 1000)
    const rest = num % 1000
    return numberToVietnameseWords(thousand) + ' nghìn' + (rest > 0 ? ' ' + numberToVietnameseWords(rest) : '')
  }
  
  return num.toString()
}

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
        
        // Fetch the updated booking to check status
        console.log('📋 Fetching booking details to check status...')
        const bookingDetails = await API.getBookingById(bookingId)
        const bookingStatus = Number(bookingDetails?.bookingStatus || bookingDetails?.BookingStatus)
        
        console.log('📊 Booking status after payment:', bookingStatus, '(0=Pending, 1=Active, 2=Waiting Check-in, 3=Checked-in, 4=Check-out Pending, 5=Completed)')
        
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
          
          // Determine redirect destination based on booking status
          // Status 1 (Active) = Deposit paid → booking-history (user view rental)
          // Status 3 (Checked-in) = Final payment done → staff page (staff check-in/checkout)
          if (bookingStatus === 3) {
            console.log('🎯 Final payment complete (Status 3: Checked-in), redirecting to staff page...')
            navigate('/staff')
          } else if (bookingStatus === 1) {
            console.log('💳 Deposit payment complete (Status 1: Active), redirecting to booking history...')
            navigate('/booking-history')
          } else {
            // For other statuses, go to booking history
            console.log('ℹ️ Booking status:', bookingStatus, '- redirecting to booking history as default')
            navigate('/booking-history')
          }
        }, 1500)
        
      } catch (err) {
        console.error('❌ Error in payment sync flow:', err)
        setError('Failed to process payment or create contract')
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
            <p style={{ color: '#000', marginTop: '8px' }}>Please wait while we confirm your payment.</p>
          </>
        ) : error ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1>Payment Sync Issue</h1>
            <p style={{ color: '#000', marginTop: '8px' }}>{error}</p>
            <p style={{ color: '#000', marginTop: '8px', fontSize: '14px' }}>Redirecting to booking history...</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h1>Payment Successful!</h1>
            <p style={{ color: '#000', marginTop: '8px' }}>Your payment has been processed.</p>
            <p style={{ color: '#000', marginTop: '8px', fontSize: '14px' }}>Redirecting to booking history...</p>
          </>
        )}
      </div>
    </main>
  )
}
