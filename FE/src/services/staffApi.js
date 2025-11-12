import { apiClient } from './api'
import bookingApi from './bookingApi'
import incidentApi from './incidentApi'

// ============================================================================
// STAFF-SPECIFIC ENDPOINTS & API AGGREGATION
// ============================================================================
// This module consolidates all staff operations, including booking, incident,
// and vehicle management by combining staff-specific endpoints with delegated
// operations to other modular APIs.

const staffApi = {
  // ===== BOOKINGS (delegated from bookingApi with staff-specific methods) =====
  confirmBooking: bookingApi.confirmBooking,
  cancelBooking: bookingApi.cancelBooking,
  completeBooking: bookingApi.completeBooking,
  getBookingById: bookingApi.getBookingById,
  
  // ===== INCIDENTS (delegated from incidentApi) =====
  createIncident: incidentApi.createIncident,
  getIncidentsByBooking: incidentApi.getIncidentsByBooking,
  getMyIncidents: incidentApi.getMyIncidents,
  getAllIncidents: incidentApi.getAllIncidents,
  getIncidentById: incidentApi.getIncidentById,
  updateIncident: incidentApi.updateIncident,
  resolveIncident: incidentApi.resolveIncident,
  deleteIncident: incidentApi.deleteIncident,

  // ===== RAW API METHODS (for direct endpoint calls) =====
  post: (url, data = {}) => apiClient.post(url, data).then(res => res.data),
  get: (url, config = {}) => apiClient.get(url, config).then(res => res.data),
  put: (url, data = {}) => apiClient.put(url, data).then(res => res.data),
  patch: (url, data = {}) => apiClient.patch(url, data).then(res => res.data),
  delete: (url) => apiClient.delete(url).then(res => res.data),

  // ===== CAR MANAGEMENT METHODS (delegated to raw API calls) =====
  createCar: async (carData) => {
    try {
      const res = await apiClient.post('/Cars/Create', carData)
      return res.data?.data || res.data
    } catch (e) {
      console.error('Error creating car:', e)
      throw e
    }
  },

  deleteCar: async (carId) => {
    try {
      const res = await apiClient.delete(`/Cars/Delete-By-${encodeURIComponent(carId)}`)
      return res.data?.data || res.data
    } catch (e) {
      console.error('Error deleting car:', e)
      throw e
    }
  },

  updateCar: async (carId, carData) => {
    try {
      const res = await apiClient.put(`/Cars/Update-By-${encodeURIComponent(carId)}`, carData)
      return res.data?.data || res.data
    } catch (e) {
      console.error('Error updating car:', e)
      throw e
    }
  },

  updateStatus: async (carId, status) => {
    try {
      const res = await apiClient.patch(`/Cars/${encodeURIComponent(carId)}/status`, { status })
      return res.data?.data || res.data
    } catch (e) {
      console.error('Error updating car status:', e)
      throw e
    }
  },

  updateBatteryLevel: async (carId, batteryLevel) => {
    try {
      const res = await apiClient.patch(`/Cars/${encodeURIComponent(carId)}/battery`, { batteryLevel })
      return res.data?.data || res.data
    } catch (e) {
      console.error('Error updating battery level:', e)
      throw e
    }
  },

  updateCarDescription: async (carId, description) => {
    try {
      const res = await apiClient.patch(`/Cars/${encodeURIComponent(carId)}/description`, { description })
      return res.data?.data || res.data
    } catch (e) {
      console.error('Error updating car description:', e)
      throw e
    }
  },

  getCarsByStation: async (stationId) => {
    try {
      const res = await apiClient.get(`/Cars/Get-Available-By-Station/${encodeURIComponent(stationId)}`)
      const responseData = res?.data
      
      // Handle various response formats
      if (Array.isArray(responseData)) return responseData
      if (responseData?.data && Array.isArray(responseData.data)) return responseData.data
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) return responseData.data.data
      if (responseData?.items && Array.isArray(responseData.items)) return responseData.items
      
      console.warn('⚠️ No cars found in response for station:', stationId)
      return []
    } catch (e) {
      console.warn('⚠️ getCarsByStation error (endpoint may not exist):', e.message)
      // Return empty array instead of throwing, as this is an optional endpoint
      return []
    }
  },

  // ===== STAFF-SPECIFIC CHECK-IN/CHECK-OUT OPERATIONS =====
  checkInWithContract: async (payload) => {
    if (!payload || !payload.bookingId || !payload.staffId) {
      throw new Error('Missing required fields: bookingId, staffId')
    }
    
    const attempts = [
      '/Bookings/Check-In-With-Contract',
      '/Bookings/CheckInWithContract',
      '/bookings/check-in-with-contract',
    ]
    let lastErr
    
    for (const url of attempts) {
      // Try with FormData first (multipart/form-data)
      if (payload.checkInPhotoFile && payload.checkInPhotoFile instanceof File) {
        try {
          const formData = new FormData()
          formData.append('bookingId', payload.bookingId)
          formData.append('staffId', payload.staffId)
          if (payload.checkInNotes) {
            formData.append('checkInNotes', payload.checkInNotes)
          }
          if (payload.checkInPhotoUrl && !payload.checkInPhotoUrl.startsWith('blob:')) {
            formData.append('checkInPhotoUrl', payload.checkInPhotoUrl)
          }
          formData.append('checkInPhotoFile', payload.checkInPhotoFile)
          
          const res = await apiClient.post(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          const body = res?.data
          if (body && typeof body === 'object' && 'data' in body) {
            if (body.isSuccess === false) {
              const msg = body.message || (Array.isArray(body.errors) ? body.errors.join('; ') : 'Request failed')
              const err = new Error(msg)
              err.body = body
              throw err
            }
            return body.data
          }
          return body
        } catch (e) {
          lastErr = e
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
      
      // Try with JSON payload
      try {
        const { checkInPhotoFile, ...jsonPayload } = payload
        const res = await apiClient.post(url, jsonPayload, {
          headers: { 'Content-Type': 'application/json' }
        })
        const body = res?.data
        if (body && typeof body === 'object' && 'data' in body) {
          if (body.isSuccess === false) {
            const msg = body.message || (Array.isArray(body.errors) ? body.errors.join('; ') : 'Request failed')
            const err = new Error(msg)
            err.body = body
            throw err
          }
          return body.data
        }
        return body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Check-In-With-Contract endpoint not found')
  },

  /**
   * Check-Out with Payment
   * Expected payload shape:
   * { bookingId: GUID, staffId: GUID, actualReturnDateTime?: DateTime, checkOutNotes?: string, checkOutPhotoUrl?: string, damageFee?: number }
   */
  checkOutWithPayment: async (payload) => {
    if (!payload || !payload.bookingId || !payload.staffId) {
      throw new Error('Missing required fields: bookingId, staffId')
    }
    
    const attempts = [
      '/Bookings/Check-Out-With-Payment',
      '/Bookings/CheckOutWithPayment',
      '/bookings/check-out-with-payment',
    ]
    let lastErr
    
    for (const url of attempts) {
      // Try with FormData first (multipart/form-data)
      if (payload.checkOutPhotoFile && payload.checkOutPhotoFile instanceof File) {
        try {
          const formData = new FormData()
          formData.append('bookingId', payload.bookingId)
          formData.append('staffId', payload.staffId)
          
          if (payload.actualReturnDateTime) {
            formData.append('actualReturnDateTime', payload.actualReturnDateTime)
          }
          
          if (payload.damageFee !== undefined && payload.damageFee !== null) {
            formData.append('damageFee', String(payload.damageFee))
          }
          
          if (payload.checkOutNotes) {
            formData.append('checkOutNotes', payload.checkOutNotes)
          }
          
          if (payload.checkOutPhotoUrl && !payload.checkOutPhotoUrl.startsWith('blob:')) {
            formData.append('checkOutPhotoUrl', payload.checkOutPhotoUrl)
          }
          
          formData.append('checkOutPhotoFile', payload.checkOutPhotoFile)
          
          const res = await apiClient.post(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          const body = res?.data
          if (body && typeof body === 'object' && 'data' in body) {
            if (body.isSuccess === false) {
              const msg = body.message || (Array.isArray(body.errors) ? body.errors.join('; ') : 'Request failed')
              const err = new Error(msg)
              err.body = body
              throw err
            }
            return body.data
          }
          return body
        } catch (e) {
          lastErr = e
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
      
      // Try with JSON payload
      try {
        const { checkOutPhotoFile, ...jsonPayload } = payload
        const res = await apiClient.post(url, jsonPayload, {
          headers: { 'Content-Type': 'application/json' }
        })
        const body = res?.data
        if (body && typeof body === 'object' && 'data' in body) {
          if (body.isSuccess === false) {
            const msg = body.message || (Array.isArray(body.errors) ? body.errors.join('; ') : 'Request failed')
            const err = new Error(msg)
            err.body = body
            throw err
          }
          return body.data
        }
        return body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Check-Out-With-Payment endpoint not found')
  },

  /**
   * Get detailed car status report
   * Helps staff manage fleet at their station
   * Calculates available and total cars for the station
   */
  getCarStatusReport: async (stationId = null, status = null) => {
    try {
      if (!stationId) {
        console.warn('⚠️ stationId is required for getCarStatusReport')
        return null
      }

      // Get available cars for this station using getCarsByStation
      const availableCars = await staffApi.getCarsByStation(stationId)
      
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
   * Get all stations (for staff to see station names)
   */
  getAllStations: async (page = 1, pageSize = 100) => {
    try {
      const res = await apiClient.get('/Stations/Get-All', { params: { pageNumber: page, pageSize } })
      const responseData = res?.data
      
      if (Array.isArray(responseData)) return responseData
      if (responseData?.data && Array.isArray(responseData.data)) return responseData.data
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) return responseData.data.data
      if (responseData?.items && Array.isArray(responseData.items)) return responseData.items
      
      console.warn('⚠️ No stations found in response')
      return []
    } catch (e) {
      console.warn('⚠️ getAllStations error:', e.message)
      return []
    }
  },

  /**
   * Get bookings for a specific station
   */
  getBookingsByStation: async (stationId, page = 1, pageSize = 100) => {
    if (!stationId) throw new Error('stationId is required')
    const id = encodeURIComponent(stationId)
    try {
      const res = await apiClient.get(`/Bookings/By-Station/${id}`, { params: { pageNumber: page, pageSize } })
      const responseData = res?.data
      
      if (Array.isArray(responseData)) return responseData
      if (responseData?.data && Array.isArray(responseData.data)) return responseData.data
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) return responseData.data.data
      if (responseData?.items && Array.isArray(responseData.items)) return responseData.items
      
      console.warn('⚠️ No bookings found in response for station:', stationId)
      return []
    } catch (e) {
      console.warn('⚠️ getBookingsByStation error:', e.message)
      return []
    }
  },

  /**
   * Get available cars for a specific station
   */
  getAvailableCarsByStation: async (stationId) => {
    if (!stationId) return []
    const id = encodeURIComponent(stationId)
    try {
      const res = await apiClient.get(`/Cars/Get-Available-By-Station/${id}`)
      const responseData = res?.data
      
      if (Array.isArray(responseData)) return responseData
      if (responseData?.data && Array.isArray(responseData.data)) return responseData.data
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) return responseData.data.data
      if (responseData?.items && Array.isArray(responseData.items)) return responseData.items
      
      console.warn('⚠️ No available cars found for station:', stationId)
      return []
    } catch (e) {
      console.warn('⚠️ getAvailableCarsByStation error:', e.message)
      return []
    }
  },

}

export default staffApi
