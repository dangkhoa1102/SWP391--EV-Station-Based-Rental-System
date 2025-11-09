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
        
        // ========================================
        // CONTRACT FEATURE - TEMPORARILY DISABLED
        // Uncomment when backend contract API is fixed
        // ========================================
        /*
        // Step 2: Fetch booking details to prepare contract data
        console.log('📋 Fetching booking details for contract...')
        const bookings = await API.get('/Bookings/My-Bookings')
        const booking = Array.isArray(bookings) ? bookings.find(b => (b.id || b.bookingId) === bookingId) : null
        
        if (!booking) {
          throw new Error('Booking not found after sync')
        }

        console.log('📋 Booking details:', booking)
        
        // Get user info from localStorage
        const userId = localStorage.getItem('userId')
        const userEmail = localStorage.getItem('userEmail')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        
        if (!userEmail) {
          throw new Error('User email not found')
        }
        
        // Prepare contract data from booking
        const pickupDate = new Date(booking.startTime || booking.pickupDateTime)
        const ngayKy = String(pickupDate.getDate()).padStart(2, '0')
        const thangKy = String(pickupDate.getMonth() + 1).padStart(2, '0')
        const namKy = String(pickupDate.getFullYear())
        
        // Get car details
        const carBrand = booking.carInfo?.split(' ')[0] || booking.car?.brand || 'N/A'
        const carModel = booking.car?.model || 'N/A'
        const licensePlate = booking.car?.licensePlate || 'N/A'
        const carColor = booking.car?.color || 'N/A'
        const yearManufactured = booking.car?.year || '2024'
        
        // Calculate rental duration
        const startDate = new Date(booking.startTime || booking.pickupDateTime)
        const endDate = new Date(booking.endTime || booking.expectedReturnDateTime)
        const thoiHanThueSo = Math.ceil((endDate - startDate) / (1000 * 60 * 60))
        const donViThoiHan = 'giờ'
        const thoiHanThueChu = numberToVietnameseWords(thoiHanThueSo)
        
        // Format rental price
        const giaThueSo = String(Math.round(booking.totalAmount || 0))
        const giaThueChu = numberToVietnameseWords(Math.round(booking.totalAmount || 0))
        
        // User full name - use firstName from user data
        const hoTen = user.firstName || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'
        
        const contractData = {
          ngayKy: ngayKy,
          thangKy: thangKy,
          namKy: namKy,
          benA: {
            hoTen: hoTen
          },
          xe: {
            nhanHieu: carBrand,
            bienSo: licensePlate,
            loaiXe: carModel,
            mauSon: carColor,
            xeDangKiHan: yearManufactured
          },
          giaThue: {
            giaThueSo: giaThueSo,
            giaThueChu: giaThueChu
          },
          thoiHanThueSo: String(thoiHanThueSo),
          thoiHanThueChu: thoiHanThueChu,
          thoiHanThue: thoiHanThueSo,
          donViThoiHan: donViThoiHan
        }
        
        console.log('📋 Contract data prepared:', contractData)
        
        // Step 3: Create contract
        console.log('📝 Creating contract...')
        const contractResponse = await API.createContract(bookingId, contractData)
        const contractId = contractResponse.id || contractResponse.contractId || contractResponse
        
        console.log('✅ Contract created with ID:', contractId)
        
        // Step 4: Send email with contract
        console.log('📧 Sending contract email to:', userEmail)
        await API.sendContractEmail(contractId, userEmail)
        
        console.log('✅ Contract email sent successfully')
        */
        // ========================================
        // END CONTRACT FEATURE
        // ========================================
        
        setSyncing(false)

        // Wait a moment before redirecting
        setTimeout(() => {
          // Clear related localStorage items
          try {
            localStorage.removeItem('currentBookingId')
            localStorage.removeItem('depositAmount')
            // Check if a caller stored a desired return location (e.g., staff flow)
            const returnTo = localStorage.getItem('postPaymentReturn') || '/booking-history'
            // Remove the helper key
            localStorage.removeItem('postPaymentReturn')
            // Navigate back to the appropriate page (staff or booking history)
            navigate(returnTo)
            return
          } catch (e) {
            console.warn('Failed to clear storage or compute return path:', e)
          }

          // Fallback: booking history
          navigate('/booking-history')
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
