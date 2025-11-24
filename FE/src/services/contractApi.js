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
  },

  /**
   * Create contract (from src_hopdong)
   * @param {object} data - Contract data
   */
  createContract: async (data) => {
    const attempts = [
      { url: '/Contracts/Create', method: 'post' },
      { url: '/Contract/Create', method: 'post' }
    ]
    
    let lastErr
    for (const a of attempts) {
      try {
        const res = await apiClient[a.method](a.url, data)
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
   * Fill contract (from src_hopdong)
   * @param {object} data - Contract data to fill
   */
  fillContract: async (data) => {
    const attempts = [
      { url: '/Contracts/Fill', method: 'post' },
      { url: '/Contract/Fill', method: 'post' }
    ]
    
    let lastErr
    for (const a of attempts) {
      try {
        const res = await apiClient[a.method](a.url, data)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Fill contract endpoint not found')
  },

  /**
   * Request confirmation (from src_hopdong)
   * @param {string} contractId - Contract ID
   * @param {string} email - Email address
   */
  requestConfirmation: async (contractId, email) => {
    if (!contractId) throw new Error('contractId is required')
    const id = encodeURIComponent(contractId)
    
    const attempts = [
      `/Contracts/Request-Confirmation-By-${id}`,
      `/Contracts/${id}/Request-Confirmation`,
      `/Contract/RequestConfirmation/${id}`
    ]
    
    let lastErr
    for (const url of attempts) {
      try {
        const res = await apiClient.post(url, { email })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Request confirmation endpoint not found')
  },

  /**
   * Confirm contract (from src_hopdong)
   * @param {object} data - Confirmation data
   */
  confirmContract: async (data) => {
    const attempts = [
      { url: '/Contracts/Confirm', method: 'post' },
      { url: '/Contract/Confirm', method: 'post' }
    ]
    
    let lastErr
    for (const a of attempts) {
      try {
        const res = await apiClient[a.method](a.url, data)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Confirm contract endpoint not found')
  },

  /**
   * Get contracts by renter (from src_hopdong)
   * @param {string} renterId - Renter ID
   */
  getContractsByRenter: async (renterId) => {
    if (!renterId) return null
    const id = encodeURIComponent(renterId)
    
    const attempts = [
      `/Contracts/Get-By-Renter/${id}`,
      `/Contracts/Renter/${id}`,
      `/Contract/Get-By-Renter/${id}`
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
  },

  /**
   * Create HopDong (from src_hopdong)
   * @param {object} data - Contract data
   * @param {string} bookingId - Booking ID
   * @param {string} renterId - Renter ID
   */
  createHopDong: async (data, bookingId, renterId) => {
    if (!bookingId || !renterId) throw new Error('bookingId and renterId are required')
    
    let url = `/Contracts/hopdong/tao?bookingId=${encodeURIComponent(bookingId)}&renterId=${encodeURIComponent(renterId)}`
    
    const attempts = [
      { url, method: 'post' },
      { url: '/Contracts/Create', method: 'post' }
    ]
    
    let lastErr
    for (const a of attempts) {
      try {
        const res = await apiClient[a.method](a.url, data)
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Create HopDong endpoint not found')
  },

  /**
   * Send confirmation email (from src_hopdong)
   * @param {string} contractId - Contract ID
   * @param {string} email - Email address
   */
  sendConfirmationEmail: async (contractId, email) => {
    if (!contractId) throw new Error('contractId is required')
    const id = encodeURIComponent(contractId)
    
    const attempts = [
      `/Contracts/hopdong/${id}/gui-email`,
      `/Contracts/${id}/Send-Email`,
      `/Contract/SendEmail/${id}`
    ]
    
    let lastErr
    for (const url of attempts) {
      try {
        const res = await apiClient.post(url, { email })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Send confirmation email endpoint not found')
  },

  /**
   * Get contract for confirmation (from src_hopdong)
   * @param {string} token - Confirmation token
   */
  getContractForConfirmation: async (token) => {
    if (!token) throw new Error('token is required')
    const t = encodeURIComponent(token)
    
    const attempts = [
      `/Contracts/hopdong/xac-nhan/${t}`,
      `/Contracts/Confirmation/${t}`,
      `/Contract/GetForConfirmation/${t}`
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
  },

  /**
   * Sign contract (from src_hopdong)
   * @param {string} token - Signing token
   */
  signContract: async (token) => {
    if (!token) throw new Error('token is required')
    
    const attempts = [
      { url: '/Contracts/hopdong/ky', method: 'post' },
      { url: '/Contracts/Sign', method: 'post' },
      { url: '/Contract/Sign', method: 'post' }
    ]
    
    let lastErr
    for (const a of attempts) {
      try {
        const res = await apiClient[a.method](a.url, { token })
        const body = res?.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Sign contract endpoint not found')
  },

  /**
   * Download contract by token (from src_hopdong)
   * @param {string} token - Download token
   */
  downloadContractByToken: async (token) => {
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
    throw new Error('Download contract by token endpoint not found')
  },

  /**
   * Download contract by ID (from src_hopdong)
   * @param {string} contractId - Contract ID
   */
  downloadContractById: async (contractId) => {
    if (!contractId) throw new Error('contractId is required')
    const id = encodeURIComponent(contractId)
    
    const attempts = [
      `/Contracts/${id}/download`,
      `/Contracts/Download/${id}`,
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
    throw new Error('Download contract by ID endpoint not found')
  },

  /**
   * Download latest contract by user ID (from src_hopdong)
   * @param {string} userId - User ID
   */
  downloadLatestContractByUserId: async (userId) => {
    if (!userId) throw new Error('userId is required')
    
    const attempts = [
      { url: '/Contracts/user/download-latest-by-userId', params: { userId } },
      { url: '/Contracts/Download-Latest', params: { userId } }
    ]
    
    for (const a of attempts) {
      try {
        const res = await apiClient.get(a.url, { 
          params: a.params,
          responseType: 'blob' 
        })
        return res.data
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Download latest contract by user ID endpoint not found')
  },

  /**
   * Download my latest contract (based on login token - no parameter needed)
   * Automatically extracts userId from JWT token
   */
  downloadMyLatestContract: async () => {
    const attempts = [
      '/Contracts/download-my-contract',
      '/Contracts/download-latest'
    ]
    
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url, { 
          responseType: 'blob' 
        })
        return res.data
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Download my latest contract endpoint not found')
  },

  /**
   * Get contract by token (from src_hopdong)
   * @param {string} token - Contract token
   */
  getContractByToken: async (token) => {
    if (!token) throw new Error('token is required')
    const t = encodeURIComponent(token)
    
    const attempts = [
      `/Contracts/hopdong/token/${t}`,
      `/Contracts/Token/${t}`,
      `/Contract/GetByToken/${t}`
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
