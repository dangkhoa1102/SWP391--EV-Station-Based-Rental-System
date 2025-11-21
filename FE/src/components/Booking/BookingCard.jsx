import React, { useEffect, useState } from 'react'
import carApi from '../../services/carApi'
import { getImageUrlOrIcon, applyCarIconFallback } from '../../utils/carIconSvg'

export default function BookingCard({ booking, onClick }) {
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
    if (!status) return 'UNKNOWN'
    if (typeof status === 'string') return status.toLowerCase()
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'pending'
        case 1: return 'booked'
        case 2: return 'waiting-checkin'
        case 3: return 'checked-in'
        case 4: return 'checkout-pending'
        case 5: return 'completed'
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

  return (
    <div className="booking-card" onClick={onClick}>
      <img src={imageUrl} alt={booking.title} onError={handleImageError} />
      <div className="booking-info">
        <div className="booking-title">{booking.title}</div>
        <div className="booking-customer">Customer: {booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || '—'}</div>
      </div>
      { /* Display status */ }
      {
        (() => {
          const text = booking.statusLabel || statusStr.toUpperCase()
          return <div className={cls}>{text}</div>
        })()
      }
    </div>
  )
}
