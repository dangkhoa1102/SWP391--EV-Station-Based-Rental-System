import { apiClient, SWAGGER_ROOT } from './api'
import axios from 'axios'

/**
 * Get admin dashboard data using an explicit access token (or rely on apiClient token).
 * Uses the shared `apiClient` and `SWAGGER_ROOT` configuration so the frontend will
 * honor `VITE_API_BASE_URL` and interceptors (refresh token, etc.).
 *
 * @param {string} [token] - Optional JWT access token override
 * @returns {Promise<object>} ResponseDto<object>
 */
export async function getAdminDashboard(token) {
  const config = {}
  if (token) config.headers = { Authorization: `Bearer ${token}` }

  const res = await apiClient.get('/Admin/Dashboard', config)
  return res?.data
}


/**
 * Fetch revenue report (grouped by station) and return the array of station groups.
 * Response shape expected: { isSuccess, data: { RevenueByStation: [...] }, message, ... }
 */
export async function fetchRevenueByStationReport(token, fromDate, toDate) {
  const params = {}
  if (fromDate) params.fromDate = fromDate instanceof Date ? fromDate.toISOString() : fromDate
  if (toDate) params.toDate = toDate instanceof Date ? toDate.toISOString() : toDate

  const config = { params }
  if (token) config.headers = { Authorization: `Bearer ${token}` }

  const res = await apiClient.get('/Admin/Reports/Revenue-By-Station', config)
  const json = res?.data || {}

  const groups = json?.data?.RevenueByStation ?? json?.data?.revenueByStation ?? json?.RevenueByStation ?? []
  return groups
}

/**
 * Optional helper to get revenue for a specific stationId (GUID)
 */
export async function getRevenueForStation(token, stationId, fromDate, toDate) {
  const groups = await fetchRevenueByStationReport(token, fromDate, toDate)
  return groups.filter(g => String(g.StationId).toLowerCase() === String(stationId).toLowerCase())
}

// Axios-based fallback implementations that target SWAGGER_ROOT directly
const axiosApi = axios.create({ baseURL: SWAGGER_ROOT, headers: { Accept: 'application/json' } })

export async function fetchRevenueByStationReportAxios(token, fromDate, toDate) {
  const params = {}
  if (fromDate) params.fromDate = fromDate instanceof Date ? fromDate.toISOString() : fromDate
  if (toDate) params.toDate = toDate instanceof Date ? toDate.toISOString() : toDate

  const res = await axiosApi.get('/Admin/Reports/Revenue-By-Station', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params
  })

  const json = res?.data || {}
  const groups = json?.data?.RevenueByStation ?? json?.data?.revenueByStation ?? json?.RevenueByStation ?? []
  return groups
}

export async function getRevenueForStationAxios(token, stationId, fromDate, toDate) {
  const groups = await fetchRevenueByStationReportAxios(token, fromDate, toDate)
  return groups.filter(g => String(g.StationId).toLowerCase() === String(stationId).toLowerCase())
}

/**
 * Car utilization report (apiClient)
 * Returns the ResponseDto<object> from the backend.
 */
export async function getCarUtilization(token, fromDate, toDate) {
  const params = {}
  if (fromDate) params.fromDate = fromDate instanceof Date ? fromDate.toISOString() : fromDate
  if (toDate) params.toDate = toDate instanceof Date ? toDate.toISOString() : toDate

  const config = { params }
  if (token) config.headers = { Authorization: `Bearer ${token}` }

  const res = await apiClient.get('/Admin/Reports/Car-Utilization', config)
  return res?.data
}

/**
 * Axios fallback for Car utilization (targets `SWAGGER_ROOT`).
 */
export async function getCarUtilizationAxios(token, fromDate, toDate) {
  const params = {}
  if (fromDate) params.fromDate = fromDate instanceof Date ? fromDate.toISOString() : fromDate
  if (toDate) params.toDate = toDate instanceof Date ? toDate.toISOString() : toDate

  const res = await axiosApi.get('/Admin/Reports/Car-Utilization', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params
  })

  return res?.data
}
