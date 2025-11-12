import { apiClient } from './api'

// ============================================================================
// CONTRACT MANAGEMENT ENDPOINTS
// ============================================================================

const contractApi = {
  /**
   * Get contract by booking ID
   * @param {string} bookingId - Booking ID
   */
  getContractByBooking: async (bookingId) => {
    if (!bookingId) return null
    const id = encodeURIComponent(bookingId)
    
    const attempts = [
      `/Contracts/Get-By-Booking/${id}`,
      `/Contract/Get-By-Booking/${id}`,
      `/Contracts/By-Booking/${id}`,
      `/contracts/booking/${id}`
    ]
    
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
        if (unwrapped) return unwrapped
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    return null
  },

  /**
   * Get contract by renter ID
   * @param {string} renterId - Renter user ID
   */
  getContractByRenter: async (renterId) => {
    if (!renterId) return null
    const id = encodeURIComponent(renterId)
    
    const attempts = [
      `/Contracts/Get-By-Renter/${id}`,
      `/Contract/Get-By-Renter/${id}`,
      `/Contracts/By-Renter/${id}`,
      `/contracts/renter/${id}`
    ]
    
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
        if (unwrapped) return unwrapped
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    return null
  },

  /**
   * Create rental contract (tạo hợp đồng)
   * Creates a Word contract file from booking template
   * @param {string} bookingId - Booking ID
   * @param {string} userId - Renter user ID (optional)
   * @param {object} contractDto - Contract data (optional)
   */
  createRentalContract: async (bookingId, userId = null, contractDto = null) => {
    if (!bookingId) throw new Error('bookingId is required')
    
    let url = `/Contracts/hopdong/tao?bookingId=${encodeURIComponent(bookingId)}`
    if (userId) url += `&renterId=${encodeURIComponent(userId)}`
    
    const attempts = [
      { url, method: 'post', data: contractDto },
      { url: '/Contracts/Create', method: 'post', data: { bookingId } },
      { url: '/Contract/Create', method: 'post', data: { bookingId } }
    ]
    
    let lastErr
    for (const a of attempts) {
      try {
        const res = await apiClient[a.method](a.url, a.data || {})
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Create contract endpoint not found')
  },

  /**
   * Send contract email to renter
   * @param {string} contractId - Contract ID
   * @param {string} email - Email address (optional, if not provided uses renter's email)
   */
  sendContractEmail: async (contractId, email = null) => {
    if (!contractId) throw new Error('contractId is required')
    const id = encodeURIComponent(contractId)
    
    console.log('📧 sendContractEmail called with contractId:', contractId, 'email:', email)
    
    const attempts = [
      `/Contracts/hopdong/${id}/gui-email`,
      `/Contracts/${id}/Send-Email`,
      `/Contract/SendEmail`
    ]
    
    let lastErr
    for (const url of attempts) {
      try {
        console.log('📧 Trying endpoint:', url)
        const res = await apiClient.post(url, email ? { email } : {})
        const body = res?.data
        console.log('📧 Success on endpoint:', url, 'response:', body)
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        console.warn('⚠️ Failed on endpoint:', url, 'status:', e?.response?.status, 'error:', e?.response?.data || e?.message)
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    console.error('❌ All endpoints failed for sendContractEmail')
    throw lastErr || new Error('Send contract email endpoint not found')
  },

  /**
   * Check if contract is confirmed/signed
   * @param {string} bookingId - Booking ID
   */
  isContractConfirmed: async (bookingId) => {
    if (!bookingId) return false
    const id = encodeURIComponent(bookingId)
    
    const attempts = [
      `/Contracts/hopdong/${id}/xac-nhan`,
      `/Contracts/Get-By-Booking/${id}`,
      `/Contracts/${id}/Is-Confirmed`,
      `/Contract/IsConfirmed`
    ]
    
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res?.data
        const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
        return unwrapped === true || unwrapped?.isConfirmed === true || unwrapped?.IsConfirmed === true
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    return false
  },

  /**
   * Confirm contract signing (xác nhận ký hợp đồng)
   * Marks contract as confirmed after renter signs
   * @param {string} contractId - Contract ID
   */
  confirmContractSigning: async (contractId) => {
    if (!contractId) throw new Error('contractId is required')
    const id = encodeURIComponent(contractId)
    
    const attempts = [
      `/Contracts/hopdong/${id}/ky`,
      `/Contracts/${id}/Confirm`,
      `/Contract/ConfirmSigning`
    ]
    
    let lastErr
    for (const url of attempts) {
      try {
        const res = await apiClient.post(url)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Confirm contract signing endpoint not found')
  },

  /**
   * Delete/cancel contract (xóa hợp đồng)
   * @param {string} contractId - Contract ID
   */
  deleteContract: async (contractId) => {
    if (!contractId) throw new Error('contractId is required')
    const id = encodeURIComponent(contractId)
    
    const attempts = [
      `/Contracts/hopdong/${id}`,
      `/Contracts/${id}`,
      `/Contract/Delete/${id}`
    ]
    
    let lastErr
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
    throw lastErr || new Error('Delete contract endpoint not found')
  },

  /**
   * Download contract as DOCX file
   * @param {string} contractId - Contract ID
   */
  downloadContract: async (contractId) => {
    if (!contractId) throw new Error('contractId is required')
    const id = encodeURIComponent(contractId)
    
    const attempts = [
      `/Contracts/hopdong/download/${id}`,
      `/Contracts/${id}/Download`,
      `/Contract/Download/${id}`
    ]
    
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url, { responseType: 'blob' })
        return res.data
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Download contract endpoint not found')
  },

  /**
   * Get contract download link by token
   * Download contract using a secure token (không cần authentication)
   * @param {string} token - Download token
   */
  getContractDownloadByToken: async (token) => {
    if (!token) throw new Error('token is required')
    const t = encodeURIComponent(token)
    
    const attempts = [
      `/Contracts/hopdong/download/${t}`,
      `/Contracts/Download/${t}`,
      `/Contract/Download/${t}`
    ]
    
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url, { responseType: 'blob' })
        return res.data
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Get contract download link endpoint not found')
  },

  /**
   * Get contract viewing link with token
   * View contract in browser using secure token (JSON response with HTML)
   * @param {string} token - Viewing token
   */
  getContractViewingByToken: async (token) => {
    if (!token) throw new Error('token is required')
    const t = encodeURIComponent(token)
    
    const attempts = [
      `/Contracts/hopdong/token/${t}`,
      `/Contracts/View/${t}`,
      `/Contract/View/${t}`
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
    return null
  }
}

export default contractApi
