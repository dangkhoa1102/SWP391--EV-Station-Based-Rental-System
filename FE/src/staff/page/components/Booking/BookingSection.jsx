import React, { useState } from 'react';
import BookingCard from './BookingCard';
import WaitingPaymentCard from './WaitingPaymentCard';
import CheckInPaymentCard from './CheckInPaymentCard';
import BookingModal from './BookingModal';
import CheckInCard from './CheckInCard';
import './Booking.css';

export default function BookingSection({ bookings, search, setSearch, statusFilter, setStatusFilter, onContinuePayment, onCancelBooking, onStatusUpdated }) {
  const [selected, setSelected] = useState(null);
  const [checkInFor, setCheckInFor] = useState(null);

  const filtered = bookings.filter(b =>
    (b.title.toLowerCase().includes(search.toLowerCase()) || (b.customer || '').toLowerCase().includes(search.toLowerCase()) || (b.userName || '').toLowerCase().includes(search.toLowerCase()) || (b.email || '').toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === '' || b.status === statusFilter)
  );

  return (
    <div id="booking" className="section">
      <div className="filter-bar">
        <input type="text" id="searchBooking" placeholder="Search by customer or car..." value={search} onChange={e => setSearch(e.target.value)} />
        <select id="statusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending (Awaiting Payment)</option>
          <option value="booked">Active Rental</option>
          <option value="waiting-checkin">Waiting Check-in</option>
          <option value="checked-in">Checked-in</option>
          <option value="checkout-pending">Check-out Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled-pending">Cancelled (Pending Refund)</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="booking-grid" id="bookingGrid">
        {filtered.map(b => {
          if (b.uiStage === 'waiting-payment') {
            return <WaitingPaymentCard key={b.id} booking={b} onClick={() => setSelected(b)} />
          }
          if (b.uiStage === 'checkin-payment') {
            return <CheckInPaymentCard key={b.id} booking={b} onClick={() => setSelected(b)} />
          }
          return <BookingCard key={b.id} booking={b} onClick={() => setSelected(b)} />
        })}
      </div>

      <BookingModal
        booking={selected}
        onClose={() => setSelected(null)}
        onProceed={() => { if (selected) { setCheckInFor(selected); setSelected(null); } }}
        onCancel={() => { if (selected) onCancelBooking?.(selected); }}
        onStatusUpdated={onStatusUpdated}
      />

      {checkInFor && (
        <CheckInCard
          booking={checkInFor}
          onClose={() => setCheckInFor(null)}
        />
      )}
    </div>
  );
}
