<<<<<<< Updated upstream
import React, { useState, useEffect } from 'react';
import './StaffPage.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BookingSection from './components/Booking/BookingSection';
import VehicleSection from './components/Vehicle/VehicleSection';
import ProfileSection from './components/Profile/ProfileSection';

const initialBookings = [
  { id: 1, title: 'Tesla Model 3', customer: 'Nguyen Van A', status: 'booked', date: '2025-10-10', img: 'https://via.placeholder.com/440x280?text=Tesla+3', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+A', idString: '012345678901', phone: '0912345678' },
  { id: 2, title: 'Nissan Leaf', customer: 'Tran Thi B', status: 'denied', date: '2025-10-11', img: 'https://via.placeholder.com/440x280?text=Nissan+Leaf', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+B', idString: '987654321098', phone: '0987654321' },
  { id: 3, title: 'BMW i3', customer: 'Le Van C', status: 'completed', date: '2025-10-09', img: 'https://via.placeholder.com/440x280?text=BMW+i3', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+C', idString: '123123123123', phone: '0911222333' },
  { id: 4, title: 'Hyundai Kona', customer: 'Pham Thi D', status: 'booked', date: '2025-10-12', img: 'https://via.placeholder.com/440x280?text=Hyundai+Kona', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+D', idString: '321321321321', phone: '0900111222' },
  { id: 5, title: 'Kia EV6', customer: 'Do Thi E', status: 'booked', date: '2025-10-13', img: 'https://via.placeholder.com/440x280?text=Kia+EV6', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+E', idString: '555666777888', phone: '0901234567' },
  { id: 6, title: 'Volkswagen ID.4', customer: 'Pham Van F', status: 'booked', date: '2025-10-14', img: 'https://via.placeholder.com/440x280?text=VW+ID.4', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+F', idString: '111222333444', phone: '0919876543' },
  { id: 7, title: 'Hyundai Ioniq 5', customer: 'Le Thi G', status: 'completed', date: '2025-10-08', img: 'https://via.placeholder.com/440x280?text=Ioniq+5', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+G', idString: '222333444555', phone: '0933334444' },
  { id: 8, title: 'Tesla Model Y', customer: 'Tran Van H', status: 'denied', date: '2025-10-07', img: 'https://via.placeholder.com/440x280?text=Model+Y', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+H', idString: '333444555666', phone: '0944445555' },
  { id: 9, title: 'BYD Atto 3', customer: 'Nguyen Thi I', status: 'booked', date: '2025-10-06', img: 'https://via.placeholder.com/440x280?text=BYD+Atto+3', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+I', idString: '444555666777', phone: '0955556666' },
  { id: 10, title: 'VinFast VF8', customer: 'Hoang Van J', status: 'booked', date: '2025-10-05', img: 'https://via.placeholder.com/440x280?text=VF8', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+J', idString: '555666777999', phone: '0966667777' },
  { id: 11, title: 'Renault Zoe', customer: 'Bui Thi K', status: 'completed', date: '2025-10-04', img: 'https://via.placeholder.com/440x280?text=Zoe', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+K', idString: '666777888999', phone: '0977778888' },
  { id: 12, title: 'Honda e', customer: 'Ngo Van L', status: 'booked', date: '2025-10-03', img: 'https://via.placeholder.com/440x280?text=Honda+e', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+L', idString: '777888999000', phone: '0988889999' },
  { id: 13, title: 'Peugeot e-208', customer: 'Pham Minh M', status: 'booked', date: '2025-10-02', img: 'https://via.placeholder.com/440x280?text=e-208', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+M', idString: '888999000111', phone: '0911001100' },
  { id: 14, title: 'Volvo XC40 Recharge', customer: 'Tran Bao N', status: 'completed', date: '2025-10-01', img: 'https://via.placeholder.com/440x280?text=XC40+Recharge', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+N', idString: '999000111222', phone: '0922002200' },
  { id: 15, title: 'Audi Q4 e-tron', customer: 'Le Thanh O', status: 'denied', date: '2025-09-30', img: 'https://via.placeholder.com/440x280?text=Q4+e-tron', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+O', idString: '000111222333', phone: '0933003300' },
  { id: 16, title: 'Mercedes EQB', customer: 'Nguyen My P', status: 'booked', date: '2025-09-29', img: 'https://via.placeholder.com/440x280?text=EQB', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+P', idString: '111222333444', phone: '0944004400' },
  { id: 17, title: 'Skoda Enyaq iV', customer: 'Do Hai Q', status: 'booked', date: '2025-09-28', img: 'https://via.placeholder.com/440x280?text=Enyaq+iV', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+Q', idString: '222333444555', phone: '0955005500' },
  { id: 18, title: 'Porsche Taycan', customer: 'Bui Khang R', status: 'completed', date: '2025-09-27', img: 'https://via.placeholder.com/440x280?text=Taycan', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+R', idString: '333444555666', phone: '0966006600' },
  { id: 19, title: 'Tesla Model S', customer: 'Hoang Y S', status: 'booked', date: '2025-09-26', img: 'https://via.placeholder.com/440x280?text=Model+S', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+S', idString: '444555666777', phone: '0977007700' },
  { id: 20, title: 'Mini Cooper SE', customer: 'Ngo Linh T', status: 'denied', date: '2025-09-25', img: 'https://via.placeholder.com/440x280?text=Mini+SE', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+T', idString: '555666777888', phone: '0988008800' },
];

const initialVehicles = [
  { id: 1, name: 'Tesla Model 3', desc: 'Electric sedan', detail: 'Range: 350km', img: 'https://via.placeholder.com/440x280?text=Tesla+3' },
  { id: 2, name: 'Nissan Leaf', desc: 'Compact EV', detail: 'Range: 250km', img: 'https://via.placeholder.com/440x280?text=Nissan+Leaf' },
  { id: 3, name: 'BMW i3', desc: 'Urban EV', detail: 'Range: 200km', img: 'https://via.placeholder.com/440x280?text=BMW+i3' },
  { id: 4, name: 'Hyundai Kona', desc: 'SUV EV', detail: 'Range: 400km', img: 'https://via.placeholder.com/440x280?text=Hyundai+Kona' },
  { id: 5, name: 'Kia EV6', desc: 'Crossover EV', detail: 'Range: 500km', img: 'https://via.placeholder.com/440x280?text=Kia+EV6' },
  { id: 6, name: 'Volkswagen ID.4', desc: 'Compact SUV', detail: 'Range: 420km', img: 'https://via.placeholder.com/440x280?text=VW+ID.4' },
  { id: 7, name: 'Hyundai Ioniq 5', desc: 'Modern hatch', detail: 'Range: 480km', img: 'https://via.placeholder.com/440x280?text=Ioniq+5' },
  { id: 8, name: 'Tesla Model Y', desc: 'SUV EV', detail: 'Range: 505km', img: 'https://via.placeholder.com/440x280?text=Model+Y' },
  { id: 9, name: 'BYD Atto 3', desc: 'Affordable EV', detail: 'Range: 420km', img: 'https://via.placeholder.com/440x280?text=BYD+Atto+3' },
  { id: 10, name: 'VinFast VF8', desc: 'Midsize SUV', detail: 'Range: 471km', img: 'https://via.placeholder.com/440x280?text=VF8' },
  { id: 11, name: 'Renault Zoe', desc: 'City car', detail: 'Range: 390km', img: 'https://via.placeholder.com/440x280?text=Zoe' },
  { id: 12, name: 'Honda e', desc: 'Compact city EV', detail: 'Range: 220km', img: 'https://via.placeholder.com/440x280?text=Honda+e' },
];

export default function StaffPage() {
  const [section, setSection] = useState('booking');
  const [bookings, setBookings] = useState(initialBookings);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Booking actions
  const confirmBooking = (id) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'booked' } : b));
  const completeBooking = (id) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b));
  const denyBooking = (id) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'denied' } : b));

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
          <VehicleSection
            vehicles={vehicles}
            onAdd={addVehicle}
            onRemove={removeVehicle}
            onUpdate={updateVehicle}
          />
        )}
        {section === 'profile' && <ProfileSection />}
      </main>
    </div>
  );
}
=======
import React, { useState, useEffect } from 'react';
import './StaffPage.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BookingSection from './components/Booking/BookingSection';
import VehicleSection from './components/Vehicle/VehicleSection';
import ProfileSection from './components/Profile/ProfileSection';
import StaffAPI from '../services/staffApi';
import { PLACEHOLDER } from '../../utils/placeholder';

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
  const [warning, setWarning] = useState('');
  const [role, setRole] = useState('');
  const [stationSlots, setStationSlots] = useState(null);

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

  // New: continue to payment handler
  const continueToPayment = async (booking) => {
    try {
      // Default to Cash unless a payment UI is integrated later
      await StaffAPI.confirmBooking(booking.id, 'Cash', '')
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'booked' } : b))
    } catch (e) {
      setError(e?.message || 'Failed to proceed to payment')
    }
  }

  // Cancel booking (soft cancel)
  const cancelBooking = async (booking, reason = '') => {
    try {
      await StaffAPI.cancelBooking(booking.id, reason || '')
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'denied' } : b))
    } catch (e) {
      const code = e?.response?.status
      if (code === 401 || code === 403) {
        alert("You don't have permission to cancel this booking.")
        return
      }
      setError(e?.message || 'Failed to cancel booking')
    }
  }

  // Update a booking's status in local state (used by modal after payment sync)
  const handleStatusUpdated = (bookingId, nextStatus) => {
    const label = nextStatus === 'pending' ? 'Pending'
                : nextStatus === 'booked' ? 'Booked'
                : nextStatus === 'checked-in' ? 'Check-in Pending'
                : nextStatus === 'completed' ? 'Completed'
                : nextStatus === 'denied' ? 'Denied'
                : nextStatus
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: nextStatus, statusLabel: label } : b))
  }


  // Vehicle actions
  const addVehicle = async (payload) => {
    try {
      if (!stationId) {
        setError('Please select a station before creating a vehicle.')
        return
      }
      // Normalize payload keys to match varied backends
      const normalized = { ...payload }
      // Station assignment: include multiple key variants
      normalized.currentStationId = stationId
      normalized.stationId = stationId
      normalized.StationId = stationId
      // Rental price naming variants
      if (normalized.rentalPricePerDate != null && normalized.rentalPricePerDay == null) {
        normalized.rentalPricePerDay = normalized.rentalPricePerDate
      }
      if (normalized.rentalPricePerDay != null && normalized.rentalPricePerDate == null) {
        normalized.rentalPricePerDate = normalized.rentalPricePerDay
      }
      // Battery capacity naming variants
      if (normalized.batteryCapacity != null && normalized.BatteryCapacity == null) {
        normalized.BatteryCapacity = normalized.batteryCapacity
      }
      // Current battery naming variants
      if (normalized.currentBatteryLevel != null && normalized.CurrentBatteryLevel == null) {
        normalized.CurrentBatteryLevel = normalized.currentBatteryLevel
      }
      const created = await StaffAPI.createCar(normalized)
      // Map created car to view model
      const c = created || {}
      const map = (c) => ({
        id: c.id || c.Id || c.carId || c.CarId,
        name: c.name || c.Name || [c.brand, c.model].filter(Boolean).join(' ') || 'Car',
        model: c.model || c.Model || null,
        brand: c.brand || c.Brand || null,
        licensePlate: c.licensePlate || c.LicensePlate || null,
        img: c.imageUrl || c.image || c.thumbnailUrl || PLACEHOLDER.car(c.name || c.Name || c.model || 'Car'),
        battery: Number.isFinite(c.currentBatteryLevel) ? Math.round(c.currentBatteryLevel) : undefined,
        tech: c.condition ?? c.status ?? c.Status ?? null,
        issue: c.issue ?? c.issueDescription ?? null,
        capacity: c.batteryCapacity ?? c.BatteryCapacity ?? c.capacity ?? c.capacityKWh ?? c.batteryCapacityKWh ?? null
      })
      setVehicles(prev => [...prev, map(c)])
      // Update slot info after adding
      await updateStationSlots(stationId)
      return created
    } catch (e) {
      setError(e?.message || 'Failed to create vehicle')
      throw e
    }
  }
  const removeVehicle = async (id) => {
    try {
      await StaffAPI.deleteCar(id)
      setVehicles(prev => prev.filter(v => v.id !== id))
      // Update slot info after removing
      await updateStationSlots(stationId)
    } catch (e) {
      const code = e?.response?.status
      // If not authorized, show a friendly warning and stop
      if (code === 401 || code === 403) {
        setWarning("You don't have permission to delete vehicles. Please contact an administrator.")
        return
      }
      // Fallback: some backends don't hard-delete; try setting a non-active status
      try {
        const candidates = ['Deleted', 'Inactive', 'Removed', 'Unavailable', 'Deactivated']
        let success = false
        for (const status of candidates) {
          try {
            await StaffAPI.updateStatus(id, status)
            success = true
            break
          } catch {}
        }
        if (success) {
          setVehicles(prev => prev.filter(v => v.id !== id))
          return
        }
      } catch {}
      setError(e?.message || 'Failed to delete vehicle')
    }
  }
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

  // Update station slot information
  const updateStationSlots = async (sid) => {
    if (!sid) {
      setStationSlots(null);
      return;
    }
    try {
      const report = await StaffAPI.getCarStatusReport(sid, null);
      if (report) {
        setStationSlots({
          totalCars: report.totalCars || 0,
          availableCars: report.availableCars || 0
        });
      }
    } catch (e) {
      console.warn('Failed to load station slots:', e);
    }
  };

  // Handle global body class to trigger CSS margin transitions
  useEffect(() => {
    if (sidebarVisible) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [sidebarVisible]);

  // Load stations on mount and get staff's assigned station
  useEffect(() => {
    let mounted = true
    async function loadRole() {
      try {
        const me = await StaffAPI.getMe()
        const r = me?.role || me?.Role || me?.roleName || me?.userRole || (Array.isArray(me?.roles) ? me.roles[0] : '')
        if (mounted) setRole(r || '')
      } catch {
        // Try from token if /Auth/Me is not available
        try {
          const t = localStorage.getItem('token')
          if (t) {
            const decoded = StaffAPI.decodeJwt(t)
            const r = decoded?.role || decoded?.Role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            if (mounted) setRole(r || '')
          }
        } catch {}
      }
    }
    async function loadStaffStation() {
      try {
        setLoadingStations(true)
        
        console.log('🔍 Loading assigned station for staff');
        
        // Try multiple approaches to get station assignment
        let assignedStation = null;
        let assignedStationId = null;
        
        // APPROACH 1: Try getMyProfile()
        if (!assignedStationId) {
          try {
            console.log('📍 Trying getMyProfile()...');
            const profile = await StaffAPI.getMyProfile();
            console.log('   Profile received:', profile);
            
            const profileStationId = profile.stationId || profile.StationId;
            if (profileStationId) {
              console.log(`✅ Found stationId in profile: ${profileStationId}`);
              
              // Load all stations to get full station object
              const allStations = await StaffAPI.getAllStations(1, 100);
              assignedStation = allStations.find(s => (s.id || s.Id) === profileStationId);
              assignedStationId = profileStationId;
              
              if (assignedStation) {
                console.log(`✅ Station details loaded:`, assignedStation);
              }
            }
          } catch (profileErr) {
            console.warn('⚠️ Could not get station from profile:', profileErr.message);
          }
        }
        
        // APPROACH 2: Try getting user details by userId
        if (!assignedStationId) {
          try {
            console.log('📍 Trying to get station from user details...');
            
            const userId = localStorage.getItem('userId') || '';
            const staffId = localStorage.getItem('staffId') || userId;
            
            // Try to get userId from token
            let tokenUserId = null;
            try {
              const token = localStorage.getItem('token');
              if (token) {
                const decoded = StaffAPI.decodeJwt(token);
                tokenUserId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
                           || decoded.nameidentifier 
                           || decoded.sub 
                           || decoded.userId;
              }
            } catch (e) {}
            
            const possibleIds = [staffId, userId, tokenUserId].filter(Boolean);
            console.log('   Trying user IDs:', possibleIds);
            
            for (const id of possibleIds) {
              try {
                const userDetails = await StaffAPI.get(`/Users/Get-By-${id}`);
                const userData = userDetails?.data || userDetails;
                const userStationId = userData.stationId || userData.StationId;
                
                if (userStationId) {
                  console.log(`✅ Found stationId in user details: ${userStationId}`);
                  
                  const allStations = await StaffAPI.getAllStations(1, 100);
                  assignedStation = allStations.find(s => (s.id || s.Id) === userStationId);
                  assignedStationId = userStationId;
                  
                  if (assignedStation) {
                    console.log(`✅ Station details loaded:`, assignedStation);
                    break;
                  }
                }
              } catch (userErr) {
                console.warn(`   Could not get user details for ${id}:`, userErr.message);
              }
            }
          } catch (e) {
            console.warn('⚠️ Could not get station from user details:', e.message);
          }
        }
        
        // Process the result - Load all stations if no specific assignment
        if (!assignedStationId || !assignedStation) {
          console.log('ℹ️ No specific station assignment found, loading all stations for staff access');
          try {
            // Load all stations - staff can work at any station
            const allStations = await StaffAPI.getAllStations(1, 100);
            const validStations = allStations.filter(s => !checkPlaceholderStationId(s.id || s.Id));
            
            if (mounted && validStations.length > 0) {
              setStations(validStations);
              // Set first valid station as default
              const firstStation = validStations[0];
              const firstStationId = firstStation.id || firstStation.Id;
              setStationId(firstStationId);
              console.log(`✅ Loaded ${validStations.length} stations for staff access, default:`, firstStationId);
            }
          } catch (e) {
            console.warn('⚠️ Could not load stations:', e.message);
          }
          return;
        }
        
        // Check for placeholder station patterns
        const isPlaceholder = checkPlaceholderStationId(assignedStationId);
        if (isPlaceholder) {
          console.warn(`⚠️ Station ${assignedStationId} looks like placeholder data, filtering out`);
          // Load all valid stations instead
          try {
            const allStations = await StaffAPI.getAllStations(1, 100);
            const validStations = allStations.filter(s => !checkPlaceholderStationId(s.id || s.Id));
            
            if (mounted && validStations.length > 0) {
              setStations(validStations);
              const firstStation = validStations[0];
              const firstStationId = firstStation.id || firstStation.Id;
              setStationId(firstStationId);
            }
          } catch (e) {
            console.warn('⚠️ Could not load stations:', e.message);
          }
          return;
        }
        
        // Success! Staff has specific station assignment
        const assignedStationName = assignedStation.name || assignedStation.Name || assignedStation.stationName;
        console.log(`✅ Final result - Staff assigned to station: ${assignedStationId} - ${assignedStationName}`);
        
        if (mounted) {
          setStations([assignedStation]);
          setStationId(assignedStationId);
          
          // Store in localStorage for quick access
          localStorage.setItem('staff_station_id', assignedStationId);
          localStorage.setItem('staff_station_name', assignedStationName);
        }
      } catch (e) {
        if (!mounted) return
        console.error('❌ Unexpected error in loadStaffStation:', e);
        setError(e?.message || 'Failed to load station')
      } finally {
        if (mounted) setLoadingStations(false)
      }
    }
    
    // Helper function to detect placeholder station IDs
    function checkPlaceholderStationId(stationId) {
      if (!stationId || typeof stationId !== 'string') return false;
      
      const cleanId = stationId.toLowerCase().replace(/-/g, '');
      
      // Check for repeating patterns
      for (let len = 1; len <= 4; len++) {
        const pattern = cleanId.substring(0, len);
        const repeated = pattern.repeat(Math.ceil(cleanId.length / len)).substring(0, cleanId.length);
        if (cleanId === repeated) {
          return true; // Placeholder pattern detected
        }
      }
      
      return false;
    }
    loadRole();
    loadStaffStation();
    return () => { mounted = false }
  }, [])

  // Load vehicles - show ALL vehicles from all stations
  useEffect(() => {
    let mounted = true
    async function loadVehicles() {
      try {
        setLoadingVehicles(true)
        let cars = []
        
        // Load ALL vehicles from all stations (no filtering)
        console.log('🚗 Loading all vehicles from all stations...')
        try { 
          cars = await StaffAPI.getAllCars(1, 1000) 
          console.log(`✅ Loaded ${cars?.length || 0} vehicles from all stations`)
        } catch { 
          try { 
            cars = await StaffAPI.listCars({ page: 1, pageSize: 1000 }) 
            console.log(`✅ Loaded ${cars?.length || 0} vehicles (fallback method)`)
          } catch { 
            console.error('❌ Failed to load vehicles')
            cars = [] 
          } 
        }
        // Ensure we always have an array
        if (!Array.isArray(cars)) cars = cars ? [cars] : []
        if (!mounted) return
        const normalizePercent = (v) => {
          const n = Number(v); if (Number.isFinite(n) && n >= 0 && n <= 100) return Math.round(n); return null
        }
        const mapped = (cars || []).map(c => {
          const pick = (...vals) => vals.find(v => v != null && v !== '')
          const stIdRaw = pick(c.currentStationId, c.CurrentStationId, c.currentStationID, c.stationId, c.StationId, c.stationID, c.station?.id, c.station?.Id, c.station?.stationId, c.station?.StationId)
          const norm = (v) => (v == null ? '' : String(v).replace(/[{}]/g, '').toLowerCase())
          const stId = stIdRaw || ''
          const stName = (() => {
            if (!stId) return null
            const match = stations.find(s => norm(s.id || s.Id) === norm(stId)) || null
            if (!match) return null
            return match.name || match.Name || null
          })()
          return {
          id: c.id || c.Id || c.carId || c.CarId,
          name: c.name || c.Name || c.model || c.CarName || 'Car',
          model: c.model || c.Model || null,
          brand: c.brand || c.Brand || null,
          licensePlate: c.licensePlate || c.LicensePlate || null,
          img: c.imageUrl || c.image || c.thumbnailUrl || PLACEHOLDER.car(c.name || c.Name || 'Car'),
          battery: normalizePercent(c.currentBatteryLevel ?? c.CurrentBatteryLevel ?? c.batteryPercent ?? c.battery),
          tech: c.condition ?? c.status ?? c.Status ?? null,
          issue: c.issue ?? c.issueDescription ?? null,
          capacity: c.batteryCapacity ?? c.BatteryCapacity ?? c.capacity ?? c.capacityKWh ?? c.batteryCapacityKWh ?? null,
          stationId: stId,
          stationName: stName || null
        }
        })
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
    async function loadSlots() {
      if (mounted && stationId) await updateStationSlots(stationId);
    }
    loadVehicles()
    loadSlots()
    return () => { mounted = false }
  }, [stations]) // Removed stationId dependency - load all vehicles/stations once

  // Load bookings - show ALL bookings from all stations
  useEffect(() => {
    let mounted = true
    async function loadBookings() {
      try {
        setLoadingBookings(true)
        let items = []
        
        // Load ALL bookings regardless of station assignment
        console.log('📋 Loading all bookings (no station filter)...')
        try {
          items = await StaffAPI.listBookings({ page: 1, pageSize: 200 })
          console.log(`✅ Loaded ${items?.length || 0} bookings from all stations`)
        } catch (e) {
          console.error('❌ Error loading bookings:', e)
          items = []
        }
        if (!mounted) return
        const mapped = (items || []).map(b => {
          const id = b.id || b.Id || b.bookingId || b.BookingId
          // Infer vehicle name from multiple sources
          const carBrand = b.car?.brand || b.car?.Brand || b.vehicle?.brand || b.vehicle?.Brand || b.carBrand || b.CarBrand || null
          const carModel = b.car?.model || b.car?.Model || b.vehicle?.model || b.vehicle?.Model || b.carModel || b.CarModel || null
          let carName = b.carName || b.vehicleName || b.car?.name || b.car?.Name || null
          if (!carName && (carBrand || carModel)) {
            carName = [carBrand, carModel].filter(Boolean).join(' ').trim() || null
          }
          if (!carName && typeof b.carInfo === 'string' && b.carInfo.trim()) {
            carName = b.carInfo.trim()
          }
          if (!carName && typeof b.CarInfo === 'string' && b.CarInfo.trim()) {
            carName = b.CarInfo.trim()
          }
          carName = carName || 'Booking'
          // Derive full name from First/Last name if available
          const firstName = b.user?.firstName || b.customer?.firstName || b.firstName || b.FirstName || b.user?.FirstName || b.customer?.FirstName
          const lastName  = b.user?.lastName  || b.customer?.lastName  || b.lastName  || b.LastName  || b.user?.LastName  || b.customer?.LastName
          const composedFullName = [firstName, lastName].filter(Boolean).join(' ')
          const customerName = composedFullName || b.customerName || b.userFullName || b.user?.fullName || b.customer?.name || b.user?.name || 'Customer'
          // Expand possible userId sources from various backends
          const userId = b.userId || b.UserId || b.user?.id || b.user?.Id || b.customerId || b.CustomerId ||
                         b.appUserId || b.AppUserId || b.accountId || b.AccountId || b.UserID ||
                         b.ownerId || b.OwnerId || b.createdById || b.CreatedById || ''
          // Username direct on booking or nested user
          const userName = b.user?.userName || b.user?.UserName || b.user?.username || b.userName || b.UserName || b.username || null
          const email = b.user?.email || b.customerEmail || b.email || b.userEmail || ''
          const address = b.user?.address || b.customerAddress || b.address || ''
          // Status mapping: prefer numeric codes, fall back to string patterns
          // Backend BookingStatus enum: 0=Pending, 1=Booked, 2=Contracted, 3=Checked In, 4=On-Going, 7=Cancelled
          const rawStatus = b.statusCode ?? b.StatusCode ?? b.bookingStatus ?? b.BookingStatus ?? b.status ?? b.Status
          let status = 'booked'
          if (rawStatus != null && (typeof rawStatus === 'number' || /^\d+$/.test(String(rawStatus)))) {
            const code = Number(rawStatus)
            if (code === 0) status = 'pending'
            else if (code === 1) status = 'booked'
            else if (code === 2) status = 'contracted'
            else if (code === 3) status = 'checked-in'
            else if (code === 4) status = 'on-going'
            else if (code === 7) status = 'denied'  // 7 = Cancelled
          } else {
            const s = String(rawStatus || '').toLowerCase()
            if (s.includes('pending') || s.includes('wait')) status = 'pending'
            else if (s.includes('contract')) status = 'contracted'
            else if (s.includes('check') && s.includes('in')) status = 'checked-in'
            else if (s.includes('on-going') || s.includes('ongoing') || s.includes('progress')) status = 'on-going'
            else if (s.includes('complete') || s.includes('finish')) status = 'completed'
            else if (s.includes('deny') || s.includes('reject') || s.includes('cancel')) status = 'denied'
            else status = 'booked'
          }
          const statusLabel = status === 'pending' ? 'Pending'
                             : status === 'booked' ? 'Booked'
                             : status === 'contracted' ? 'Contracted'
                             : status === 'checked-in' ? 'Checked In'
                             : status === 'on-going' ? 'On-Going'
                             : status === 'completed' ? 'Completed'
                             : status === 'denied' ? 'Denied' : (String(rawStatus || '') || 'Booked')
          // Derive a UI stage hint without changing the canonical status
          const s = String(rawStatus || '').toLowerCase()
          const uiStage = (Number(rawStatus) === 0 || s.includes('pending') || s.includes('wait'))
            ? 'waiting-payment'
            : ((s.includes('check') && s.includes('in') && (s.includes('pay') || s.includes('payment'))) ? 'checkin-payment' : null)
          const date = b.date || b.createdAt || b.bookingDate || ''
          const img = b.carImageUrl || b.car?.imageUrl || b.vehicle?.imageUrl || PLACEHOLDER.car(carName)
          return {
            id,
            title: carName,
            // expose name fields for UI
            firstName: firstName || null,
            lastName: lastName || null,
            // Only set fullName if we have a real name, not the generic placeholder
            fullName: (composedFullName || b.userFullName || b.user?.fullName || b.customer?.name || b.user?.name) || null,
            customer: customerName,
            userId,
            userName,
            email,
            address,
            status,
            statusLabel,
            uiStage,
            date,
            img,
            // identity images (CCCD/CMND front/back)
            cccdFrontUrl: b.cccdFrontUrl || b.identityFrontUrl || b.idFrontUrl || b.frontImageUrl || b.frontIdUrl || b.cccdFrontImageUrl || b.customer?.cccdFrontUrl || b.user?.cccdFrontUrl,
            cccdBackUrl: b.cccdBackUrl || b.identityBackUrl || b.idBackUrl || b.backImageUrl || b.backIdUrl || b.cccdBackImageUrl || b.customer?.cccdBackUrl || b.user?.cccdBackUrl,
            // driver license (GPLX) images
            gplxFrontUrl: b.gplxFrontUrl || b.driverLicenseFrontUrl || b.gplxImageUrl_Front || b.customer?.gplxImageUrl_Front || b.user?.gplxImageUrl_Front,
            gplxBackUrl: b.gplxBackUrl || b.driverLicenseBackUrl || b.gplxImageUrl_Back || b.customer?.gplxImageUrl_Back || b.user?.gplxImageUrl_Back,
            idString: b.customerIdNumber || b.user?.identityNumber || '',
            phone: b.customerPhone || b.user?.phoneNumber || ''
          }
        })
        setBookings(mapped)

        // Enrich user details from User table using userId (prefer firstName + lastName)
        const needUser = mapped.filter(x => x.userId && !(x.firstName && x.lastName))
        if (needUser.length > 0) {
          try {
            const uniqueIds = Array.from(new Set(needUser.map(x => x.userId)))
            const results = await Promise.all(uniqueIds.map(async uid => {
              try {
                const u = await StaffAPI.getUserById(uid)
                const first = u?.firstName || u?.FirstName || u?.givenName || u?.GivenName || null
                const last  = u?.lastName  || u?.LastName  || u?.surname  || u?.Surname  || null
                const full  = (u?.fullName || u?.FullName) || [first, last].filter(Boolean).join(' ') || null
                const uname = u?.userName || u?.UserName || u?.username || u?.user_name || null
                const addr = u?.address || u?.Address || ''
                return { uid, firstName: first, lastName: last, fullName: full, userName: uname, address: addr }
              } catch {
                return { uid, firstName: null, lastName: null, fullName: null, userName: null, address: '' }
              }
            }))
            if (!mounted) return
            const mapU = new Map(results.map(r => [r.uid, r]))
            setBookings(prev => prev.map(b => {
              if (b.userId && mapU.has(b.userId)) {
                const r = mapU.get(b.userId)
                const composed = b.fullName || r.fullName || [r.firstName, r.lastName].filter(Boolean).join(' ')
                return {
                  ...b,
                  firstName: b.firstName ?? r.firstName ?? null,
                  lastName: b.lastName ?? r.lastName ?? null,
                  fullName: composed || b.customer || b.userName || null,
                  userName: b.userName ?? r.userName,
                  address: b.address || r.address
                }
              }
              return b
            }))
          } catch {}
        }

  // Enrich vehicle details (resolve vehicle name/image by carId/vehicleId)
        const getCarId = (b) => b.carId || b.CarId || b.vehicleId || b.VehicleId || b.car?.id || b.car?.Id || b.vehicle?.id || b.vehicle?.Id
        const needCar = mapped.filter(x => (!x.title || x.title === 'Booking') && getCarId(x))
        if (needCar.length > 0) {
          try {
            const uniqueCarIds = Array.from(new Set(needCar.map(getCarId).filter(Boolean)))
            const cars = await Promise.all(uniqueCarIds.map(async cid => {
              try {
                let car = await StaffAPI.getCarById(cid)
                if (!car || (!car.id && !car.Id)) {
                  try { car = await StaffAPI.getCarByIdRest(cid) } catch {}
                }
                const name = car?.name || car?.Name || [car?.brand, car?.model].filter(Boolean).join(' ') || null
                const img = car?.imageUrl || car?.thumbnailUrl || null
                return { cid, name, img }
              } catch {
                return { cid, name: null, img: null }
              }
            }))
            const mapC = new Map(cars.map(c => [String(c.cid), c]))
            setBookings(prev => prev.map(b => {
              const cid = getCarId(b)
              const key = cid != null ? String(cid) : null
              if (key && mapC.has(key)) {
                const c = mapC.get(key)
                return {
                  ...b,
                  title: b.title && b.title !== 'Booking' ? b.title : (c.name || b.title),
                  img: b.img || c.img || b.img
                }
              }
              return b
            }))
          } catch {}
        }

        // Final fallback: for any booking still lacking a proper title, resolve via staffApi.getVehicleModelFromBooking
        const stillMissing = (prevList) => prevList.filter(x => !x.title || x.title === 'Booking')
        const missingNow = stillMissing(mapped)
        if (missingNow.length > 0) {
          try {
            const results = await Promise.all(missingNow.map(async b => {
              try {
                const m = await StaffAPI.getVehicleModelFromBooking(b.id)
                const label = m?.name || [m?.brand, m?.model].filter(Boolean).join(' ') || null
                return { id: b.id, title: label }
              } catch { return { id: b.id, title: null } }
            }))
            const mapM = new Map(results.map(r => [r.id, r.title]))
            setBookings(prev => prev.map(b => mapM.has(b.id) && mapM.get(b.id) ? { ...b, title: mapM.get(b.id) } : b))
          } catch {}
        }
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load bookings')
      } finally {
        if (mounted) setLoadingBookings(false)
      }
    }
    loadBookings()
    return () => { mounted = false }
  }, []) // Load all bookings once on mount, no station filtering

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
        {warning && (
          <div style={{background:'#fff7e6', color:'#8a6d3b', padding:'8px 12px', borderRadius:6, marginBottom:12, border:'1px solid #ffe1b3'}}>
            {warning}
          </div>
        )}
        {error && (
          <div style={{background:'#ffecec', color:'#b00020', padding:'8px 12px', borderRadius:6, marginBottom:12}}>
            {error}
          </div>
        )}
        {section === 'booking' && (
          <>
            {/* Informational banner - showing all bookings from all stations */}
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12, background:'#f0f7ff', padding:'10px 16px', borderRadius:8, border:'1px solid #b3d9ff'}}>
              <label style={{fontWeight:600, color:'#1976d2'}}>� Viewing:</label>
              <span style={{fontWeight:600, fontSize:'1.1em'}}>All Bookings (All Stations)</span>
              {loadingBookings && <span style={{color:'#666', fontSize:'0.9em', marginLeft:8}}>Loading...</span>}
            </div>
            {!loadingBookings && bookings.length === 0 && (
              <div style={{padding:'10px 12px', color:'#555'}}>No bookings found.</div>
            )}
            <BookingSection
              bookings={bookings}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onContinuePayment={continueToPayment}
              onCancelBooking={cancelBooking}
              onStatusUpdated={handleStatusUpdated}
            />
          </>
        )}
        {section === 'vehicle' && (
          <>
            {/* Informational banner - showing all vehicles from all stations */}
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12, background:'#f0f7ff', padding:'10px 16px', borderRadius:8, border:'1px solid #b3d9ff'}}>
              <label style={{fontWeight:600, color:'#1976d2'}}>� Viewing:</label>
              <span style={{fontWeight:600, fontSize:'1.1em'}}>All Vehicles (All Stations)</span>
              {loadingVehicles && <span style={{color:'#666', fontSize:'0.9em', marginLeft:8}}>Loading...</span>}
            </div>
            {/* Hidden dropdown (for backwards compatibility if needed) */}
            <div style={{display:'none'}}>
              <select value={stationId} onChange={e=>setStationId(e.target.value)} disabled={true}>
                {stations.map(s => {
                  const id = s.id || s.Id
                  const name = s.name || s.Name || s.stationName || `Station ${id}`
                  return <option key={id} value={id}>{name}</option>
                })}
              </select>
            </div>
            {loadingVehicles && <span>Loading vehicles…</span>}
            <VehicleSection
              vehicles={vehicles}
              onAdd={addVehicle}
              onRemove={removeVehicle}
              onUpdate={updateVehicle}
              stationId={stationId}
              canDelete={String(role).toLowerCase() === 'admin'}
              stationSlots={stationSlots}
            />
          </>
        )}
        {section === 'profile' && <ProfileSection />}
      </main>
    </div>
  );
}
>>>>>>> Stashed changes
