import { apiClient, SWAGGER_ROOT } from './api'
import axios from 'axios'

// Station service: create / update / delete station endpoints
const stationApi = {
  /**
   * Create a new station
   * @param {object} station - Station payload (name, address, totalSlots, ...)
   */
  createStation: async (station) => {
    if (!station) throw new Error('station is required')
    try {
      const res = await apiClient.post('/Stations/Create', station, { headers: { 'Content-Type': 'application/json' } })
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
      throw e
    }
  },

  /**
   * Update station by id
   * @param {string} stationId
   * @param {object} station
   */
  updateStation: async (stationId, station) => {
    if (!stationId) throw new Error('stationId is required')
    if (!station) throw new Error('station payload is required')
    const id = encodeURIComponent(stationId)
    const url = `/Stations/Update-By-${id}`
    try {
      const res = await apiClient.put(url, station, { headers: { 'Content-Type': 'application/json' } })
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
      throw e
    }
  },

  /**
   * Delete station by id
   * @param {string} stationId
   */
  deleteStation: async (stationId) => {
    if (!stationId) throw new Error('stationId is required')
    const id = encodeURIComponent(stationId)
    const url = `/Stations/Delete-By-${id}`
    try {
      const res = await apiClient.delete(url)
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
      throw e
    }
  }
}

export default stationApi

// --- Optional raw helpers (fetch / axios) for direct token-based calls ---
export async function updateStationFetch(apiBase = '', token, stationId, updatePayload) {
  const base = apiBase || SWAGGER_ROOT
  const url = `${base}/Stations/Update-By-${encodeURIComponent(stationId)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  })

  const data = await res.json()
  if (!res.ok || !data?.isSuccess) throw new Error(data?.message || `HTTP ${res.status}`)
  return data.data
}

export async function deleteStationFetch(apiBase = '', token, stationId) {
  const base = apiBase || SWAGGER_ROOT
  const url = `${base}/Stations/Delete-By-${encodeURIComponent(stationId)}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  const data = await res.json()
  if (!res.ok || !data?.isSuccess) throw new Error(data?.message || `HTTP ${res.status}`)
  return data
}

export async function updateStationAxios(apiBase = '', token, stationId, updatePayload) {
  const base = apiBase || SWAGGER_ROOT
  const url = `${base}/Stations/Update-By-${encodeURIComponent(stationId)}`
  const res = await axios.put(url, updatePayload, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  if (!res.data?.isSuccess) throw new Error(res.data?.message || 'Update failed')
  return res.data.data
}

export async function deleteStationAxios(apiBase = '', token, stationId) {
  const base = apiBase || SWAGGER_ROOT
  const url = `${base}/Stations/Delete-By-${encodeURIComponent(stationId)}`
  const res = await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.data?.isSuccess) throw new Error(res.data?.message || 'Delete failed')
  return res.data
}
