import React from 'react';

export default function CheckInPaymentCard({ booking, onClick }) {
  // Reuse checked-in styling but show payment-waiting message
  const cls = 'booking-status-chip booking-status-checkedin';
  const customerName = booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || '—';

  return (
    <div className="booking-card checkin-payment" onClick={onClick}>
      <img src={booking.img} alt={booking.title} />
      <div className="booking-info">
        <div className="booking-title">{booking.title}</div>
        <div className="booking-customer">Customer: {customerName}</div>
        <div className="booking-subtext">Payment In Waiting</div>
      </div>
      <div className={cls}>Payment In Waiting</div>
    </div>
  );
}
