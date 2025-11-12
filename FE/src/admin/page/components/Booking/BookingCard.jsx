// src/components/Booking/BookingCard.jsx
import React from 'react';
import { getImageUrlOrIcon, applyCarIconFallback } from '../../../../utils/carIconSvg';

export default function BookingCard({ booking, onClick }) {
  let cls = 'booking-status-chip ';
  if (booking.status === 'booked') cls += 'booking-status-booked';
  else if (booking.status === 'denied') cls += 'booking-status-denied';
  else if (booking.status === 'completed') cls += 'booking-status-completed';
  else if (booking.status === 'pending') cls += 'booking-status-pending';
  else if (booking.status === 'checked-in') cls += 'booking-status-checkedin';

  const handleImageError = (e) => {
    // Show car icon when image fails to load
    applyCarIconFallback(e.currentTarget);
  };

  return (
    <div className="booking-card" onClick={onClick}>
      <img src={getImageUrlOrIcon(booking.img)} alt={booking.title} onError={handleImageError} />
      <div className="booking-info">
    <div className="booking-title">{booking.title}</div>
    <div className="booking-customer">Customer: {booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || '—'}</div>
      </div>
      <div className={cls}>{booking.statusLabel || (booking.status ? booking.status.toUpperCase() : '')}</div>
    </div>
  );
}
