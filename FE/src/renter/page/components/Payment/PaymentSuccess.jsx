import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import paymentApi from '../../../../services/paymentApi'
import bookingApi from '../../../../services/bookingApi'

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
    console.log('✅ Payment successful! Checking user role and payment type...')
    
    const syncPayment = async () => {
      try {
        // Get user role from localStorage
        const userRole = localStorage.getItem('userRole')
        console.log('👤 User role:', userRole)
        
        // Get bookingId from localStorage
        let bookingId = localStorage.getItem('currentBookingId')
        let paymentType = 'user-deposit' // Default
        
        if (!bookingId) {
          bookingId = localStorage.getItem('activeCheckInBookingId')
          if (bookingId) {
            paymentType = 'staff-checkin'
            console.log('📋 Found check-in booking ID (staff payment):', bookingId)
          }
        }
        
        if (!bookingId) {
          bookingId = localStorage.getItem('activeCheckOutBookingId')
          if (bookingId) {
            paymentType = 'staff-checkout'
            console.log('📋 Found check-out booking ID (staff payment):', bookingId)
          }
        }
        
        if (!bookingId) {
          console.warn('⚠️ No booking ID found in localStorage')
          setError('Booking ID not found')
          setSyncing(false)
          // Redirect based on role
          redirectByRole(userRole)
          return
        }
        
        console.log('🔄 Auto-syncing payment for booking:', bookingId)
        
        // Call /api/Payment/sync/{bookingId} to update payment status
        await paymentApi.syncPayment(bookingId)
        
        console.log('✅ Payment status synced successfully')
        
        // Fetch the updated booking to check status
        console.log('📋 Fetching booking details to check status...')
        const bookingDetails = await bookingApi.getBookingById(bookingId)
        const bookingStatus = Number(bookingDetails?.bookingStatus || bookingDetails?.BookingStatus)
        
        console.log('📊 Booking status after payment:', bookingStatus, '(0=Pending, 1=Active, 2=Waiting Check-in, 3=Checked-in, 4=Check-out Pending, 5=Completed)')
        
        setSyncing(false)
        
        // Wait a moment before redirecting
        setTimeout(() => {
          // Clear related localStorage items
          try {
            localStorage.removeItem('currentBookingId')
            localStorage.removeItem('depositAmount')
            localStorage.removeItem('activeCheckInBookingId')
            localStorage.removeItem('activeCheckOutBookingId')
          } catch (e) {
            console.warn('Failed to clear storage:', e)
          }
          
          // Redirect based on user role
          redirectByRole(userRole)
        }, 1500)
        
      } catch (err) {
        console.error('❌ Error in payment sync flow:', err)
        setError('Failed to process payment or create contract')
        setSyncing(false)
        
        // Still redirect based on role after showing error
        const userRole = localStorage.getItem('userRole')
        setTimeout(() => redirectByRole(userRole), 3000)
      }
    }
    
    // Function to redirect based on user role
    const redirectByRole = (role) => {
      console.log('🔀 Redirecting based on user role:', role)
      switch(role?.toLowerCase()) {
        case 'admin':
          console.log('→ Redirecting to Admin page')
          navigate('/admin')
          break
        case 'stationstaff':
          console.log('→ Redirecting to Staff page')
          navigate('/staff')
          break
        case 'evrenter':
          console.log('→ Redirecting to Booking History page')
          navigate('/booking-history')
          break
        default:
          console.log('⚠️ Unknown role, redirecting to home page')
          navigate('/cars')
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
