import React, { useState, useEffect } from 'react';
import BookingModal from './BookingModal';
import BookingCard from '../../../../components/Booking/BookingCard';
import { applyCarIconFallback, getImageUrlOrIcon } from '../../../../utils/carIconSvg';
import adminApi from '../../../../services/adminApi';
import './Booking.css';

export default function BookingSection({ bookings, search, setSearch, statusFilter, setStatusFilter, onContinuePayment, onCancelBooking, onStatusUpdated }) {
  const [selected, setSelected] = useState(null);
  const [checkInFor, setCheckInFor] = useState(null);

  const filtered = Array.isArray(bookings) ? bookings.filter(b =>
    (String(b.title || '').toLowerCase().includes(String(search).toLowerCase()) || String(b.customer || '').toLowerCase().includes(String(search).toLowerCase()) || String(b.userName || '').toLowerCase().includes(String(search).toLowerCase()) || String(b.email || '').toLowerCase().includes(String(search).toLowerCase())) &&
    (statusFilter === '' || b.status === statusFilter)
  ) : [];

  const [imagesMap, setImagesMap] = useState({});

  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'date' ? 'desc' : 'asc');
    }
  }

  const getCarId = (b) => (
    b.carId || b.CarId || b.vehicleId || b.VehicleId || b.car?.id || b.car?.Id || b.vehicle?.id || b.vehicle?.Id || null
  );

  useEffect(() => {
    let mounted = true;
    const toFetch = new Set();
    for (const b of filtered) {
      const cid = getCarId(b);
      const hasImg = b.img || b.carImage || (cid && imagesMap[cid]);
      if (!hasImg && cid) toFetch.add(String(cid));
    }
    if (toFetch.size === 0) return;
    (async () => {
      const promises = Array.from(toFetch).slice(0, 50).map(async (cid) => {
        try {
          const car = await adminApi.getCarById(cid);
          const imageUrl = car?.imageUrl || car?.ImageUrl || null;
          return { cid, imageUrl };
        } catch {
          return { cid, imageUrl: null };
        }
      });
      try {
        const results = await Promise.all(promises);
        if (!mounted) return;
        setImagesMap(prev => {
          const copy = { ...prev };
          for (const r of results) if (r.imageUrl) copy[r.cid] = r.imageUrl;
          return copy;
        });
      } catch {}
    })();
    return () => { mounted = false; };
  }, [filtered]);

  const displayed = (() => {
    const arr = Array.isArray(filtered) ? [...filtered] : [];
    if (!sortField) return arr;
    if (sortField === 'date') {
      const toTime = (x) => {
        const v = x.date || x.createdAt || x.bookingDate || '';
        const t = Date.parse(String(v));
        return Number.isFinite(t) ? t : 0;
      }
      arr.sort((a, b) => sortDir === 'asc' ? (toTime(a) - toTime(b)) : (toTime(b) - toTime(a)));
      return arr;
    }
    arr.sort((a, b) => {
      const keyA = (sortField === 'vehicle') ? (String(a.title || '').toLowerCase()) : (String(a.fullName || a.customer || '').toLowerCase());
      const keyB = (sortField === 'vehicle') ? (String(b.title || '').toLowerCase()) : (String(b.fullName || b.customer || '').toLowerCase());
      if (keyA === keyB) return 0;
      return sortDir === 'asc' ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
    });
    return arr;
  })();

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

        {displayed && displayed.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '8px 12px' }}>Image</th>
                  <th style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => toggleSort('vehicle')}>
                    Vehicle {sortField === 'vehicle' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => toggleSort('customer')}>
                    Customer {sortField === 'customer' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: '8px 12px' }}>Phone / Email</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => toggleSort('date')}>
                    Date {sortField === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: '8px 12px', width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      <img
                        src={b.img || b.carImage || imagesMap[String(getCarId(b))] || getImageUrlOrIcon(b.img) || '/Picture/E car 1.jpg'}
                        alt={b.title}
                        onError={(e) => applyCarIconFallback(e.currentTarget)}
                        style={{ width: 100, height: 56, objectFit: 'cover', borderRadius: 6 }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{b.title}</td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{b.fullName || [b.firstName, b.lastName].filter(Boolean).join(' ') || b.customer || '—'}</td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{b.phone || b.email || '—'}</td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      {(() => {
                        const s = (b.status || '').toString().toLowerCase();
                        const cls = s.includes('pending') ? 'booking-status-pending'
                          : (s.includes('waiting') ? 'booking-status-waiting-checkin'
                          : (s.includes('check') && s.includes('in') ? 'booking-status-checkedin'
                          : (s.includes('complete') || s.includes('completed') ? 'booking-status-completed'
                          : (s.includes('cancel') || s.includes('denied') ? 'booking-status-cancelled' : 'booking-status-booked'))));
                        const label = b.statusLabel || (b.status || '').toString();
                        return <span className={`booking-status-chip table-status-badge ${cls}`}>{label}</span>;
                      })()}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{b.date || ''}</td>
                    <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setSelected(b)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Details</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 24, color: '#666' }}>No bookings found</div>
        )}
      </div>

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
