import React from 'react';

export default function BookingModel({ bookings = [], renderBookingCard, search = '', setSearch = () => {}, statusFilter = '', setStatusFilter = () => {}, emptyState = null }) {
  return (
    <div className="booking-model">
      <div className="booking-filter" style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search bookings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', flex: '1 1 320px' }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd' }}>
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="waiting_payment">Waiting Payment</option>
          <option value="checked-in">Checked In</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="booking-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {bookings && bookings.length > 0
          ? bookings.map((b) => renderBookingCard(b))
          : (emptyState || <div style={{ padding: 24, color: '#666' }}>No bookings found</div>)}
      </div>
    </div>
  );
}
