import React from 'react';

export default function BookingModalLayout({ booking = {}, onClose = () => {}, actions = null, children }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{booking?.title || booking?.carName || 'Booking'}</h2>
          <div style={{ color: '#666' }}>{booking?.statusLabel || booking?.status}</div>
        </div>
        <div>
          {actions}
          <button onClick={onClose} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 6 }}>Close</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>{children}</div>

      <div style={{ padding: 12, borderTop: '1px solid #eee', textAlign: 'right' }}>{actions}</div>
    </>
  );
}
