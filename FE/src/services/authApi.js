import { apiClient, decodeJwt } from './api'

const authApi = {
  // Register a new account -> POST /Auth/Register
  register: async ({ fullName, email, phoneNumber, password }) => {
    const payload = { FullName: fullName, Email: email, PhoneNumber: phoneNumber, Password: password, ConfirmPassword: password }
    const res = await apiClient.post('/Auth/Register', payload)
    return res.data
  },

  // Login -> POST /Auth/Login
  // This replicates the old behavior: save tokens, decode JWT to extract userId and role
  login: async (email, password) => {
    try {
      const res = await apiClient.post('/Auth/Login', { Email: email, Password: password })
      const payload = res.data?.data || res.data || {}

      const token = payload.token || payload.accessToken || res.data?.token
      const refreshToken = payload.refreshToken || res.data?.refreshToken

      if (token) {
        localStorage.setItem('token', token)
        try {
          const decoded = decodeJwt(token)
          const userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
            || decoded.nameidentifier || decoded.UserId || decoded.userId || decoded.uid || decoded.nameid || decoded.sub || decoded.id || decoded.Id
          if (userId) localStorage.setItem('userId', userId)

          const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.Role
          if (role) localStorage.setItem('userRole', role)
        } catch (e) {
          console.error('❌ Error decoding JWT in authApi.login:', e)
        }
      }

      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)

      // Also store user object if present
      if (payload.user) localStorage.setItem('user', JSON.stringify(payload.user))
      
      // Store email for display (either from payload.user.email or from login input email parameter)
      if (payload.user?.email) {
        localStorage.setItem('userEmail', payload.user.email)
      } else if (email) {
        localStorage.setItem('userEmail', email)
      }

      // For staff users, attempt to fetch profile (stationId) - best-effort
      try {
        const userRole = localStorage.getItem('userRole')
        const isStaff = userRole && (userRole.includes('Staff') || userRole.includes('staff') || userRole === 'StationManager' || userRole.includes('Manager'))
        if (isStaff) {
          const profile = await authApi.getMyProfile()
          const stationId = profile?.stationId || profile?.StationId
          if (stationId) localStorage.setItem('stationId', stationId)
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch staff profile after login:', e)
      }

      return { raw: res.data, token, refreshToken, payload }
    } catch (err) {
      // Extract a friendly server message when possible
      const serverMsg = err.response?.data?.message
        || (err.response?.data && typeof err.response.data === 'string' ? err.response.data : null)
        || (err.response?.data?.errors && Object.values(err.response.data.errors).flat().join('; '))
        || err.message || 'Login failed'

      const e = new Error(serverMsg)
      e.status = err.response?.status
      throw e
    }
  },

  // Logout -> POST /Auth/Logout
  logout: async () => {
    const res = await apiClient.post('/Auth/Logout')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('stationId')
    return res.data
  },

  // Refresh token -> POST /Auth/Refresh-Token
  refreshToken: async () => {
    const res = await apiClient.post('/Auth/Refresh-Token')
    // If response contains token, persist it
    const newToken = res.data?.data?.token || res.data?.token || res.data?.accessToken
    const newRefresh = res.data?.data?.refreshToken || res.data?.refreshToken
    if (newToken) localStorage.setItem('token', newToken)
    if (newRefresh) localStorage.setItem('refreshToken', newRefresh)
    return res.data
  },

  // Upload CCCD -> POST /Auth/cccd (form-data)
  uploadCCCD: async (frontFile, backFile) => {
    const formData = new FormData()
    if (frontFile) formData.append('fileFront', frontFile, frontFile.name)
    if (backFile) formData.append('fileBack', backFile, backFile.name)
    const res = await apiClient.post('/Auth/cccd', formData, { headers: { 'Content-Type': undefined }, timeout: 30000 })
    return res.data
  },

  // Upload GPLX -> POST /Auth/gplx (form-data)
  uploadGPLX: async (frontFile, backFile) => {
    const formData = new FormData()
    if (frontFile) formData.append('fileFront', frontFile, frontFile.name)
    if (backFile) formData.append('fileBack', backFile, backFile.name)
    const res = await apiClient.post('/Auth/gplx', formData, { headers: { 'Content-Type': undefined }, timeout: 30000 })
    return res.data
  },

  // Get authenticated user's profile -> GET /Auth/Me
  getMe: async () => {
    const res = await apiClient.get('/Auth/Me')
    return res.data?.data || res.data || {}
  },

  // Get my profile (Users/Get-My-Profile) - kept for parity with existing code
  getMyProfile: async () => {
    const res = await apiClient.get('/Users/Get-My-Profile')
    return res.data?.data || res.data || {}
  },

  // Get user by id -> GET /Users/Get-By-{userId} (belongs in userApi)
  getUserById: async (userId) => {
    try {
      const res = await apiClient.get(`/Users/Get-By-${encodeURIComponent(userId)}`)
      return res.data?.data || res.data || {}
    } catch (e) {
      try {
        const res2 = await apiClient.get(`/Users/${encodeURIComponent(userId)}`)
        return res2.data?.data || res2.data || {}
      } catch (e2) {
        console.error('authApi.getUserById failed:', e2)
        throw e2
      }
    }
  },

  // Verify email with OTP -> POST /Auth/verify-email
  verifyEmail: async (email, otp) => {
    const res = await apiClient.post('/Auth/verify-email', { Email: email, Otp: otp })
    return res.data
  },

  // Forgot password -> POST /Auth/forgot-password
  forgotPassword: async (email) => {
    const res = await apiClient.post('/Auth/forgot-password', { Email: email })
    return res.data
  },

  // Reset password with OTP -> POST /Auth/reset-password
  resetPassword: async (email, otp, newPassword) => {
    const res = await apiClient.post('/Auth/reset-password', { Email: email, Otp: otp, NewPassword: newPassword })
    return res.data
  },

  // Resend OTP -> POST /Auth/resend-otp
  resendOtp: async (email) => {
    const res = await apiClient.post('/Auth/resend-otp', email, {
      headers: { 'Content-Type': 'application/json' }
    })
    return res.data
  }
}

export default authApi
