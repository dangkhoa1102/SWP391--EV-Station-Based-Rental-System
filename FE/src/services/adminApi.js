import { apiClient } from './api'
import bookingApi from './bookingApi'
import staffApi from './staffApi'
import carApi from './carApi'

// ============================================================================
// ADMIN-SPECIFIC ENDPOINTS
// ============================================================================

const adminApi = {
  // ---------------------------------------------------------------------------
  // BOOKING OPERATIONS (delegated from bookingApi)
  // ---------------------------------------------------------------------------

  confirmBooking: bookingApi.confirmBooking,
  cancelBooking: bookingApi.cancelBooking,
  completeBooking: bookingApi.completeBooking,
  getBookingById: bookingApi.getBookingById,

  /**
   * List all bookings with pagination
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @returns {Promise<Array>} Array of bookings
   */
  listBookings: async (options = {}) => {
    try {
      const { page = 1, pageSize = 100 } = options
      console.log(`📋 Listing bookings: page=${page}, pageSize=${pageSize}`)
      
      const res = await apiClient.get('/Bookings/Get-All', {
        params: {
          pageNumber: page,
          pageSize: pageSize
        }
      })
      
      const responseData = res?.data
      
      // Handle various response formats
      if (Array.isArray(responseData)) return responseData
      if (responseData?.data && Array.isArray(responseData.data)) return responseData.data
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) return responseData.data.data
      if (responseData?.items && Array.isArray(responseData.items)) return responseData.items
      
      console.warn('⚠️ No bookings array found in listBookings response')
      return []
    } catch (e) {
      console.error('❌ Error listing bookings:', e.message)
      return []
    }
  },

  // ---------------------------------------------------------------------------
  // CAR OPERATIONS (delegated from staffApi)
  // ---------------------------------------------------------------------------

  createCar: staffApi.createCar,
  deleteCar: staffApi.deleteCar,
  updateCar: staffApi.updateCar,
  updateStatus: staffApi.updateStatus,
  updateBatteryLevel: staffApi.updateBatteryLevel,
  updateCarDescription: staffApi.updateCarDescription,
  getCarStatusReport: staffApi.getCarStatusReport,
  getCarsByStation: staffApi.getCarsByStation,

  // CAR READ OPERATIONS (delegated from carApi)
  getAllCars: carApi.getAllCars,
  getCarById: carApi.getCarById,
  getAvailableCarsByStation: carApi.getAvailableCarsByStation,

  // STATION & BOOKING OPERATIONS (delegated from staffApi)
  getAllStations: staffApi.getAllStations,
  getBookingsByStation: staffApi.getBookingsByStation,

  // ---------------------------------------------------------------------------
  // USER & STAFF MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Get all users (customers and staff)
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {string} role - Filter by role (optional)
   */
  getAllUsers: async (page = 1, pageSize = 100, role = null) => {
    const params = { pageNumber: page, pageSize }
    if (role) params.role = role
    const attempts = [
      { url: '/Users/Get-All', params },
      { url: '/Admin/Users', params },
      { url: '/users', params }
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient.get(a.url, { params: a.params })
        const body = res?.data
        if (Array.isArray(body)) return body
        if (Array.isArray(body?.data?.data)) return body.data.data
        if (Array.isArray(body?.data)) return body.data
        if (Array.isArray(body?.items)) return body.items
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    return []
  },

  /**
   * Assign staff role to user (EV Renter → Station Staff)
   */
  assignStaffRole: async (userId, reason = '') => {
    if (!userId) throw new Error('userId is required')
    const id = encodeURIComponent(userId)
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
    const attempts = [
      `/Admin/Users/${id}/Assign-Staff-Role${query}`,
      `/Users/${id}/Assign-Staff-Role${query}`,
      `/Admin/Users/Assign-Staff-Role${query}`,
    ]
    for (const url of attempts) {
      try {
        const res = await apiClient.post(url, reason ? { userId, reason } : { userId })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Assign staff role endpoint not found')
  },

  /**
   * Remove staff role from user (Station Staff → EV Renter)
   */
  removeStaffRole: async (userId, reason = '') => {
    if (!userId) throw new Error('userId is required')
    const id = encodeURIComponent(userId)
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
    const attempts = [
      `/Admin/Users/${id}/Remove-Staff-Role${query}`,
      `/Users/${id}/Remove-Staff-Role${query}`,
      `/Admin/Users/Remove-Staff-Role${query}`,
    ]
    for (const url of attempts) {
      try {
        const res = await apiClient.post(url, reason ? { userId, reason } : { userId })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Remove staff role endpoint not found')
  },

  /**
   * Get staff by station
   */
  getStaffByStation: async (stationId) => {
    if (!stationId) return []
    const id = encodeURIComponent(stationId)
    const attempts = [
      `/Admin/Staff/By-Station/${id}`,
      `/Staff/By-Station/${id}`,
      { url: '/Admin/Staff/By-Station', params: { stationId } }
    ]
    for (const a of attempts) {
      try {
        const res = typeof a === 'string' ? await apiClient.get(a) : await apiClient.get(a.url, { params: a.params })
        const body = res?.data
        if (Array.isArray(body)) return body
        if (Array.isArray(body?.data)) return body.data
        if (Array.isArray(body?.items)) return body.items
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    return []
  },

  /**
   * Get station for a specific staff member (reverse of getStaffByStation)
   * Returns the station ID and details for a given staff member
   */
  getStationByStaff: async (staffId) => {
    if (!staffId) throw new Error('staffId is required')
    const id = encodeURIComponent(staffId)
    const attempts = [
      `/Admin/Staff/${id}/Station`,
      `/Staff/${id}/Station`,
      `/Admin/Users/${id}/Station`,
      `/Users/${id}/Station`
    ]
    
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        const result = body && typeof body === 'object' && 'data' in body ? body.data : body
        if (result) return result
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    
    return null
  },

  /**
   * Get customer profile with booking statistics
   */
  getCustomerProfile: async (userId) => {
    if (!userId) throw new Error('userId is required')
    const id = encodeURIComponent(userId)
    const attempts = [
      `/Admin/Customers/${id}/Profile`,
      `/Admin/Users/${id}/Profile`,
      `/Users/${id}/Profile`
    ]
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Customer profile endpoint not found')
  },

  /**
   * Get user documents (CCCD and GPLX images)
   */
  getUserDocuments: async (userId) => {
    if (!userId) throw new Error('userId is required')
    const id = encodeURIComponent(userId)
    const attempts = [
      `/Admin/Users/${id}/Documents`,
      `/Users/${id}/Documents`
    ]
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('User documents endpoint not found')
  },

  /**
   * Soft delete user account
   */
  softDeleteUser: async (userId, reason = '') => {
    if (!userId) throw new Error('userId is required')
    const id = encodeURIComponent(userId)
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
    const attempts = [
      `/Admin/Users/${id}/Soft-Delete${query}`,
      `/Users/${id}/Soft-Delete${query}`
    ]
    for (const url of attempts) {
      try {
        const res = await apiClient.post(url, reason ? { reason } : {})
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Soft delete user endpoint not found')
  },

  /**
   * Restore deleted user account
   */
  restoreUser: async (userId) => {
    if (!userId) throw new Error('userId is required')
    const id = encodeURIComponent(userId)
    const attempts = [
      `/Admin/Users/${id}/Restore`,
      `/Users/${id}/Restore`
    ]
    for (const url of attempts) {
      try {
        const res = await apiClient.post(url)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Restore user endpoint not found')
  },

  /**
   * Get deleted accounts with pagination and filters
   */
  getDeletedAccounts: async (page = 1, pageSize = 20, role = null) => {
    if (!page || page < 1) page = 1
    if (!pageSize || pageSize < 1) pageSize = 20
    
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    
    if (role) {
      params.append('role', role)
    }
    
    const attempts = [
      `/Admin/Users/Deleted-Accounts?${params}`,
      `/Users/Deleted-Accounts?${params}`
    ]
    
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        const result = body && typeof body === 'object' && 'data' in body ? body.data : body
        return result?.deletedAccounts || result || []
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Get deleted accounts endpoint not found')
  },

  // ---------------------------------------------------------------------------
  // DASHBOARD & REPORTS
  // ---------------------------------------------------------------------------

  /**
   * Get admin dashboard overview
   */
  getAdminDashboard: async () => {
    const attempts = ['/Admin/Dashboard', '/Dashboard']
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Dashboard endpoint not found')
  },

  /**
   * Get fleet overview (all stations)
   */
  getFleetOverview: async () => {
    const attempts = ['/Admin/Fleet/Overview', '/Fleet/Overview']
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    return null
  },

  /**
   * Get detailed car status report
   * @param {string} stationId - Filter by station (optional)
   * @param {string} status - Filter by status (optional)
   */
  getCarStatusReport: async (stationId = null, status = null) => {
    try {
      if (!stationId) {
        console.warn('⚠️ stationId is required for getCarStatusReport')
        return null
      }

      // Get available cars for this station using getCarsByStation
      const availableCars = await adminApi.getCarsByStation(stationId)
      
      // Return status report with slot information
      return {
        totalCars: Array.isArray(availableCars) ? availableCars.length : 0,
        availableCars: Array.isArray(availableCars) ? availableCars.length : 0,
        cars: availableCars || []
      }
    } catch (e) {
      console.warn('⚠️ getCarStatusReport error:', e.message)
      return null
    }
  },

  /**
   * Transfer car between stations
   * @param {string} carId - Car ID to transfer
   * @param {string} targetStationId - Target station ID
   * @param {string} reason - Reason for transfer (optional)
   */
  transferCar: async (carId, targetStationId, reason = '') => {
    if (!carId || !targetStationId) throw new Error('carId and targetStationId are required')
    const params = { carId, targetStationId }
    if (reason) params.reason = reason
    const attempts = ['/Admin/Fleet/Transfer-Car', '/Fleet/Transfer-Car']
    for (const url of attempts) {
      try {
        const res = await apiClient.post(url, null, { params })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Transfer car endpoint not found')
  },

  /**
   * Assign staff to station
   * @param {string} stationId - Station ID
   * @param {string} staffId - Staff user ID
   */
  assignStaffToStation: async (stationId, staffId) => {
    if (!stationId || !staffId) throw new Error('stationId and staffId are required')
    const attempts = [
      { url: `/Stations/${encodeURIComponent(stationId)}/Assign-Staff`, params: { staffId } },
      { url: `/Admin/Stations/${encodeURIComponent(stationId)}/Assign-Staff`, params: { staffId } }
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient.post(a.url, null, { params: a.params })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Assign staff to station endpoint not found')
  },

  /**
   * Unassign staff from station
   * POST /api/Stations/Unassign-Staff
   * @param {string} staffId - Staff user ID
   */
  unassignStaffFromStation: async (staffId) => {
    if (!staffId) throw new Error('staffId is required')
    const attempts = [
      { url: `/Stations/Unassign-Staff`, params: { staffId } },
      { url: `/Admin/Stations/Unassign-Staff`, params: { staffId } }
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient.post(a.url, null, { params: a.params })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Unassign staff from station endpoint not found')
  },

  /**
   * Reassign staff from one station to another
   * POST /api/Stations/Reassign-Staff
   * @param {string} staffId - Staff user ID
   * @param {string} toStationId - Target station ID
   */
  reassignStaff: async (staffId, toStationId) => {
    if (!staffId || !toStationId) throw new Error('staffId and toStationId are required')
    const attempts = [
      { url: `/Stations/Reassign-Staff`, params: { staffId, toStationId } },
      { url: `/Admin/Stations/Reassign-Staff`, params: { staffId, toStationId } }
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient.post(a.url, null, { params: a.params })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Reassign staff endpoint not found')
  },

  // ---------------------------------------------------------------------------
  // RAW API METHODS (proxy to apiClient for direct endpoint calls)
  // ---------------------------------------------------------------------------

  /**
   * HTTP POST request
   */
  post: async (url, data, config = {}) => {
    const response = await apiClient.post(url, data, config)
    return response?.data
  },

  /**
   * HTTP GET request
   */
  get: async (url, config = {}) => {
    const response = await apiClient.get(url, config)
    return response?.data
  },

  /**
   * HTTP PUT request
   */
  put: async (url, data, config = {}) => {
    const response = await apiClient.put(url, data, config)
    return response?.data
  },

  /**
   * HTTP PATCH request
   */
  patch: async (url, data, config = {}) => {
    const response = await apiClient.patch(url, data, config)
    return response?.data
  },

  /**
   * HTTP DELETE request
   */
  delete: async (url, config = {}) => {
    const response = await apiClient.delete(url, config)
    return response?.data
  }
}

export default adminApi
