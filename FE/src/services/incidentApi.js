import { apiClient } from './api'

// ============================================================================
// INCIDENT MANAGEMENT ENDPOINTS
// ============================================================================

const incidentApi = {
  /**
   * Create an incident report with optional image uploads
   * @param {string} bookingId
   * @param {string} description
   * @param {File[]} images
   */
  createIncident: async (bookingId, description, images = []) => {
    if (!bookingId || !description) throw new Error('bookingId and description are required')

    const fd = new FormData()
    fd.append('bookingId', bookingId)
    fd.append('description', description)
    if (images && images.length) {
      for (const f of images) fd.append('images', f)
    }

    const attempts = [
      '/Incidents/Create',
      '/incidents/Create',
      '/Incidents/CreateIncident'
    ]
    let lastErr = null
    for (const url of attempts) {
      try {
        const res = await apiClient.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
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
    throw lastErr || new Error('Create incident endpoint not found')
  },

  /**
   * Fetch incidents for a specific booking
   * @param {string} bookingId - Booking ID
   * @param {number} page - Page number (default 1)
   * @param {number} pageSize - Items per page (default 20)
   * @returns {Array} List of incidents
   */
  getIncidentsByBooking: async (bookingId, page = 1, pageSize = 20) => {
    if (!bookingId) return []
    const id = encodeURIComponent(bookingId)
    
    const attempts = [
      { url: `/Incidents/GetByBooking/${id}`, opts: { params: { page, pageSize } } },
      { url: `/Incident/GetByBooking/${id}`, opts: { params: { page, pageSize } } },
      { url: `/incidents/get-by-booking/${id}`, opts: { params: { page, pageSize } } },
    ]
    
    for (const a of attempts) {
      try {
        const res = await apiClient.get(a.url, a.opts)
        const body = res?.data
        const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body

        if (!unwrapped) continue
        if (Array.isArray(unwrapped)) return unwrapped
        if (Array.isArray(unwrapped?.items)) return unwrapped.items
        if (Array.isArray(unwrapped?.data)) return unwrapped.data
        if (Array.isArray(unwrapped?.incidents)) return unwrapped.incidents

        return Array.isArray(unwrapped) ? unwrapped : []
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) {
          return []
        }
      }
    }
    return []
  },

  /**
   * Get incidents for current user's renter bookings
   */
  getMyIncidents: async () => {
    const attempts = [
      '/Incidents/My-Incidents',
      '/Incidents/My',
      '/Incidents/Get-My'
    ]
    
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
        
        if (!unwrapped) continue
        if (Array.isArray(unwrapped)) return unwrapped
        if (Array.isArray(unwrapped?.items)) return unwrapped.items
        if (Array.isArray(unwrapped?.data)) return unwrapped.data
        
        return Array.isArray(unwrapped) ? unwrapped : []
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) {
          return []
        }
      }
    }
    return []
  },

  /**
   * Fetch incidents across a station (paginated)
   * Used by admin/staff for station management
   */
  getAllIncidents: async (stationId = null, status = null, dateFrom = null, dateTo = null, page = 1, pageSize = 100) => {
    try {
      const params = {}
      if (stationId) params.stationId = stationId
      if (status) params.status = status
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      params.page = page
      params.pageSize = pageSize

      const res = await apiClient.get('/Incidents/Get-All', { params })
      const body = res?.data
      const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
      if (!unwrapped) return { incidents: [], totalCount: 0, page, pageSize }
      if (Array.isArray(unwrapped)) return { incidents: unwrapped, totalCount: unwrapped.length, page, pageSize }
      const incidents = unwrapped.incidents || unwrapped.items || unwrapped.data || []
      const total = unwrapped.totalCount || unwrapped.total || (Array.isArray(incidents) ? incidents.length : 0)
      return { incidents: Array.isArray(incidents) ? incidents : [], totalCount: total || 0, page: unwrapped.page || page, pageSize: unwrapped.pageSize || pageSize }
    } catch (e) {
      return { incidents: [], totalCount: 0, page, pageSize }
    }
  },

  /**
   * Get single incident by id
   */
  getIncidentById: async (incidentId) => {
    if (!incidentId) return null
    const id = encodeURIComponent(incidentId)
    const attempts = [
      `/Incidents/Get-By-${id}`,
      `/Incidents/Get-By-Id/${id}`,
      `/Incidents/${id}`,
      `/incident/${id}`
    ]
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
        if (!unwrapped) continue
        return unwrapped
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    return null
  },

  /**
   * Update incident by id using FormData (supports images additions/removals)
   */
  updateIncident: async (incidentId, formData) => {
    if (!incidentId) throw new Error('incidentId is required')
    const id = encodeURIComponent(incidentId)
    const attempts = [
      `/Incidents/Update-By-${id}`,
      `/Incidents/Update-By-Id/${id}`,
      `/Incidents/Update/${id}`,
      `/Incidents/${id}`
    ]
    let lastErr = null
    for (const url of attempts) {
      try {
        const res = await apiClient.put(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        const body = res?.data
        const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
        return unwrapped || body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Update incident endpoint not found')
  },

  /**
   * Resolve an incident (PATCH) with JSON body { resolutionNotes, costIncurred }
   * Typically used by staff/admin to resolve incidents
   */
  resolveIncident: async (incidentId, resolutionNotes = '', costIncurred = 0) => {
    if (!incidentId) throw new Error('incidentId is required')
    const id = encodeURIComponent(incidentId)
    const attempts = [
      `/Incidents/Resolve-By-${id}`,
      `/Incidents/Resolve-By-Id/${id}`,
      `/Incidents/Resolve/${id}`
    ]
    let lastErr = null
    for (const url of attempts) {
      try {
        const res = await apiClient.patch(url, { resolutionNotes, costIncurred })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Resolve incident endpoint not found')
  },

  /**
   * Delete incident by id
   */
  deleteIncident: async (incidentId) => {
    if (!incidentId) throw new Error('incidentId is required')
    const id = encodeURIComponent(incidentId)
    const attempts = [
      `/Incidents/Delete-By-${id}`,
      `/Incidents/Delete-By-Id/${id}`,
      `/Incidents/Delete/${id}`,
      `/Incidents/${id}`
    ]
    let lastErr = null
    for (const url of attempts) {
      try {
        const res = await apiClient.delete(url)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Delete incident endpoint not found')
  }
}

export default incidentApi
