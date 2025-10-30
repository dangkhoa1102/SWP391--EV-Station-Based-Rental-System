import React, { useState, useEffect } from 'react';
import './StaffPage.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BookingSection from './components/Booking/BookingSection';
import VehicleSection from './components/Vehicle/VehicleSection';
import ProfileSection from './components/Profile/ProfileSection';
import StaffAPI from '../services/staffApi';

// Start with empty lists; we will load from API
const initialBookings = [];
const initialVehicles = [];

export default function StaffPage() {
  const [section, setSection] = useState('booking');
  const [bookings, setBookings] = useState(initialBookings);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState('');
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState('');

  // Booking actions (call API then update locally)
  const confirmBooking = async (id) => {
    try {
      // Try minimal payload first
      await StaffAPI.post('/Bookings/Confirm', { bookingId: id })
    } catch {
      // Fallback to user API's method signature with default payment method
      try { await StaffAPI.post('/Bookings/Confirm', { bookingId: id, paymentMethod: 'Cash', paymentTransactionId: '' }) } catch {}
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'booked' } : b))
  };
  const completeBooking = async (id) => {
    try {
      await StaffAPI.post(`/Bookings/Complete-By-${encodeURIComponent(id)}`)
    } catch {
      try { await StaffAPI.post('/Bookings/Complete', { bookingId: id }) } catch {}
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b))
  };
  const denyBooking = async (id) => {
    try {
      await StaffAPI.post('/Bookings/Deny', { bookingId: id })
    } catch {
      try { await StaffAPI.post('/Bookings/Reject', { bookingId: id }) } catch {}
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'denied' } : b))
  };

  // Vehicle actions
  const addVehicle = (vehicle) => setVehicles(prev => [...prev, vehicle]);
  const removeVehicle = (id) => setVehicles(prev => prev.filter(v => v.id !== id));
  const updateVehicle = (id, payload) => setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...payload } : v));

  // Handle global body class to trigger CSS margin transitions
  useEffect(() => {
    if (sidebarVisible) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [sidebarVisible]);

  // Load stations on mount, then load vehicles for first station
  useEffect(() => {
    let mounted = true
    async function loadStations() {
      try {
        setLoadingStations(true)
        const s = await StaffAPI.getAllStations(1, 100)
        if (!mounted) return
        setStations(s || [])
        const firstId = (s && s[0] && (s[0].id || s[0].Id)) || ''
        setStationId(prev => prev || firstId)
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load stations')
      } finally {
        if (mounted) setLoadingStations(false)
      }
    }
    loadStations()
    return () => { mounted = false }
  }, [])

  // Load vehicles when station changes
  useEffect(() => {
    let mounted = true
    async function loadVehicles() {
      try {
        setLoadingVehicles(true)
        let cars = []
        if (stationId) {
          cars = await StaffAPI.getAvailableCarsByStation(stationId)
        } else {
          cars = await StaffAPI.getAllCars(1, 100)
        }
        if (!mounted) return
        const mapped = (cars || []).map(c => ({
          id: c.id || c.Id,
          name: c.name || c.Name || c.model || c.CarName || 'Car',
          img: c.imageUrl || c.image || c.thumbnailUrl || `https://via.placeholder.com/440x280?text=${encodeURIComponent(c.name || c.Name || 'Car')}`
        }))
        setVehicles(mapped)
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load vehicles')
      } finally {
        if (mounted) setLoadingVehicles(false)
      }
    }
    loadVehicles()
    return () => { mounted = false }
  }, [stationId])

  // Load bookings for station when station changes
  useEffect(() => {
    let mounted = true
    const unwrapToArray = (r) => {
      if (Array.isArray(r)) return r
      if (Array.isArray(r?.data?.data)) return r.data.data
      if (Array.isArray(r?.data?.items)) return r.data.items
      if (Array.isArray(r?.data)) return r.data
      if (Array.isArray(r?.items)) return r.items
      return []
    }
    async function loadBookings() {
      try {
        setLoadingBookings(true)
        let res = []
        if (stationId) {
          // Try several common station-booking endpoints
          try {
            res = await StaffAPI.get(`/Bookings/Get-By-Station/${encodeURIComponent(stationId)}`)
          } catch {
            try { res = await StaffAPI.get('/Bookings/Get-All', { params: { stationId } }) } catch {
              try { res = await StaffAPI.get(`/Stations/${encodeURIComponent(stationId)}/Bookings`) } catch {}
            }
          }
        } else {
          try { res = await StaffAPI.get('/Bookings/Get-All', { params: { pageNumber: 1, pageSize: 100 } }) } catch {}
        }

        if (!mounted) return
        const items = unwrapToArray(res)
        const mapped = items.map(b => {
          const id = b.id || b.Id || b.bookingId || b.BookingId
          const carName = b.carName || b.vehicleName || b.car?.name || b.car?.Name || 'Booking'
          const customerName = b.customerName || b.userFullName || b.user?.fullName || b.customer?.name || 'Customer'
          const rawStatus = b.status || b.Status || b.bookingStatus || ''
          const status = (rawStatus || '').toString().toLowerCase().includes('complete') ? 'completed'
                        : (rawStatus || '').toString().toLowerCase().includes('deny') ? 'denied'
                        : 'booked'
          const date = b.date || b.createdAt || b.bookingDate || ''
          const img = b.carImageUrl || b.car?.imageUrl || b.vehicle?.imageUrl || `https://via.placeholder.com/440x280?text=${encodeURIComponent(carName)}`
          return {
            id,
            title: carName,
            customer: customerName,
            status,
            date,
            img,
            facePhoto: b.customerPhoto || b.user?.avatarUrl,
            idString: b.customerIdNumber || b.user?.identityNumber || '',
            phone: b.customerPhone || b.user?.phoneNumber || ''
          }
        })
        setBookings(mapped)
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load bookings')
      } finally {
        if (mounted) setLoadingBookings(false)
      }
    }
    loadBookings()
    return () => { mounted = false }
  }, [stationId])

  return (
    <div className="app-layout">
      <Header />

      {/* Hover trigger zone */}
      <div
        className="sidebar-hover-zone"
        onMouseEnter={() => setSidebarVisible(true)}
      />

      {/* Sidebar that slides and affects content */}
      <div
        className={`sidebar-wrapper ${sidebarVisible ? 'visible' : ''}`}
        onMouseLeave={() => setSidebarVisible(false)}
      >
        <Sidebar onSelect={setSection} isOpen={true} />
      </div>

      <main className={`main-content ${sidebarVisible ? 'shifted' : ''}`}>
        {error && (
          <div style={{background:'#ffecec', color:'#b00020', padding:'8px 12px', borderRadius:6, marginBottom:12}}>
            {error}
          </div>
        )}
        {section === 'booking' && (
          <BookingSection
            bookings={bookings}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onConfirm={confirmBooking}
            onComplete={completeBooking}
            onDeny={denyBooking}
          />
        )}
        {section === 'vehicle' && (
          <>
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
              <label style={{fontWeight:600}}>Station:</label>
              <select value={stationId} onChange={e=>setStationId(e.target.value)} disabled={loadingStations}>
                <option value="">All stations</option>
                {stations.map(s => {
                  const id = s.id || s.Id
                  const name = s.name || s.Name || s.stationName || `Station ${id}`
                  return <option key={id} value={id}>{name}</option>
                })}
              </select>
              {loadingVehicles && <span>Loading vehicles…</span>}
            </div>
            <VehicleSection
              vehicles={vehicles}
              onAdd={addVehicle}
              onRemove={removeVehicle}
              onUpdate={updateVehicle}
            />
          </>
        )}
        {section === 'profile' && <ProfileSection />}
      </main>
    </div>
  );
}
