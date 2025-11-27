import React, { useEffect, useState } from 'react'
import carApi from '../../services/carApi'
import { getImageUrlOrIcon, applyCarIconFallback } from '../../utils/carIconSvg'

export default function BookingCard({ booking, onClick, onConfirmRefund }) {
  const [carImage, setCarImage] = useState(null)

  useEffect(() => {
    const loadCarImage = async () => {
      try {
        // Get carId from multiple possible sources
        const carId = booking.carId || booking.CarId
        console.log('🔍 BookingCard - Attempting to load image for booking:', booking.id, 'carId:', carId)
        
        if (!carId) {
          console.warn('⚠️ BookingCard - No carId found in booking:', booking)
          return
        }

        const carDetails = await carApi.getCarById(carId)
        const imageUrl = carDetails?.imageUrl || carDetails?.ImageUrl || '/Picture/E car 1.jpg'
        setCarImage(imageUrl)
        console.log('✅ BookingCard - Loaded car image:', imageUrl)
      } catch (err) {
        console.warn('⚠️ BookingCard - Failed to load car image:', err.message)
      }
    }

    loadCarImage()
  }, [booking.carId, booking.CarId, booking.id])

  // Map numeric status codes to strings
  const getStatusString = (status) => {
    if (!status && status !== 0) return 'UNKNOWN'
    if (typeof status === 'string') {
      // Backend returns PascalCase (e.g., "CancelledPendingRefund")
      const lower = status.toLowerCase()
      // Map backend string format to frontend format
      if (lower === 'cancelledpendingrefund') return 'cancelled-pending'
      if (lower === 'checkedoutpendingpayment') return 'checkout-pending'
      if (lower === 'checkedinpendingpayment') return 'checkedin-pending'
      if (lower === 'deposipaid') return 'booked'
      if (lower === 'checkedin') return 'checked-in'
      if (lower === 'pending') return 'pending'
      if (lower === 'completed') return 'completed'
      if (lower === 'cancelled') return 'cancelled'
      return lower.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
    }
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'pending'
        case 1: return 'booked'
        case 2: return 'waiting-checkin'
        case 3: return 'checked-in'
        case 4: return 'checkout-pending'
        case 5: return 'completed'
        case 6: return 'cancelled-pending'
        case 7: return 'cancelled'
        default: return 'unknown'
      }
    }
    return 'unknown'
  }

  const statusStr = getStatusString(booking.status)
  
  let cls = 'booking-status-chip '
  if (statusStr === 'booked') cls += 'booking-status-booked'
  else if (statusStr === 'pending') cls += 'booking-status-pending'
  else if (statusStr === 'waiting-checkin') cls += 'booking-status-waiting-checkin'
  else if (statusStr === 'checked-in' || statusStr === 'checkedin') cls += 'booking-status-checkedin'
  else if (statusStr === 'checkout-pending') cls += 'booking-status-checkout-pending'
  else if (statusStr === 'completed') cls += 'booking-status-completed'
  else if (statusStr === 'cancelled-pending') cls += 'booking-status-cancelled-pending'
  else if (statusStr === 'cancelled') cls += 'booking-status-cancelled'
  else if (statusStr === 'denied') cls += 'booking-status-denied'
  else cls += 'booking-status-unknown'

  const handleImageError = (e) => {
    applyCarIconFallback(e.currentTarget)
  }

  const imageUrl = carImage || booking.img || getImageUrlOrIcon(booking.img)

  const handleConfirmRefund = async (e) => {
    e.stopPropagation() // Prevent card onClick from being triggered
    
    if (typeof onConfirmRefund === 'function') {
      onConfirmRefund(booking)
    }
  }

  // Check if button should be enabled
  const canConfirmRefund = () => {
    // Only show for cancelled-pending or checkout-pending statuses
    const validStatus = statusStr === 'cancelled-pending' || statusStr === 'checkout-pending'
    if (!validStatus) return false
    
    // Must have refund amount > 0
    const refundAmount = booking.refundAmount || booking.RefundAmount || 0
    if (refundAmount <= 0) return false
    
    return true
  }

  return (
    <div className="booking-card" onClick={onClick}>
      <img src={imageUrl} alt={booking.title} onError={handleImageError} />
      <div className="booking-info">
        <div className="booking-title">{booking.title}</div>
        <div className="booking-customer">Customer: {booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || '—'}</div>
      </div>
      
      <div className="booking-actions">
        { /* Display status */ }
        {
          (() => {
            const text = booking.statusLabel || statusStr.toUpperCase()
            return <div className={cls}>{text}</div>
          })()
        }
        
        { /* Show Confirm Refund button when status is cancelled-pending or checkout-pending and has refund */ }
        {canConfirmRefund() && onConfirmRefund && (
          <button 
            className="confirm-refund-btn"
            onClick={handleConfirmRefund}
          >
            ✅ Confirm Refund
          </button>
        )}
      </div>
    </div>
  )
}
