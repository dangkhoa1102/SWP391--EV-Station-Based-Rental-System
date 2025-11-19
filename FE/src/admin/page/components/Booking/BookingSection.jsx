import React, { useState } from 'react';
import BookingCard from '../../../../components/Booking/BookingCard';
import BookingModel from '../../../../components/Booking/BookingModel';
import BookingModal from './BookingModal';
import './Booking.css';

export default function BookingSection({ bookings, search, setSearch, statusFilter, setStatusFilter, onContinuePayment, onCancelBooking, onStatusUpdated }) {
  const [selected, setSelected] = useState(null);
  const [checkInFor, setCheckInFor] = useState(null);

  const filtered = bookings.filter(b =>
    (b.title.toLowerCase().includes(search.toLowerCase()) || (b.customer || '').toLowerCase().includes(search.toLowerCase()) || (b.userName || '').toLowerCase().includes(search.toLowerCase()) || (b.email || '').toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === '' || b.status === statusFilter)
  );

  const renderBookingCard = (b) => (
    <BookingCard key={b.id} booking={b} onClick={() => setSelected(b)} />
  )

  return (
    <>
      <BookingModel
        bookings={filtered}
        renderBookingCard={renderBookingCard}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <BookingModal
        booking={selected}
        onClose={() => setSelected(null)}
        onProceed={() => { if (selected) { setCheckInFor(selected); setSelected(null); } }}
        onCancel={() => { if (selected) onCancelBooking?.(selected); }}
        onStatusUpdated={onStatusUpdated}
      />

      {checkInFor && (
        <div className="modal-overlay" style={{display:'flex'}}>
          <div className="modal-content" style={{width:'min(720px,95vw)', maxHeight:'90vh', overflow:'auto'}}>
            <span className="close-btn" onClick={() => setCheckInFor(null)}>&times;</span>
            <BookingCard booking={checkInFor} onClick={() => setSelected(checkInFor)} />
          </div>
        </div>
      )}
    </>
  );
}
