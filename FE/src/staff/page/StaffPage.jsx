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
  const updateVehicle = async (id, payload) => {
    try {
      if (payload.battery !== undefined && payload.battery !== '') {
        let val = Number(payload.battery)
        if (!Number.isNaN(val)) {
          val = Math.max(0, Math.min(100, Math.round(val)))
          await StaffAPI.updateBatteryLevel(id, val)
        }
      }
      if (payload.tech) {
        await StaffAPI.updateStatus(id, payload.tech)
      }
      if (payload.issue) {
        try { await StaffAPI.updateCarDescription(id, payload.issue) }
        catch { await StaffAPI.updateCar(id, { description: payload.issue }) }
      }
    } catch (e) {
      setError(e?.message || 'Failed to update vehicle')
    }
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...payload } : v));
  };

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
          try { cars = await StaffAPI.getAvailableCarsByStation(stationId) }
          catch { try { cars = await StaffAPI.getCarsByStation(stationId) } catch { cars = [] } }
        } else {
          try { cars = await StaffAPI.getAllCars(1, 100) }
          catch { try { cars = await StaffAPI.listCars({ page: 1, pageSize: 100 }) } catch { cars = [] } }
        }
        if (!mounted) return
        const normalizePercent = (v) => {
          const n = Number(v); if (Number.isFinite(n) && n >= 0 && n <= 100) return Math.round(n); return null
        }
        const mapped = (cars || []).map(c => ({
          id: c.id || c.Id,
          name: c.name || c.Name || c.model || c.CarName || 'Car',
          img: c.imageUrl || c.image || c.thumbnailUrl || `https://via.placeholder.com/440x280?text=${encodeURIComponent(c.name || c.Name || 'Car')}`,
          battery: normalizePercent(c.currentBatteryLevel ?? c.CurrentBatteryLevel ?? c.batteryPercent ?? c.battery),
          tech: c.condition ?? c.status ?? c.Status ?? null,
          issue: c.issue ?? c.issueDescription ?? null,
          capacity: c.batteryCapacity ?? c.BatteryCapacity ?? c.capacity ?? c.capacityKWh ?? c.batteryCapacityKWh ?? null
        }))
        setVehicles(mapped)

        // Opportunistically fetch battery percent for vehicles missing it
        const needBattery = mapped.filter(v => v.battery == null)
        const needCapacity = mapped.filter(v => v.capacity == null)
        if (needBattery.length > 0) {
          try {
            const updates = await Promise.all(needBattery.map(async v => {
              try {
                const b = await StaffAPI.getCarBattery(v.id)
                return { id: v.id, battery: normalizePercent(b) }
              } catch { return { id: v.id, battery: null } }
            }))
            if (!mounted) return
            setVehicles(prev => prev.map(v => {
              const u = updates.find(x => x.id === v.id)
              return u && u.battery != null ? { ...v, battery: u.battery } : v
            }))
          } catch {}
        }
        if (needCapacity.length > 0) {
          try {
            const updatesCap = await Promise.all(needCapacity.map(async v => {
              try {
                const cap = await StaffAPI.getCarCapacity(v.id)
                return { id: v.id, capacity: cap }
              } catch { return { id: v.id, capacity: null } }
            }))
            if (!mounted) return
            setVehicles(prev => prev.map(v => {
              const u = updatesCap.find(x => x.id === v.id)
              return u && u.capacity != null ? { ...v, capacity: u.capacity } : v
            }))
          } catch {}
        }
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
    async function loadBookings() {
      try {
        setLoadingBookings(true)
        let items = []
        if (stationId) {
          items = await StaffAPI.getBookingsByStation(stationId)
        } else {
          items = await StaffAPI.listBookings({ page: 1, pageSize: 100 })
        }
        if (!mounted) return
        const mapped = (items || []).map(b => {
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
              {loadingBookings && <span>Loading bookings…</span>}
            </div>
            {!loadingBookings && bookings.length === 0 && (
              <div style={{padding:'10px 12px', color:'#555'}}>No bookings to display for this station.</div>
            )}
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
          </>
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
