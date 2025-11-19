import React, { useState } from 'react';
import BookingCard from '../../../../components/Booking/BookingCard';
import BookingModel from '../../../../components/Booking/BookingModel';
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
        <CheckInCard
          booking={checkInFor}
          onClose={() => setCheckInFor(null)}
        />
      )}
    </>
  );
}
