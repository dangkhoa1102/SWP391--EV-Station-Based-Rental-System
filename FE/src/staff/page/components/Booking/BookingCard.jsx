// src/components/Booking/BookingCard.jsx
import React from 'react';

export default function BookingCard({ booking, onClick }) {
  let cls = 'booking-status-chip ';
  if (booking.status === 'booked') cls += 'booking-status-booked';
  else if (booking.status === 'pending') cls += 'booking-status-pending';
  else if (booking.status === 'waiting-checkin') cls += 'booking-status-waiting-checkin';
  else if (booking.status === 'checked-in') cls += 'booking-status-checkedin';
  else if (booking.status === 'checkout-pending') cls += 'booking-status-checkout-pending';
  else if (booking.status === 'completed') cls += 'booking-status-completed';
  else if (booking.status === 'cancelled-pending') cls += 'booking-status-cancelled-pending';
  else if (booking.status === 'cancelled') cls += 'booking-status-cancelled';
  else {
    // Fallback for unknown status - add grey background
    cls += 'booking-status-unknown'
    console.warn('⚠️ BookingCard: Unknown status value:', booking.status, 'Full booking:', booking)
  }

  return (
    <div className="booking-card" onClick={onClick}>
      <img src={booking.img} alt={booking.title} />
      <div className="booking-info">
    <div className="booking-title">{booking.title}</div>
    <div className="booking-customer">Customer: {booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || '—'}</div>
      </div>
      <div className={cls}>{booking.statusLabel || (booking.status ? booking.status.toUpperCase() : 'UNKNOWN')}</div>
    </div>
  );
}
