import React, { useEffect, useState } from 'react';
import './Booking.css';
import carApi from '../../../../services/carApi';
import userApi from '../../../../services/userApi';
import { getImageUrlOrIcon, applyCarIconFallback } from '../../../../utils/carIconSvg';

export default function BookingTable({ bookings = [], search = '', setSearch = () => {}, statusFilter = '', setStatusFilter = () => {}, onRowClick = () => {} }) {
  const filtered = (bookings || []).filter(b =>
    (b.title || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (b.customer || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (b.userName || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (b.email || '').toLowerCase().includes((search || '').toLowerCase())
  ).filter(b => (statusFilter === '' || b.status === statusFilter));

  const [imagesByCarId, setImagesByCarId] = useState({})
  const [usersById, setUsersById] = useState({})

  useEffect(() => {
    let mounted = true
    async function loadImages() {
      try {
        const carIds = Array.from(new Set((bookings || []).map(b => b.carId || b.CarId || b.car?.id || b.car?.Id || b.vehicle?.id || b.vehicle?.Id).filter(Boolean)))
        if (carIds.length === 0) return
        const pairs = await Promise.all(carIds.map(async cid => {
          try {
            const car = await carApi.getCarById(cid)
            const url = car?.imageUrl || car?.ImageUrl || car?.thumbnailUrl || car?.image || null
            const plate = car?.licensePlate || car?.LicensePlate || car?.plate || car?.Plate || null
            return [String(cid), { image: url, licensePlate: plate }]
          } catch (e) {
            return [String(cid), { image: null, licensePlate: null }]
          }
        }))
        if (!mounted) return
        const map = {}
        for (const [k, v] of pairs) map[k] = v
        setImagesByCarId(map)
      } catch (e) {
        // ignore
      }
    }
    loadImages()
    return () => { mounted = false }
  }, [bookings])

  const formatRentalDate = (dateInput) => {
    if (!dateInput) return '-'
    try {
      const dateObj = new Date(dateInput)
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+)/, '$3-$2-$1 $4:$5')
      }
    } catch (e) {}
    return dateInput
  }

  // Resolve a date value from a booking object using a list of candidate keys (handles various naming conventions)
  const resolveDateFromBooking = (b, candidates = []) => {
    if (!b) return null
    for (const key of candidates) {
      // Accept both camelCase and PascalCase keys
      const variants = [key, key[0].toLowerCase() + key.slice(1), key[0].toUpperCase() + key.slice(1)]
      for (const k of variants) {
        try {
          const val = b[k]
          if (val !== undefined && val !== null && String(val).trim() !== '') return val
        } catch (e) {}
      }
    }
    return null
  }

  // Resolve customer info (name, email, phone) using booking fields and usersById as fallback
  const resolveCustomerInfo = (b) => {
    if (!b) return { name: null, email: null, phone: null }
    const uid = b.userId || b.UserId || b.customerId || b.CustomerId || b.UserID || b.User || b.user?.id
    const userLookup = uid ? usersById[String(uid)] || {} : {}

    const name = (
      b.fullName || b.userFullName || b.customerName || b.customer || b.user?.fullName || userLookup.fullName ||
      ([b.firstName, b.lastName].filter(Boolean).join(' ')) || b.userName || b.UserName || userLookup.userName || null
    )

    const email = (
      b.email || b.customerEmail || b.userEmail || b.user?.email || userLookup.email || null
    )

    const phone = (
      b.phone || b.customerPhone || b.user?.phoneNumber || b.mobile || b.mobileNumber || userLookup.phone || null
    )

    return { name, email, phone }
  }

  useEffect(() => {
    let mounted = true
    async function loadUsers() {
      try {
        const userIds = Array.from(new Set((bookings || []).map(b => b.userId || b.UserId || b.customerId || b.CustomerId).filter(Boolean)))
        if (userIds.length === 0) return
        const pairs = await Promise.all(userIds.map(async uid => {
          try {
            const u = await userApi.getUserById(uid)
            const email = u?.email || u?.Email || u?.userEmail || u?.userName || null
            const phone = u?.phoneNumber || u?.phone || u?.Phone || u?.mobile || null
            const fullName = u?.fullName || u?.FullName || [u?.firstName, u?.lastName].filter(Boolean).join(' ') || null
            return [String(uid), { email, phone, fullName }]
          } catch (e) {
            return [String(uid), { email: null, phone: null, fullName: null }]
          }
        }))
        if (!mounted) return
        const map = {}
        for (const [k, v] of pairs) map[k] = v
        setUsersById(map)
      } catch (e) {
        // ignore
      }
    }
    loadUsers()
    return () => { mounted = false }
  }, [bookings])

  // Debug: inspect booking objects to find which date fields are present
  useEffect(() => {
    try {
      if (!Array.isArray(bookings) || bookings.length === 0) return
      const sample = bookings.slice(0, 8)
      sample.forEach(b => {
        const fields = {
          id: b.id || b.Id || b.bookingId || b.BookingId,
          pickupDate: b.pickupDate,
          rentalStartDate: b.rentalStartDate,
          startDateTime: b.startDateTime,
          startDate: b.startDate,
          pickup: b.pickup,
          fromDate: b.fromDate,
          returnDate: b.returnDate,
          rentalEndDate: b.rentalEndDate,
          endDateTime: b.endDateTime,
          endDate: b.endDate,
          toDate: b.toDate,
          bookingDate: b.bookingDate,
          date: b.date,
          createdAt: b.createdAt,
          created: b.created
        }
        console.debug('BookingTable: booking date fields for', fields.id, fields)
      })
    } catch (e) {
      console.warn('BookingTable debug failed', e)
    }
  }, [bookings])

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

      <div style={{ overflowX: 'auto' }}>
        <table className="booking-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 840 }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#fafafa' }}>
              <th style={{ padding: '12px 10px' }}>Vehicle</th>
              <th style={{ padding: '12px 10px', width: 220 }}>Email</th>
              <th style={{ padding: '12px 10px' }}>Phone</th>
              <th style={{ padding: '12px 10px' }}>Return</th>
              <th style={{ padding: '12px 10px' }}>Booking Date</th>
              <th style={{ padding: '12px 10px' }}>Status</th>
              <th style={{ padding: '12px 10px', width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 24, color: '#666' }}>No bookings found</td>
              </tr>
            )}
            {filtered.map(b => (
              <tr key={b.id} className="booking-row" onClick={() => onRowClick(b)} style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 10px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img
                    src={(() => {
                      const carId = b.carId || b.CarId || b.car?.id || b.car?.Id || b.vehicle?.id || b.vehicle?.Id
                      const byCar = carId ? imagesByCarId[String(carId)] : null
                      const candidate = (byCar && byCar.image) || b.img || getImageUrlOrIcon(b.img)
                      return candidate || 'https://via.placeholder.com/100x60?text=Car'
                    })()}
                    onError={(e) => { e.target.onerror = null; applyCarIconFallback(e.currentTarget) }}
                    alt="car"
                    style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', background: '#fff' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.title || 'Vehicle'}</div>
                  </div>
                </td>
                {(() => {
                  const c = resolveCustomerInfo(b)
                  return (
                    <>
                      <td style={{ padding: '12px 10px' }}>{ c.email || '-' }</td>
                      <td style={{ padding: '12px 10px' }}>{ c.phone || '-' }</td>
                    </>
                  )
                })()}
                <td style={{ padding: '12px 10px' }}>{ formatRentalDate(resolveDateFromBooking(b, ['ExpectedReturnDateTime','returnDate','rentalEndDate','endDateTime','endDate','toDate','actualReturnDate','actualReturnDateTime','end','end_at','return_at'])) }</td>
                <td style={{ padding: '12px 10px' }}>{ formatRentalDate(resolveDateFromBooking(b, ['date','bookingDate','createdAt','created','CreatedAt','Created','created_date'])) }</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: b.status === 'completed' ? '#e6f7ec' : b.status === 'cancelled' ? '#fff0f0' : '#f0f6ff', color: b.status === 'completed' ? '#2b8a3e' : b.status === 'cancelled' ? '#b00020' : '#1351b4', fontWeight: 600, fontSize: 12 }}>{b.statusLabel || b.status || ''}</span>
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <button onClick={(e) => { e.stopPropagation(); onRowClick(b); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
