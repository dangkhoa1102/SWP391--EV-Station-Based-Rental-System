import React, { useState, useEffect } from 'react';
import './AdminPage.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BookingSection from './components/Booking/BookingSection';
import VehicleSection from './components/Vehicle/VehicleSection';
import UserSection from './components/User/UserSection';
import StaffSection from './components/Staff/StaffSection';
import AdminAPI from '../services/adminApi';

// Start with empty lists; we will load from API
const initialBookings = [];
const initialVehicles = [];

export default function AdminPage() {
  const [section, setSection] = useState('booking');
  const [bookings, setBookings] = useState(initialBookings);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [staffByStation, setStaffByStation] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
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

  // Booking actions (call API then update locally)
  const confirmBooking = async (id) => {
    try {
      // Try minimal payload first
      await AdminAPI.post('/Bookings/Confirm', { bookingId: id })
    } catch {
      // Fallback to user API's method signature with default payment method
      try { await AdminAPI.post('/Bookings/Confirm', { bookingId: id, paymentMethod: 'Cash', paymentTransactionId: '' }) } catch {}
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'booked' } : b))
  };
  const completeBooking = async (id) => {
    try {
      await AdminAPI.post(`/Bookings/Complete-By-${encodeURIComponent(id)}`)
    } catch {
      try { await AdminAPI.post('/Bookings/Complete', { bookingId: id }) } catch {}
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b))
  };
  const denyBooking = async (id) => {
    try {
      await AdminAPI.post('/Bookings/Deny', { bookingId: id })
    } catch {
      try { await AdminAPI.post('/Bookings/Reject', { bookingId: id }) } catch {}
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'denied' } : b))
  };

  // New: continue to payment handler
  const continueToPayment = async (booking) => {
    try {
      // Default to Cash unless a payment UI is integrated later
      await AdminAPI.confirmBooking(booking.id, 'Cash', '')
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'booked' } : b))
    } catch (e) {
      setError(e?.message || 'Failed to proceed to payment')
    }
  }

  // Cancel booking (soft cancel)
  const cancelBooking = async (booking, reason = '') => {
    try {
      await AdminAPI.cancelBooking(booking.id, reason || '')
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
      const created = await AdminAPI.createCar(normalized)
      // Map created car to view model
      const c = created || {}
      const map = (c) => ({
        id: c.id || c.Id || c.carId || c.CarId,
        name: c.name || c.Name || [c.brand, c.model].filter(Boolean).join(' ') || 'Car',
        model: c.model || c.Model || null,
        brand: c.brand || c.Brand || null,
        licensePlate: c.licensePlate || c.LicensePlate || null,
        img: c.imageUrl || c.image || c.thumbnailUrl || `https://via.placeholder.com/440x280?text=${encodeURIComponent(c.name || c.Name || c.model || 'Car')}`,
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
      await AdminAPI.deleteCar(id)
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
            await AdminAPI.updateStatus(id, status)
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
          await AdminAPI.updateBatteryLevel(id, val)
        }
      }
      if (payload.tech) {
        await AdminAPI.updateStatus(id, payload.tech)
      }
      if (payload.issue) {
        try { await AdminAPI.updateCarDescription(id, payload.issue) }
        catch { await AdminAPI.updateCar(id, { description: payload.issue }) }
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
      const allUsers = await AdminAPI.getAllUsers(1, 1000);
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
      const deleted = await AdminAPI.getDeletedAccounts(1, 1000);
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
      const staff = await AdminAPI.getStaffByStation(stationId);
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
      await AdminAPI.assignStaffRole(user.id || user.Id || user.userId, reason);
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
      await AdminAPI.removeStaffRole(staff.id || staff.Id || staff.userId, reason);
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
        await AdminAPI.reassignStaff(staffId, newStationId);
      } else {
        await AdminAPI.assignStaffToStation(newStationId, staffId);
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
      await AdminAPI.unassignStaffFromStation(staffId);
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
      await AdminAPI.softDeleteUser(userId, reason);
      
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
      await AdminAPI.restoreUser(userId);
      
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
      await AdminAPI.transferCar(vehicle.id, targetStationId, reason || '');
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
      const report = await AdminAPI.getCarStatusReport(sid, null);
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

  // Extract vehicle loading logic into separate function
  const loadVehiclesForStation = async (sid) => {
    try {
      setLoadingVehicles(true);
      let cars = [];
      if (sid) {
        // Show ALL vehicles for the station, regardless of availability
        let byStation = [];
        let available = [];
        try { byStation = await AdminAPI.getCarsByStation(sid); } catch {}
        try { available = await AdminAPI.getAvailableCarsByStation(sid); } catch {}
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
          const all = await AdminAPI.getAllCars(1, 1000);
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
        try { cars = await AdminAPI.getAllCars(1, 1000); }
        catch { try { cars = await AdminAPI.listCars({ page: 1, pageSize: 1000 }); } catch { cars = []; } }
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
          img: c.imageUrl || c.image || c.thumbnailUrl || `https://via.placeholder.com/440x280?text=${encodeURIComponent(c.name || c.Name || 'Car')}`,
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
              const b = await AdminAPI.getCarBattery(v.id);
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
              const cap = await AdminAPI.getCarCapacity(v.id);
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

  // Load stations on mount, then load vehicles for first station
  useEffect(() => {
    let mounted = true
    async function loadRole() {
      try {
        const me = await AdminAPI.getMe()
        const r = me?.role || me?.Role || me?.roleName || me?.userRole || (Array.isArray(me?.roles) ? me.roles[0] : '')
        if (mounted) setRole(r || '')
      } catch {
        // Try from token if /Auth/Me is not available
        try {
          const t = localStorage.getItem('token')
          if (t) {
            const decoded = AdminAPI.decodeJwt(t)
            const r = decoded?.role || decoded?.Role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            if (mounted) setRole(r || '')
          }
        } catch {}
      }
    }
    async function loadStations() {
      try {
        setLoadingStations(true)
        const s = await AdminAPI.getAllStations(1, 100)
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
    loadRole();
    loadStations();
    loadUsers();
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
            items = await AdminAPI.getBookingsByStation(stationId)
          } catch {
            items = []
          }
          // Fallback: if nothing returned, fetch all and client-filter by station
          if (!items || items.length === 0) {
            try {
              const all = await AdminAPI.listBookings({ page: 1, pageSize: 200 })
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
          items = await AdminAPI.listBookings({ page: 1, pageSize: 100 })
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
          const rawStatus = b.statusCode ?? b.StatusCode ?? b.bookingStatus ?? b.BookingStatus ?? b.status ?? b.Status
          let status = 'booked'
          if (rawStatus != null && (typeof rawStatus === 'number' || /^\d+$/.test(String(rawStatus)))) {
            const code = Number(rawStatus)
            if (code === 0) status = 'pending'
            else if (code === 1) status = 'booked'
            else if (code === 2) status = 'checked-in'
            else if (code === 3) status = 'completed'
            else if (code === 4) status = 'denied'
          } else {
            const s = String(rawStatus || '').toLowerCase()
            if (s.includes('pending') || s.includes('wait')) status = 'pending'
            else if (s.includes('check') && s.includes('in')) status = 'checked-in'
            else if (s.includes('complete') || s.includes('finish')) status = 'completed'
            else if (s.includes('deny') || s.includes('reject') || s.includes('cancel')) status = 'denied'
            else status = 'booked'
          }
          const statusLabel = status === 'pending' ? 'Pending'
                             : status === 'booked' ? 'Booked'
                             : status === 'checked-in' ? 'Check-in Pending'
                             : status === 'completed' ? 'Completed'
                             : status === 'denied' ? 'Denied' : (String(rawStatus || '') || 'Booked')
          // Derive a UI stage hint without changing the canonical status
          const s = String(rawStatus || '').toLowerCase()
          const uiStage = (Number(rawStatus) === 0 || s.includes('pending') || s.includes('wait'))
            ? 'waiting-payment'
            : ((s.includes('check') && s.includes('in') && (s.includes('pay') || s.includes('payment'))) ? 'checkin-payment' : null)
          const date = b.date || b.createdAt || b.bookingDate || ''
          const img = b.carImageUrl || b.car?.imageUrl || b.vehicle?.imageUrl || `https://via.placeholder.com/440x280?text=${encodeURIComponent(carName)}`
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
                const u = await AdminAPI.getUserById(uid)
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
                let car = await AdminAPI.getCarById(cid)
                if (!car || (!car.id && !car.Id)) {
                  try { car = await AdminAPI.getCarByIdRest(cid) } catch {}
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

        // Final fallback: for any booking still lacking a proper title, resolve via AdminAPI.getVehicleModelFromBooking
        const stillMissing = (prevList) => prevList.filter(x => !x.title || x.title === 'Booking')
        const missingNow = stillMissing(mapped)
        if (missingNow.length > 0) {
          try {
            const results = await Promise.all(missingNow.map(async b => {
              try {
                const m = await AdminAPI.getVehicleModelFromBooking(b.id)
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
  }, [section, stationId]);

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
              onAdd={addVehicle}
              onRemove={removeVehicle}
              onUpdate={updateVehicle}
              stationId={stationId}
              canDelete={true}
              stationSlots={stationSlots}
              onTransferCar={handleTransferCar}
              stations={stations}
            />
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
      </main>
    </div>
  );
}
