// src/components/Booking/BookingCard.jsx
import React from 'react';

export default function BookingCard({ booking, onClick }) {
  let cls = 'booking-status-chip ';
  if (booking.status === 'booked') cls += 'booking-status-booked';
  else if (booking.status === 'denied') cls += 'booking-status-denied';
  else if (booking.status === 'completed') cls += 'booking-status-completed';

  return (
    <div className="booking-card" onClick={onClick}>
      <img src={booking.img} alt={booking.title} />
      <div className="booking-info">
    <div className="booking-title">{booking.title}</div>
    <div className="booking-customer">Customer: {booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || '—'}</div>
      </div>
      <div className={cls}>{booking.status.toUpperCase()}</div>
    </div>
  );
}
