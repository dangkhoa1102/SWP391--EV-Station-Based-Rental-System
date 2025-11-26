import { apiClient, SWAGGER_ROOT } from './api'
import axios from 'axios'

const feedbackApi = {
  /**
   * Get feedbacks with pagination and optional search/sort
   * @param {object} params { page, pageSize, search, sortBy }
   */
  getFeedbacks: async (params = { page: 1, pageSize: 2, search: '', sortBy: '' }) => {
    // Some backends use `pageSize` to represent the page number. For compatibility,
    // if `page` is provided, send it also as `pageSize` so requests like
    // getFeedbacks({ page: 2 }) will reach backends expecting page in `pageSize`.
    const p = {
      pageNumber: params.page ?? params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 2
    }
    if (params.search) p.search = params.search
    if (params.sortBy) p.sortBy = params.sortBy
    try {
      // Backend Swagger expects capitalized query names: Page, PageSize, Search, SortBy
      const paramsToSend = {
        Page: p.pageNumber,
        PageSize: p.pageSize
      }
      if (p.search) paramsToSend.Search = p.search
      if (p.sortBy) paramsToSend.SortBy = p.sortBy

      if (process.env.NODE_ENV !== 'production') console.debug('feedbackApi.getFeedbacks params', paramsToSend)

      const res = await apiClient.get('/Feedback/Get-All', { params: paramsToSend })
      const body = res?.data
      // Unwrap ResponseDto<PaginationDto<FeedbackDto>> and normalize shape
      // Backend often returns { data: { data: [...], currentPage, pageSize, ... } }
      const pagination = body && typeof body === 'object' && 'data' in body ? body.data : body
      if (!pagination || typeof pagination !== 'object') return { items: [], totalCount: 0 }

      const items = Array.isArray(pagination.data)
        ? pagination.data
        : Array.isArray(pagination.items)
        ? pagination.items
        : []

      const normalized = {
        items,
        currentPage: pagination.currentPage ?? pagination.pageNumber ?? pagination.page ?? 1,
        pageSize: pagination.pageSize ?? pagination.pageSize ?? 1,
        totalCount: pagination.totalItems ?? pagination.totalCount ?? 0,
        totalPages: pagination.totalPages ?? 0,
        hasPrevious: Boolean(pagination.hasPrevious ?? false),
        hasNext: Boolean(pagination.hasNext ?? false)
      }

      if (process.env.NODE_ENV !== 'production') console.debug('feedbackApi.getFeedbacks response', normalized)

      return normalized
    } catch (e) {
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) throw e
      return { items: [], totalCount: 0 }
    }
  }
}

export default feedbackApi

// --- raw fetch helper matching user's snippet ---
export async function getFeedbacksFetch(apiBase = '', params = { page: 1, pageSize: 2, search: '', sortBy: '' }) {
  const base = apiBase || SWAGGER_ROOT
  const qs = new URLSearchParams()
  if (params.page != null) qs.set('page', params.page)
  if (params.pageSize != null) qs.set('pageSize', params.pageSize)
  if (params.search) qs.set('search', params.search)
  if (params.sortBy) qs.set('sortBy', params.sortBy)

  const res = await fetch(`${base}/Feedback/Get-All?${qs.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  const payload = await res.json()
  if (!payload?.isSuccess) throw new Error(payload?.message || 'Failed to get feedbacks')
  return payload.data
}

// --- axios helper ---
export async function getFeedbacksAxios(apiBase = '', params = { page: 1, pageSize: 2, search: '', sortBy: '' }) {
  const base = apiBase || SWAGGER_ROOT
  const qs = new URLSearchParams()
  if (params.page != null) qs.set('page', params.page)
  if (params.pageSize != null) qs.set('pageSize', params.pageSize)
  if (params.search) qs.set('search', params.search)
  if (params.sortBy) qs.set('sortBy', params.sortBy)
  const url = `${base}/Feedback/Get-All?${qs.toString()}`
  const res = await axios.get(url, { headers: { Accept: 'application/json' } })
  if (!res.data?.isSuccess) throw new Error(res.data?.message || 'Failed to get feedbacks')
  return res.data.data
}
