import React from 'react';
import { getImageUrlOrIcon, applyCarIconFallback } from '../../../../utils/carIconSvg';

export default function WaitingPaymentCard({ booking, onClick }) {
  // Reuse pending styling and show explicit message + spinner inside card
  const chipCls = 'booking-status-chip booking-status-pending';
  const customerName = booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || '—';

  const handleImageError = (e) => {
    // Show car icon when image fails to load
    applyCarIconFallback(e.currentTarget);
  };

  return (
    <div className="booking-card waiting-payment" onClick={onClick}>
      <img src={getImageUrlOrIcon(booking.img)} alt={booking.title} onError={handleImageError} />
      <div className="booking-info">
        <div className="booking-title">{booking.title}</div>
        <div className="booking-customer">Customer: {customerName}</div>
        <div className="loading-row" title="Waiting for payment confirmation">
          <div className="loading-spinner" aria-hidden="true" />
          <div className="booking-subtext">Waiting for Payment</div>
        </div>
      </div>
      <div className={chipCls}>Pending</div>
    </div>
  );
}
