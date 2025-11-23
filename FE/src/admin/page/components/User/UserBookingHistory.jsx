import React, { useEffect, useState } from 'react';
import bookingApi from '../../../../services/bookingApi';
import { formatVND } from '../../../../utils/currency';

export default function UserBookingHistory({ userId, userName, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('newest');

  useEffect(() => {
    loadUserBookings();
  }, [userId]);

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📋 Fetching bookings for user:', userId);
      const res = await bookingApi.getUserBookings(userId);
      console.log('✅ Bookings loaded:', res);
      setBookings(res || []);
    } catch (e) {
      console.error('❌ Error loading bookings:', e);
      setError(e?.response?.data?.message || 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  const getBookingStatus = (status) => {
    const statuses = {
      0: { text: 'Pending', class: 'status-pending', color: '#ff9800' },
      1: { text: 'Active', class: 'status-active', color: '#2196f3' },
      2: { text: 'Waiting for check-in', class: 'status-waiting', color: '#ff5722' },
      3: { text: 'Checked-in', class: 'status-checked-in', color: '#4caf50' },
      4: { text: 'Check-out pending', class: 'status-checkout-pending', color: '#9c27b0' },
      5: { text: 'Completed', class: 'status-completed', color: '#4caf50' },
      6: { text: 'Cancelled pending refund', class: 'status-cancelled-refund', color: '#f44336' },
      7: { text: 'Cancelled', class: 'status-cancelled', color: '#9e9e9e' }
    };
    const idx = Number(status);
    return statuses[idx] || statuses[0];
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return dateString;
    }
  };

  let filteredBookings = [...bookings];

  if (statusFilter) {
    filteredBookings = filteredBookings.filter(b => String(b.bookingStatus) === statusFilter);
  }

  filteredBookings.sort((a, b) => {
    switch (sortFilter) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'price-high':
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      case 'price-low':
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: '4px' }}>Booking History</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>for {userName}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#999',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Status:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">All</option>
              <option value="0">Pending</option>
              <option value="1">Active</option>
              <option value="2">Waiting for check-in</option>
              <option value="3">Checked-in</option>
              <option value="4">Check-out pending</option>
              <option value="5">Completed</option>
              <option value="6">Cancelled pending refund</option>
              <option value="7">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Sort by:</label>
            <select
              value={sortFilter}
              onChange={e => setSortFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price-high">Price (High to Low)</option>
              <option value="price-low">Price (Low to High)</option>
            </select>
          </div>

          <button
            onClick={loadUserBookings}
            style={{
              padding: '8px 16px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
              Loading bookings...
            </div>
          )}

          {error && (
            <div
              style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px',
                border: '1px solid #ef5350'
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && filteredBookings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <i className="fas fa-inbox" style={{ fontSize: '36px', marginBottom: '15px', display: 'block' }}></i>
              <p>No bookings found</p>
            </div>
          )}

          {!loading && filteredBookings.length > 0 && (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredBookings.map((booking, idx) => {
                const status = getBookingStatus(booking.bookingStatus);
                const pickupDate = formatDateTime(booking.startTime || booking.pickupDateTime);
                const returnDate = formatDateTime(booking.endTime || booking.expectedReturnDateTime);
                const carName = booking.carInfo || 'Car Rental';
                const stationName = booking.pickupStationName || 'N/A';
                const bookingId = booking.id || booking.bookingId || 'N/A';

                return (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '15px',
                      background: '#fafafa',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                      gap: '15px',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Car</div>
                      <div style={{ fontWeight: 500 }}>{carName}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>Booking ID: {bookingId}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Pick-up</div>
                      <div style={{ fontSize: '13px' }}>{stationName}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{pickupDate}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Return</div>
                      <div style={{ fontSize: '13px' }}>{returnDate}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Total</div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: '#1976d2' }}>
                        {formatVND(booking.totalAmount || 0)}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '6px 12px',
                        background: status.color,
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {status.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
