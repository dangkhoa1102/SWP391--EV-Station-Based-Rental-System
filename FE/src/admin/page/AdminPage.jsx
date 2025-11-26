import React, { useState, useEffect } from 'react';
import './AdminPage.css';
import './styles/sidebar.override.css';

import Header from './components/Header';
import Sidebar from '../../components/Sidebar.jsx';
import BookingSection from './components/Booking/BookingSection';
import VehicleSection from './components/Vehicle/VehicleSection';
import UserSection from './components/User/UserSection';
import StaffSection from './components/Staff/StaffSection';
import ProfileSection from './components/Profile/ProfileSection';
import AdminIncidentSection from './components/Incident/AdminIncidentSection';
import AnalyticsSection from './components/Analytics/AnalyticsSection';
import AddStationModal from './components/Station/AddStationModal';
import StationDetailsModal from './components/Station/StationDetailsModal';
import FeedbackSection from './components/Feedback/FeedbackSection';
import adminApi from '../../services/adminApi';
import authApi from '../../services/authApi';
import { decodeJwt } from '../../services/api';

// Start with empty lists; we will load from API
const initialBookings = [];
const initialVehicles = [];

export default function AdminPage() {
  const [section, setSection] = useState('booking');
  const [bookings, setBookings] = useState(initialBookings);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [deletedVehicles, setDeletedVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loadingDeletedVehicles, setLoadingDeletedVehicles] = useState(false);
  const [staffByStation, setStaffByStation] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_visible')
      return saved == null ? true : saved === '1'
    } catch (e) { return true }
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState('');
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDeletedUsers, setLoadingDeletedUsers] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [role, setRole] = useState('');
  const [stationSlots, setStationSlots] = useState(null);
  const [addStationOpen, setAddStationOpen] = useState(false)
  const [stationDetailsOpen, setStationDetailsOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)
  const [feedbackSearch, setFeedbackSearch] = useState('')
  const [feedbackPage, setFeedbackPage] = useState(1)
  const [feedbackPageSize, setFeedbackPageSize] = useState(10)

  // Booking actions (call API then update locally)
  const confirmBooking = async (id) => {
    try {
      // Try minimal payload first
      await adminApi.post('/Bookings/Confirm', { bookingId: id })
    } catch {
      // Fallback to user API's method signature with default payment method
      try { await adminApi.post('/Bookings/Confirm', { bookingId: id, paymentMethod: 'Cash', paymentTransactionId: '' }) } catch {}
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'booked' } : b))
  };
  const completeBooking = async (id) => {
    try {
      await adminApi.post(`/Bookings/Complete-By-${encodeURIComponent(id)}`)
    } catch {
      try { await adminApi.post('/Bookings/Complete', { bookingId: id }) } catch {}
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b))
  };
  const denyBooking = async (id) => {
    try {
      await adminApi.post('/Bookings/Deny', { bookingId: id })
    } catch {
      try { await adminApi.post('/Bookings/Reject', { bookingId: id }) } catch {}
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'denied' } : b))
  };

  // New: continue to payment handler
  const continueToPayment = async (booking) => {
    try {
      // Default to Cash unless a payment UI is integrated later
      await adminApi.confirmBooking(booking.id, 'Cash', '')
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'booked' } : b))
    } catch (e) {
      setError(e?.message || 'Failed to proceed to payment')
    }
  }

  // Cancel booking (soft cancel)
  const cancelBooking = async (booking, reason = '') => {
    try {
      await adminApi.cancelBooking(booking.id, reason || '')
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
      const created = await adminApi.createCar(payload)
      // Map created car to view model
      const c = created || {}
      const map = (c) => ({
        id: c.id || c.Id || c.carId || c.CarId,
        name: c.name || c.Name || [c.brand, c.model].filter(Boolean).join(' ') || 'Car',
        model: c.model || c.Model || null,
        brand: c.brand || c.Brand || null,
        licensePlate: c.licensePlate || c.LicensePlate || null,
        img: c.imageUrl || c.image || c.thumbnailUrl || null,
        battery: Number.isFinite(c.currentBatteryLevel) ? Math.round(c.currentBatteryLevel) : undefined,
        tech: c.condition ?? c.status ?? c.Status ?? null,
        issue: c.issue ?? c.issueDescription ?? null,
        capacity: c.batteryCapacity ?? c.BatteryCapacity ?? c.capacity ?? c.capacityKWh ?? c.batteryCapacityKWh ?? null
      })
      setVehicles(prev => [...prev, map(c)])
      // Update slot info after adding
      if (stationId) {
        await updateStationSlots(stationId)
      }
      return created
    } catch (e) {
      console.error('Add vehicle failed:', e)
      // Prefer server-provided message when available (response body), fallback to generic message
      const resp = e?.response?.data
      let msg = e?.message || 'Failed to create vehicle'
      if (resp) {
        if (typeof resp === 'string') msg = resp
        else if (resp.message) msg = resp.message
        else if (resp.errors) {
          try {
            const firstKey = Object.keys(resp.errors)[0]
            const firstVal = resp.errors[firstKey]
            msg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal)
          } catch (ex) {
            msg = JSON.stringify(resp.errors)
          }
        } else {
          msg = JSON.stringify(resp)
        }
      }
      setError(msg || 'Failed to create vehicle')
      throw e
    }
  }
  
  const removeVehicle = async (id) => {
    try {
      // Use new soft delete endpoint
      await adminApi.softDeleteCar(id)
      setVehicles(prev => prev.filter(v => v.id !== id))
      // Reload deleted vehicles to show the newly deleted one
      await loadDeletedVehicles()
      // Update slot info after removing
      await updateStationSlots(stationId)
    } catch (e) {
      const code = e?.response?.status
      // If not authorized, show a friendly warning and stop
      if (code === 401 || code === 403) {
        setWarning("You don't have permission to delete vehicles. Please contact an administrator.")
        return
      }
      setError(e?.message || 'Failed to delete vehicle')
    }
  }

  const loadDeletedVehicles = async () => {
    setLoadingDeletedVehicles(true);
    try {
      const deleted = await adminApi.getDeletedCars();
      setDeletedVehicles(deleted || []);
    } catch (e) {
      setError(e?.message || 'Failed to load deleted vehicles');
    } finally {
      setLoadingDeletedVehicles(false);
    }
  };

  const handleRestoreVehicle = async (vehicle) => {
    try {
      const id = vehicle.id || vehicle.Id || vehicle.carId || vehicle.CarId;
      // Call backend restore endpoint
      await adminApi.restoreCar(id);
      // Remove from deleted list
      setDeletedVehicles(prev => prev.filter(v => String(v.id || v.Id) !== String(id)));
      // Add back to active vehicles
      setVehicles(prev => [vehicle, ...(prev || [])]);
      // Update slot info
      await updateStationSlots(stationId);
      alert('Vehicle restored successfully');
    } catch (e) {
      const resp = e?.response?.data;
      let msg = e?.message || 'Failed to restore vehicle';
      if (resp) {
        if (typeof resp === 'string') msg = resp;
        else if (resp.message) msg = resp.message;
        else if (resp.data && resp.data.message) msg = resp.data.message;
        else if (resp.errors) {
          try {
            const firstKey = Object.keys(resp.errors)[0];
            const firstVal = resp.errors[firstKey];
            msg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
          } catch (ex) {
            msg = JSON.stringify(resp.errors);
          }
        } else {
          try { msg = JSON.stringify(resp); } catch { /* ignore */ }
        }
      }
      alert(msg || 'Failed to restore vehicle');
    }
  };
  const updateVehicle = async (id, payload) => {
    try {
      if (payload.battery !== undefined && payload.battery !== '') {
        let val = Number(payload.battery)
        if (!Number.isNaN(val)) {
          val = Math.max(0, Math.min(100, Math.round(val)))
          await adminApi.updateBatteryLevel(id, val)
        }
      }
      if (payload.tech) {
        await adminApi.updateStatus(id, payload.tech)
      }
      if (payload.issue) {
        try { await adminApi.updateCarDescription(id, payload.issue) }
        catch { await adminApi.updateCar(id, { description: payload.issue }) }
      }
      if (payload.isAvailable !== undefined) {
        // Update availability status (1 = available, 0 = unavailable)
        const carApi = (await import('../../services/carApi')).default
        await carApi.updateCarAvailability(id, payload.isAvailable ? 1 : 0)
      }
    } catch (e) {
      setError(e?.message || 'Failed to update vehicle')
    }
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...payload } : v));
  };

  // User management actions
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const allUsers = await adminApi.getAllUsers(1, 1000);
      // Filter out inactive/deleted users (only show active users)
      const activeUsers = (allUsers || []).filter(u => {
        const isActive = u.isActive !== false && u.IsActive !== false;
        return isActive;
      });
      setUsers(activeUsers);
    } catch (e) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadDeletedUsers = async () => {
    setLoadingDeletedUsers(true);
    try {
      const deleted = await adminApi.getDeletedAccounts(1, 1000);
      setDeletedUsers(deleted || []);
    } catch (e) {
      setError(e?.message || 'Failed to load deleted users');
    } finally {
      setLoadingDeletedUsers(false);
    }
  };

  const loadStaffByStation = async (stationId) => {
    if (!stationId) {
      setStaffByStation([]);
      return;
    }
    setLoadingStaff(true);
    try {
      const staff = await adminApi.getStaffByStation(stationId);
      setStaffByStation(staff || []);
    } catch (e) {
      setError(e?.message || 'Failed to load staff by station');
      setStaffByStation([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAssignStaff = async (user, reason) => {
    try {
      await adminApi.assignStaffRole(user.id || user.Id || user.userId, reason);
      await loadUsers(); // Reload to update role
      if (stationId) {
        await loadStaffByStation(stationId); // Reload station staff
      }
      alert('User promoted to Station Staff successfully');
    } catch (e) {
      alert(e?.message || 'Failed to assign staff role');
    }
  };

  const handleRemoveStaff = async (staff, reason) => {
    try {
      await adminApi.removeStaffRole(staff.id || staff.Id || staff.userId, reason);
      await loadUsers(); // Reload to update role
      if (stationId) {
        await loadStaffByStation(stationId); // Reload station staff
      }
      alert('Staff role removed successfully');
    } catch (e) {
      alert(e?.message || 'Failed to remove staff role');
    }
  };

  const handleAssignStaffToStation = async (staff, newStationId) => {
    try {
      const staffId = staff.id || staff.Id || staff.userId;
      const currentStationId = staff.stationId || staff.StationId;
      
      // Use reassign if already has a station, otherwise use assign
      if (currentStationId) {
        await adminApi.reassignStaff(staffId, newStationId);
      } else {
        await adminApi.assignStaffToStation(newStationId, staffId);
      }
      
      await loadUsers(); // Reload to update station
      if (stationId) {
        await loadStaffByStation(stationId); // Reload station staff
      }
      alert('Staff assigned to station successfully');
    } catch (e) {
      alert(e?.message || 'Failed to assign staff to station');
    }
  };

  const handleUnassignStaff = async (staff) => {
    try {
      const staffId = staff.id || staff.Id || staff.userId;
      await adminApi.unassignStaffFromStation(staffId);
      await loadUsers(); // Reload to update station
      if (stationId) {
        await loadStaffByStation(stationId); // Reload station staff
      }
      alert('Staff unassigned from station successfully');
    } catch (e) {
      alert(e?.message || 'Failed to unassign staff from station');
    }
  };

  const handleDeleteUser = async (user, reason) => {
    try {
      const userId = user.id || user.Id || user.userId;
      await adminApi.softDeleteUser(userId, reason);
      
      // Remove from active users list immediately
      setUsers(prev => prev.filter(u => 
        (u.id || u.Id || u.userId) !== userId
      ));
      
      // Reload to ensure sync with backend
      await loadUsers();
      alert('User deleted successfully');
    } catch (e) {
      alert(e?.message || 'Failed to delete user');
    }
  };

  const handleRestoreUser = async (user) => {
    try {
      const userId = user.userId || user.id || user.Id;
      await adminApi.restoreUser(userId);
      
      // Remove from deleted users list
      setDeletedUsers(prev => prev.filter(u => 
        (u.userId || u.id || u.Id) !== userId
      ));
      
      // Reload both lists to ensure sync
      await loadDeletedUsers();
      await loadUsers();
      alert('User restored successfully');
    } catch (e) {
      alert(e?.message || 'Failed to restore user');
    }
  };

  // Vehicle transfer functionality
  const handleTransferCar = async (vehicle, targetStationId, reason) => {
    try {
      await adminApi.transferCar(vehicle.id, targetStationId, reason || '');
      const targetStation = stations.find(s => (s.id || s.Id) === targetStationId);
      alert(`Vehicle transferred successfully to ${targetStation?.name || targetStation?.Name || 'target station'}`);
      // Reload vehicles for current station
      await loadVehiclesForStation(stationId);
      // Update slot info
      await updateStationSlots(stationId);
    } catch (e) {
      alert(e?.message || 'Failed to transfer vehicle');
      throw e;
    }
  };

  // Update station slot information
  const updateStationSlots = async (sid) => {
    if (!sid) {
      setStationSlots(null);
      return;
    }
    try {
      const report = await adminApi.getCarStatusReport(sid, null);
      if (report) {
        // Find station object to read configured total slots
        const st = (stations || []).find(x => String(x.id || x.Id) === String(sid));
        const totalSlots = st ? (st.totalSlots ?? st.TotalSlots ?? 0) : 0;
        // report.totalCars contains current car count at station
        setStationSlots({
          totalSlots: totalSlots,
          carsCount: report.totalCars || 0,
          // keep raw cars array for any consumers
          cars: report.cars || []
        });
      }
    } catch (e) {
      console.warn('Failed to load station slots:', e);
    }
  };

  // Extract vehicle loading logic into separate function
  const loadVehiclesForStation = async (sid) => {
    try {
      setLoadingVehicles(true);
      let cars = [];
      if (sid) {
        // Show ALL vehicles for the station, regardless of availability
        let byStation = [];
        let available = [];
        try { byStation = await adminApi.getCarsByStation(sid); } catch {}
        try { available = await adminApi.getAvailableCarsByStation(sid); } catch {}
        const toArray = (x) => Array.isArray(x) ? x : (x ? [x] : []);
        const A = toArray(byStation), B = toArray(available);
        // Merge unique by id (fallback to licensePlate)
        const map = new Map();
        for (const c of [...A, ...B]) {
          const key = String(c?.id || c?.Id || c?.carId || c?.CarId || c?.licensePlate || c?.LicensePlate || Math.random());
          if (!map.has(key)) map.set(key, c);
        }
        cars = Array.from(map.values());

        // Always supplement with client-side filtered All Cars to catch backends that only return "available" by station
        try {
          const all = await adminApi.getAllCars(1, 1000);
          const norm = (v) => (v == null ? '' : String(v).replace(/[{}]/g, '').toLowerCase());
          const sidNorm = norm(sid);
          const clientFiltered = (all || []).filter(c => {
            const candidates = [
              c.currentStationId, c.CurrentStationId, c.currentStationID,
              c.stationId, c.StationId, c.stationID,
              c.station?.id, c.station?.Id, c.station?.stationId, c.station?.StationId
            ];
            return candidates.some(st => st != null && norm(st) === sidNorm);
          });
          // Merge clientFiltered into cars (dedupe by id/licensePlate)
          for (const c of clientFiltered) {
            const key = String(c?.id || c?.Id || c?.carId || c?.CarId || c?.licensePlate || c?.LicensePlate);
            if (key && !map.has(key)) {
              map.set(key, c);
            }
          }
          cars = Array.from(map.values());
        } catch {}
      } else {
        // When no station is selected (All stations), fetch all cars with larger page size
        try { cars = await adminApi.getAllCars(1, 1000); }
        catch { try { cars = await adminApi.listCars({ page: 1, pageSize: 1000 }); } catch { cars = []; } }
      }
      // Ensure we always have an array
      if (!Array.isArray(cars)) cars = cars ? [cars] : [];
      
      const normalizePercent = (v) => {
        const n = Number(v); if (Number.isFinite(n) && n >= 0 && n <= 100) return Math.round(n); return null;
      };
      const mapped = (cars || []).map(c => {
        const pick = (...vals) => vals.find(v => v != null && v !== '');
        const stIdRaw = pick(c.currentStationId, c.CurrentStationId, c.currentStationID, c.stationId, c.StationId, c.stationID, c.station?.id, c.station?.Id, c.station?.stationId, c.station?.StationId);
        const norm = (v) => (v == null ? '' : String(v).replace(/[{}]/g, '').toLowerCase());
        const stId = stIdRaw || '';
        const stName = (() => {
          if (!stId) return null;
          const match = stations.find(s => norm(s.id || s.Id) === norm(stId)) || null;
          if (!match) return null;
          return match.name || match.Name || null;
        })();
        return {
          id: c.id || c.Id || c.carId || c.CarId,
          name: c.name || c.Name || c.model || c.CarName || 'Car',
          model: c.model || c.Model || null,
          brand: c.brand || c.Brand || null,
          licensePlate: c.licensePlate || c.LicensePlate || null,
          img: c.imageUrl || c.image || c.thumbnailUrl || null,
          battery: normalizePercent(c.currentBatteryLevel ?? c.CurrentBatteryLevel ?? c.batteryPercent ?? c.battery),
          tech: c.condition ?? c.status ?? c.Status ?? null,
          issue: c.issue ?? c.issueDescription ?? null,
          capacity: c.batteryCapacity ?? c.BatteryCapacity ?? c.capacity ?? c.capacityKWh ?? c.batteryCapacityKWh ?? null,
          stationId: stId,
          stationName: stName || null
        };
      });
      setVehicles(mapped);

      // Opportunistically fetch battery percent for vehicles missing it
      const needBattery = mapped.filter(v => v.battery == null);
      const needCapacity = mapped.filter(v => v.capacity == null);
      if (needBattery.length > 0) {
        try {
          const updates = await Promise.all(needBattery.map(async v => {
            try {
              const b = await adminApi.getCarBattery(v.id);
              return { id: v.id, battery: normalizePercent(b) };
            } catch { return { id: v.id, battery: null }; }
          }));
          setVehicles(prev => prev.map(v => {
            const u = updates.find(x => x.id === v.id);
            return u && u.battery != null ? { ...v, battery: u.battery } : v;
          }));
        } catch {}
      }
      if (needCapacity.length > 0) {
        try {
          const updatesCap = await Promise.all(needCapacity.map(async v => {
            try {
              const cap = await adminApi.getCarCapacity(v.id);
              return { id: v.id, capacity: cap };
            } catch { return { id: v.id, capacity: null }; }
          }));
          setVehicles(prev => prev.map(v => {
            const u = updatesCap.find(x => x.id === v.id);
            return u && u.capacity != null ? { ...v, capacity: u.capacity } : v;
          }));
        } catch {}
      }
    } catch (e) {
      setError(e?.message || 'Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
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

  // persist admin sidebar state
  useEffect(() => {
    try { localStorage.setItem('admin_sidebar_visible', sidebarVisible ? '1' : '0') } catch (e) {}
  }, [sidebarVisible]);

  // Menu for admin sidebar (pages control which items appear and behavior)
  const adminMenu = [
    { key: 'booking', label: 'Booking', icon: 'fas fa-calendar-alt', onClick: () => setSection('booking') },
    { key: 'vehicle', label: 'Vehicle', icon: 'fas fa-car', onClick: () => setSection('vehicle') },
    { key: 'user', label: 'User', icon: 'fas fa-users', onClick: () => setSection('user') },
    { key: 'staff', label: 'Staff', icon: 'fas fa-user-tie', onClick: () => setSection('staff') },
    { key: 'station', label: 'Stations', icon: 'fas fa-map-marker-alt', onClick: () => setSection('station') },
    { key: 'feedback', label: 'Feedback', icon: 'fas fa-comment-dots', onClick: () => setSection('feedback') },
    { key: 'incident', label: 'Incident', icon: 'fas fa-exclamation-triangle', onClick: () => setSection('incident') },
    { key: 'analytics', label: 'Analytics', icon: 'fas fa-chart-line', onClick: () => setSection('analytics') },
    { key: 'profile', label: 'Profile', icon: 'fas fa-user-circle', onClick: () => setSection('profile') },
  ]

  // Load stations on mount, then load vehicles for first station
  useEffect(() => {
    let mounted = true
    async function loadRole() {
      try {
        const me = await authApi.getMe()
        const r = me?.role || me?.Role || me?.roleName || me?.userRole || (Array.isArray(me?.roles) ? me.roles[0] : '')
        if (mounted) setRole(r || '')
      } catch {
        // Try from token if /Auth/Me is not available
        try {
          const t = localStorage.getItem('token')
          if (t) {
            const decoded = decodeJwt(t)
            const r = decoded?.role || decoded?.Role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            if (mounted) setRole(r || '')
          }
        } catch {}
      }
    }
    async function loadStations() {
      try {
        setLoadingStations(true)
        const s = await adminApi.getAllStations(1, 100)
        if (!mounted) return
        setStations(s || [])
        // Do not default to the first station; keep empty (All stations) by default
        setStationId(prev => prev || '')
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load stations')
      } finally {
        if (mounted) setLoadingStations(false)
      }
    }
    loadRole();
    loadStations();
    loadUsers();
    loadDeletedVehicles();
    return () => { mounted = false }
  }, [])

  // Load vehicles when station changes (and when stations list updates for name mapping)
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!mounted) return;
      await loadVehiclesForStation(stationId);
      await updateStationSlots(stationId);
    }
    load();
    return () => { mounted = false; };
  }, [stationId, stations]);

  // Load bookings for station when station changes
  useEffect(() => {
    let mounted = true
    async function loadBookings() {
      try {
        setLoadingBookings(true)
        let items = []
        if (stationId) {
          try {
            items = await adminApi.getBookingsByStation(stationId)
          } catch {
            items = []
          }
          // Fallback: if nothing returned, fetch all and client-filter by station
          if (!items || items.length === 0) {
            try {
              const all = await adminApi.listBookings({ page: 1, pageSize: 200 })
              const sid = String(stationId)
              items = (all || []).filter(b => {
                const st = b.stationId || b.StationId || b.station?.id || b.station?.Id || b.pickupStationId || b.PickupStationId
                return st != null && String(st) === sid
              })
            } catch {}
          }
          // Always enforce station scoping even if backend returned all bookings
          if (items && items.length > 0) {
            const sid = String(stationId)
            items = items.filter(b => {
              const candidates = [
                b.stationId, b.StationId, b.station?.id, b.station?.Id,
                b.pickupStationId, b.PickupStationId, b.pickUpStationId, b.PickUpStationId,
                b.startStationId, b.StartStationId, b.originStationId, b.OriginStationId,
                b.fromStationId, b.FromStationId,
                b.car?.stationId, b.car?.StationId, b.car?.currentStationId,
                b.vehicle?.stationId, b.vehicle?.StationId
              ]
              return candidates.some(v => v != null && String(v) === sid)
            })
          }
        } else {
          items = await adminApi.listBookings({ page: 1, pageSize: 100 })
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
          // Status codes: 0=Pending, 1=Active, 2=Waiting for check-in, 3=Checked-in, 4=Check-out pending, 5=Completed, 6=Cancelled pending refund, 7=Cancelled
          const rawStatus = b.statusCode ?? b.StatusCode ?? b.bookingStatus ?? b.BookingStatus ?? b.status ?? b.Status
          let status = 'booked'
          let statusLabel = 'Booked'
          if (rawStatus != null && (typeof rawStatus === 'number' || /^\d+$/.test(String(rawStatus)))) {
            const code = Number(rawStatus)
            if (code === 0) { status = 'pending'; statusLabel = 'Pending' }
            else if (code === 1) { status = 'booked'; statusLabel = 'Active' }
            else if (code === 2) { status = 'waiting-checkin'; statusLabel = 'Waiting for check-in' }
            else if (code === 3) { status = 'checked-in'; statusLabel = 'Checked-in' }
            else if (code === 4) { status = 'checkout-pending'; statusLabel = 'Check-out pending' }
            else if (code === 5) { status = 'completed'; statusLabel = 'Completed' }
            else if (code === 6) { status = 'cancelled-refund'; statusLabel = 'Cancelled pending refund' }
            else if (code === 7) { status = 'cancelled'; statusLabel = 'Cancelled' }
          } else {
            const s = String(rawStatus || '').toLowerCase()
            if (s.includes('pending') || s.includes('wait')) { status = 'pending'; statusLabel = 'Pending' }
            else if (s.includes('active')) { status = 'booked'; statusLabel = 'Active' }
            else if (s.includes('check') && s.includes('in')) { status = 'checked-in'; statusLabel = 'Checked-in' }
            else if (s.includes('complete') || s.includes('finish')) { status = 'completed'; statusLabel = 'Completed' }
            else if (s.includes('cancel')) { status = 'cancelled'; statusLabel = 'Cancelled' }
            else { status = 'booked'; statusLabel = 'Booked' }
          }
          // Derive a UI stage hint without changing the canonical status
          const s = String(rawStatus || '').toLowerCase()
          const uiStage = (Number(rawStatus) === 0 || s.includes('pending') || s.includes('wait'))
            ? 'waiting-payment'
            : ((s.includes('check') && s.includes('in') && (s.includes('pay') || s.includes('payment'))) ? 'checkin-payment' : null)
          const date = b.date || b.createdAt || b.bookingDate || ''
          const img = b.carImageUrl || b.car?.imageUrl || b.vehicle?.imageUrl || null
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
            // Add carId for image fetching in BookingCard
            carId: b.carId || b.CarId || b.car?.id || b.car?.Id || b.vehicle?.id || b.vehicle?.Id || null,
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
                // Use authApi.getUserById to match other parts of the app (staff/profile)
                const u = await authApi.getUserById(uid)
                const first = u?.firstName || u?.FirstName || u?.givenName || u?.GivenName || null
                const last  = u?.lastName  || u?.LastName  || u?.surname  || u?.Surname  || null
                const full  = (u?.fullName || u?.FullName) || [first, last].filter(Boolean).join(' ') || null
                const uname = u?.userName || u?.UserName || u?.username || u?.user_name || null
                const addr = u?.address || u?.Address || ''
                // Try multiple possible identity number / phone fields from various backends
                const idNum = u?.identityNumber || u?.identityNo || u?.idNumber || u?.IdNumber || u?.cmnd || u?.CMND || u?.citizenId || u?.CitizenId || ''
                const phone = u?.phoneNumber || u?.phone || u?.Phone || u?.mobile || u?.Mobile || u?.PhoneNumber || ''
                return { uid, firstName: first, lastName: last, fullName: full, userName: uname, address: addr, idNumber: idNum, phone }
              } catch {
                return { uid, firstName: null, lastName: null, fullName: null, userName: null, address: '', idNumber: '', phone: '' }
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
                  // prefer existing booking.address; otherwise use resolved user address
                  address: b.address || r.address,
                  // map identity number and phone from resolved user when missing on booking
                  idString: b.idString || r.idNumber || b.idString || '',
                  phone: b.phone || r.phone || b.phone || ''
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
                let car = await adminApi.getCarById(cid)
                if (!car || (!car.id && !car.Id)) {
                  try { car = await adminApi.getCarByIdRest(cid) } catch {}
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

        // Final fallback: for any booking still lacking a proper title, resolve via adminApi.getVehicleModelFromBooking
        const stillMissing = (prevList) => prevList.filter(x => !x.title || x.title === 'Booking')
        const missingNow = stillMissing(mapped)
        if (missingNow.length > 0) {
          try {
            const results = await Promise.all(missingNow.map(async b => {
              try {
                const m = await adminApi.getVehicleModelFromBooking(b.id)
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
  }, [stationId])

  // Load staff by station when viewing staff section
  useEffect(() => {
    if (section === 'staff' && stationId) {
      loadStaffByStation(stationId);
    }
    if (section === 'feedback') {
      loadFeedbacks();
    }
  }, [section, stationId]);

  const loadFeedbacks = async (page = feedbackPage, pageSize = feedbackPageSize, search = feedbackSearch) => {
    setLoadingFeedbacks(true)
    try {
      const res = await adminApi.getFeedbacks({ page, pageSize, search })
      // res expected: pagination dto { items: [], totalCount }
      const items = res?.items || res?.data || []
      setFeedbacks(items)
      setFeedbackPage(page)
      setFeedbackPageSize(pageSize)
    } catch (e) {
      setError(e?.message || 'Failed to load feedbacks')
      setFeedbacks([])
    } finally {
      setLoadingFeedbacks(false)
    }
  }

  return (
    <div className="app-layout">
      <Header toggleSidebar={() => setSidebarVisible(v => !v)} sidebarVisible={sidebarVisible} />

      {/* Sidebar that slides and affects content (toggle via header button) */}
      <div className={`sidebar-wrapper ${sidebarVisible ? 'visible' : ''}`}>
        <Sidebar
          title="FEC Admin"
          menuItems={adminMenu}
          isOpen={sidebarVisible}
          toggleSidebar={() => setSidebarVisible(v => !v)}
          onSelect={setSection}
          activeKey={section}
        />
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
              onContinuePayment={continueToPayment}
              onCancelBooking={cancelBooking}
              onStatusUpdated={handleStatusUpdated}
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
              deletedVehicles={deletedVehicles}
              onAdd={addVehicle}
              onRemove={removeVehicle}
              onUpdate={updateVehicle}
              onRestore={handleRestoreVehicle}
              stationId={stationId}
              canDelete={true}
              stationSlots={stationSlots}
              onTransferCar={handleTransferCar}
              stations={stations}
            />
          </>
        )}
        {section === 'station' && (
          <>
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:24}}>
              <h2 style={{fontWeight:700, fontSize:24, margin:0}}>Stations Management</h2>
              <div style={{flex:1}} />
              <button 
                onClick={() => setAddStationOpen(true)} 
                style={{
                  padding:'10px 16px',
                  backgroundColor:'#2ecc71',
                  color:'white',
                  border:'none',
                  borderRadius:6,
                  fontWeight:600,
                  cursor:'pointer',
                  fontSize:14,
                  transition:'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor='#27ae60'}
                onMouseOut={(e) => e.target.style.backgroundColor='#2ecc71'}
              >
                + Add Station
              </button>
            </div>

            <div style={{width:'100%'}}>
              {!stations || stations.length === 0 ? (
                <div style={{
                  padding:'40px 20px',
                  textAlign:'center',
                  backgroundColor:'#f8f9fa',
                  borderRadius:8,
                  color:'#666'
                }}>
                  <p style={{fontSize:16, margin:0}}>No stations found. Create one to get started.</p>
                </div>
              ) : (
                <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16}}>
                  {stations.map(st => (
                    <div 
                      key={st.id || st.Id} 
                      style={{
                        padding:16,
                        border:'1px solid #ddd',
                        borderRadius:8,
                        backgroundColor:'#fff',
                        boxShadow:'0 2px 4px rgba(0,0,0,0.05)',
                        transition:'box-shadow 0.2s, transform 0.2s',
                        cursor:'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:12}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700, fontSize:16, marginBottom:4}}>
                            📍 {st.name || st.Name || `Station ${(st.id||st.Id)}`}
                          </div>
                          <div style={{fontSize:13, color:'#666', marginBottom:8}}>
                            {st.address || st.Address || 'No address provided'}
                          </div>
                        </div>
                      </div>
                      
                      {st.phoneNumber && (
                        <div style={{fontSize:12, color:'#555', marginBottom:4}}>
                          📞 {st.phoneNumber}
                        </div>
                      )}
                      
                      {st.capacity && (
                        <div style={{fontSize:12, color:'#555', marginBottom:8}}>
                          🚗 Capacity: {st.capacity} vehicles
                        </div>
                      )}
                      
                      <div style={{display:'flex', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid #eee'}}>
                        <button 
                          onClick={() => { setSelectedStation(st); setStationDetailsOpen(true) }}
                          style={{
                            flex:1,
                            padding:'8px 12px',
                            backgroundColor:'#3498db',
                            color:'white',
                            border:'none',
                            borderRadius:4,
                            cursor:'pointer',
                            fontSize:13,
                            fontWeight:600,
                            transition:'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor='#2980b9'}
                          onMouseOut={(e) => e.target.style.backgroundColor='#3498db'}
                        >
                          Details
                        </button>
                        <button 
                          onClick={() => { setStationId(st.id || st.Id); setSection('booking') }}
                          style={{
                            flex:1,
                            padding:'8px 12px',
                            backgroundColor:'#9b59b6',
                            color:'white',
                            border:'none',
                            borderRadius:4,
                            cursor:'pointer',
                            fontSize:13,
                            fontWeight:600,
                            transition:'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor='#8e44ad'}
                          onMouseOut={(e) => e.target.style.backgroundColor='#9b59b6'}
                        >
                          Bookings
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AddStationModal open={addStationOpen} onClose={() => setAddStationOpen(false)} onSubmit={async (payload) => {
              const created = await adminApi.createStation(payload)
              setStations(prev => [created, ...(prev || [])])
              setAddStationOpen(false)
            }} />

            <StationDetailsModal open={stationDetailsOpen} onClose={() => { setStationDetailsOpen(false); setSelectedStation(null) }} station={selectedStation} onUpdated={(u) => setStations(prev => prev.map(x => ((x.id||x.Id) === (u.id||u.Id) ? u : x)))} onDeleted={(id) => setStations(prev => prev.filter(x => (x.id||x.Id) !== id))} />
          </>
        )}
        {section === 'feedback' && (
          <>
            <FeedbackSection />
          </>
        )}
        {section === 'user' && (
          <>
            {loadingUsers && <div style={{padding:'10px 12px'}}>Loading users...</div>}
            <UserSection
              users={users}
              deletedUsers={deletedUsers}
              loadingDeleted={loadingDeletedUsers}
              onAssignStaff={handleAssignStaff}
              onDeleteUser={handleDeleteUser}
              onRestoreUser={handleRestoreUser}
              onUserCreated={loadUsers}
              onLoadDeleted={loadDeletedUsers}
            />
          </>
        )}
        {section === 'staff' && (
          <>
            {(loadingUsers || loadingStaff) && <div style={{padding:'10px 12px'}}>Loading staff...</div>}
            <StaffSection
              users={users}
              staffByStation={staffByStation}
              stations={stations}
              onRemoveStaff={handleRemoveStaff}
              onAssignStation={handleAssignStaffToStation}
              onUnassignStation={handleUnassignStaff}
              onStaffCreated={loadUsers}
            />
          </>
        )}
        {section === 'incident' && (
          <>
            <AdminIncidentSection />
          </>
        )}
        {section === 'analytics' && (
          <>
            <AnalyticsSection />
          </>
        )}
        {section === 'profile' && <ProfileSection />}
      </main>
    </div>
  );
}


