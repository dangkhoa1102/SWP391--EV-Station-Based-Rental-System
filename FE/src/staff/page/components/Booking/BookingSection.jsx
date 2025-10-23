import React, { useState } from 'react';
import BookingCard from './BookingCard';
import BookingModal from './BookingModal';
import './Booking.css';

export default function BookingSection({ bookings, search, setSearch, statusFilter, setStatusFilter, onConfirm, onComplete, onDeny }) {
  const [selected, setSelected] = useState(null);

  const filtered = bookings.filter(b =>
    (b.title.toLowerCase().includes(search.toLowerCase()) || b.customer.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === '' || b.status === statusFilter)
  );

  return (
    <div id="booking" className="section">
      <div className="filter-bar">
        <input type="text" id="searchBooking" placeholder="Search by customer or car..." value={search} onChange={e => setSearch(e.target.value)} />
        <select id="statusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="booked">Booked</option>
          <option value="denied">Denied</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="booking-grid" id="bookingGrid">
        {filtered.map(b => (
          <BookingCard key={b.id} booking={b} onClick={() => setSelected(b)} />
        ))}
      </div>

      <BookingModal
        booking={selected}
        onClose={() => setSelected(null)}
        onConfirm={() => { onConfirm(selected.id); setSelected({...selected, status:'booked'}); }}
        onComplete={() => { onComplete(selected.id); setSelected({...selected, status:'completed'}); }}
        onDeny={() => { onDeny(selected.id); setSelected({...selected, status:'denied'}); }}
      />
    </div>
  );
}
