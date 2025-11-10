import axios from 'axios'

const SWAGGER_ROOT = 'http://localhost:5054/api'

const apiClient = axios.create({
  baseURL: SWAGGER_ROOT,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000
})

// Request interceptor - add token to all requests
apiClient.interceptors.request.use(cfg => {
  try {
    const t = localStorage.getItem('token')
    if (t && t !== 'null') {
      cfg.headers.Authorization = `Bearer ${t}`
    }
  } catch (e) {}
  return cfg
}, error => Promise.reject(error))

// Response interceptor - handle token refresh on 401
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        console.log('🔄 Token expired, refreshing...')
        
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Call refresh token API
        const response = await axios.post(`${SWAGGER_ROOT}/Auth/Refresh-Token`, {
          refreshToken: refreshToken
        })

        const newToken = response.data?.data?.token || response.data?.token || response.data?.accessToken
        const newRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken

        if (newToken) {
          console.log('✅ Token refreshed successfully')
          localStorage.setItem('token', newToken)
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken)
          }
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          
          // Process queued requests
          processQueue(null, newToken)
          
          isRefreshing = false
          
          // Retry the original request
          return apiClient(originalRequest)
        } else {
          throw new Error('No token in refresh response')
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError)
        processQueue(refreshError, null)
        isRefreshing = false
        
        // Clear tokens and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('userId')
        
        // Redirect to home/login page
        window.location.href = '/'
        
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

const API = {
  baseURL: SWAGGER_ROOT,
  _client: apiClient,

  login: async (email, password) => {
    const res = await apiClient.post('/Auth/Login', { Email: email, Password: password })
    console.log('🔐 Login response:', res.data)
    const payload = res.data?.data || res.data || {}
    const token = payload.token || payload.accessToken || res.data?.token
    const refreshToken = payload.refreshToken || res.data?.refreshToken
    
    if (token) {
      localStorage.setItem('token', token)
      console.log('✅ Access token saved')
      try {
        const decoded = API.decodeJwt(token)
        console.log('🔓 Decoded JWT:', decoded)
        
        // The userId GUID is in the nameidentifier claim (standard ASP.NET identity claim)
        const userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
                    || decoded.nameidentifier 
                    || decoded.UserId 
                    || decoded.userId 
                    || decoded.uid 
                    || decoded.nameid 
                    || decoded.sub 
                    || decoded.id 
                    || decoded.Id
        console.log('👤 Extracted userId:', userId)
        
        if (userId) {
          localStorage.setItem('userId', userId)
        } else {
          console.warn('⚠️ Could not find userId in JWT token')
        }
        
        // Extract role from JWT
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
                  || decoded.role 
                  || decoded.Role
        if (role) {
          localStorage.setItem('userRole', role)
          console.log('👥 User role saved:', role)
        }
      } catch (e) {
        console.error('❌ Error decoding JWT:', e)
      }
    }
    
    // Save refresh token if available
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
      console.log('✅ Refresh token saved')
    } else {
      console.warn('⚠️ No refresh token in response')
    }
    
    // Also check if userId is directly in the response payload
    if (payload.userId || payload.UserId || payload.id || payload.Id) {
      const directUserId = payload.userId || payload.UserId || payload.id || payload.Id
      console.log('👤 UserId from response payload:', directUserId)
      localStorage.setItem('userId', directUserId)
    }
    
    if (payload.user) localStorage.setItem('user', JSON.stringify(payload.user))
    
    // For Staff role, fetch additional info including stationId from /Users/Get-My-Profile
    try {
      const userRole = localStorage.getItem('userRole')
      console.log('🔍 Checking if user is Staff - userRole:', userRole)
      // Check for various staff role names
      const isStaff = userRole && (
        userRole.includes('Staff') || 
        userRole.includes('staff') || 
        userRole === 'StationManager' || 
        userRole.includes('Manager')
      )
      if (isStaff) {
        console.log('📍 Staff user detected, fetching profile with station info...')
        const profileData = await API.getMyProfile()
        console.log('👨‍💼 Staff profile data from getMyProfile():', profileData)
        
        const stationId = profileData?.stationId || profileData?.StationId
        console.log('🔎 Extracted stationId from profile:', stationId)
        if (stationId) {
          localStorage.setItem('stationId', stationId)
          console.log('✅ Station ID saved to localStorage:', stationId)
          console.log('📋 Verify - localStorage.getItem("stationId"):', localStorage.getItem('stationId'))
        } else {
          console.warn('⚠️ No station ID found in profile for staff user. Full profile:', profileData)
        }
      } else {
        console.log('ℹ️ User is not Staff/StationManager, skipping station ID save')
      }
    } catch (e) {
      console.error('❌ Error fetching staff profile:', e)
      console.error('Stack:', e.stack)
    }
    
    return { raw: res.data, token, refreshToken, payload }
  },

  register: async (fullName, email, phoneNumber, password) => {
    const res = await apiClient.post('/Auth/Register', { FullName: fullName, Email: email, PhoneNumber: phoneNumber, Password: password, ConfirmPassword: password, Role: 'Customer' })
    return res.data
  },

  refreshToken: async () => { const res = await apiClient.post('/Auth/Refresh-Token'); return res.data },
  logout: async () => { const res = await apiClient.post('/Auth/Logout'); localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); localStorage.removeItem('userEmail'); localStorage.removeItem('stationId'); localStorage.removeItem('userRole'); return res.data },
  forgotPassword: async (email) => { const res = await apiClient.post('/Auth/forgot-password', { email }); return res.data },
  getMe: async () => { 
    const res = await apiClient.get('/Auth/Me')
    console.log('📡 Raw /Auth/Me response:', res.data)
    
    // Handle nested response structure
    // If response has { data: { ...profileData } } or direct profileData
    const data = res.data?.data || res.data || {}
    console.log('📄 Extracted /Auth/Me data:', data)
    
    return data
  },

  getMyProfile: async () => {
    const res = await apiClient.get('/Users/Get-My-Profile')
    const data = res.data
    if (data.data && typeof data.data === 'object') return data.data
    return data
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await apiClient.post('/Users/Change-Password', { currentPassword, newPassword })
    return res.data
  },

  // simplified: expose generic wrappers
  get: async (endpoint, opts) => (await apiClient.get(endpoint, opts)).data,
  post: async (endpoint, body, opts) => (await apiClient.post(endpoint, body, opts)).data,
  put: async (endpoint, body, opts) => (await apiClient.put(endpoint, body, opts)).data,

  updateUserAvatar: async (userId, avatarUrl) => {
    const res = await apiClient.post(`/Users/${encodeURIComponent(userId)}/avatar`, { avatarUrl })
    return res.data?.data || res.data || {}
  },

  // Stations
  getAllStations: async (pageNumber = 1, pageSize = 100) => {
    try {
      console.log('📍 Fetching stations from:', `${SWAGGER_ROOT}/Stations/Get-All`)
      const res = await apiClient.get('/Stations/Get-All', { params: { pageNumber, pageSize } })
      console.log('✅ Stations response:', res.data)
      const responseData = res.data
      
      // Handle different response formats
      // Format 1: Direct array
      if (Array.isArray(responseData)) {
        console.log('✅ Returning stations array:', responseData.length, 'items')
        return responseData
      }
      
      // Format 2: Paginated response with data.data.data (nested)
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        console.log('✅ Returning stations from data.data.data:', responseData.data.data.length, 'items')
        return responseData.data.data
      }
      
      // Format 3: Paginated response with data.data.items
      if (responseData.data && responseData.data.items && Array.isArray(responseData.data.items)) {
        console.log('✅ Returning stations from data.data.items:', responseData.data.items.length, 'items')
        return responseData.data.items
      }
      
      // Format 4: Direct data.data array
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('✅ Returning stations from data.data:', responseData.data.length, 'items')
        return responseData.data
      }
      
      // Format 5: Direct data.items array
      if (responseData.items && Array.isArray(responseData.items)) {
        console.log('✅ Returning stations from data.items:', responseData.items.length, 'items')
        return responseData.items
      }
      
      console.warn('⚠️ No stations found in response')
      return []
    } catch (e) {
      console.error('❌ Error fetching stations:', e.response?.data || e.message)
      return []
    }
  },

  // Cars
  getAllCars: async (pageNumber = 1, pageSize = 100) => {
    try {
      console.log('🚗 Fetching cars from:', `${SWAGGER_ROOT}/Cars/Get-All`)
      const res = await apiClient.get('/Cars/Get-All', { params: { pageNumber, pageSize } })
      console.log('✅ Cars response:', res.data)
      const responseData = res.data
      
      // Handle different response formats
      // Format 1: Direct array
      if (Array.isArray(responseData)) {
        console.log('✅ Returning cars array:', responseData.length, 'items')
        return responseData
      }
      
      // Format 2: Paginated response with data.data.data (nested)
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        console.log('✅ Returning cars from data.data.data:', responseData.data.data.length, 'items')
        return responseData.data.data
      }
      
      // Format 3: Paginated response with data.data.items
      if (responseData.data && responseData.data.items && Array.isArray(responseData.data.items)) {
        console.log('✅ Returning cars from data.data.items:', responseData.data.items.length, 'items')
        return responseData.data.items
      }
      
      // Format 4: Direct data.data array
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('✅ Returning cars from data.data:', responseData.data.length, 'items')
        return responseData.data
      }
      
      // Format 5: Direct data.items array
      if (responseData.items && Array.isArray(responseData.items)) {
        console.log('✅ Returning cars from data.items:', responseData.items.length, 'items')
        return responseData.items
      }
      
      console.warn('⚠️ No cars found in response')
      return []
    } catch (e) {
      console.error('❌ Error fetching cars:', e.response?.data || e.message)
      return []
    }
  },

  getAvailableCarsByStation: async (stationId) => {
    try {
      console.log('🚗 Fetching available cars for station:', stationId)
      const res = await apiClient.get(`/Cars/Get-Available-By-Station/${encodeURIComponent(stationId)}`)
      console.log('✅ Available cars response:', res.data)
      const responseData = res.data
      
      // Handle different response formats (same logic as getAllCars)
      if (Array.isArray(responseData)) {
        console.log('✅ Returning available cars array:', responseData.length, 'items')
        return responseData
      }
      
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        console.log('✅ Returning available cars from data.data.data:', responseData.data.data.length, 'items')
        return responseData.data.data
      }
      
      if (responseData.data && responseData.data.items && Array.isArray(responseData.data.items)) {
        console.log('✅ Returning available cars from data.data.items:', responseData.data.items.length, 'items')
        return responseData.data.items
      }
      
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('✅ Returning available cars from data.data:', responseData.data.length, 'items')
        return responseData.data
      }
      
      if (responseData.items && Array.isArray(responseData.items)) {
        console.log('✅ Returning available cars from data.items:', responseData.items.length, 'items')
        return responseData.items
      }
      
      console.warn('⚠️ No available cars found in response')
      return []
    } catch (e) {
      console.error('❌ Error fetching available cars:', e.response?.data || e.message)
      throw e
    }
  },

  getCarById: async (carId) => {
    try {
      console.log('🚗 Fetching car details for ID:', carId)
      const res = await apiClient.get(`/Cars/Get-By-${encodeURIComponent(carId)}`)
      console.log('✅ Car detail response:', res.data)
      const responseData = res.data
      
      // Handle different response formats
      // Format 1: Direct object with id
      if (responseData.id || responseData.Id) {
        console.log('✅ Returning car object directly')
        return responseData
      }
      
      // Format 2: Nested in data.data
      if (responseData.data && responseData.data.data && (responseData.data.data.id || responseData.data.data.Id)) {
        console.log('✅ Returning car from data.data.data')
        return responseData.data.data
      }
      
      // Format 3: Nested in data
      if (responseData.data && (responseData.data.id || responseData.data.Id)) {
        console.log('✅ Returning car from data.data')
        return responseData.data
      }
      
      console.warn('⚠️ No car found in response')
      return null
    } catch (e) {
      console.error('❌ Error fetching car details:', e.response?.data || e.message)
      throw e
    }
  },

  // Bookings
  createBooking: async (bookingData, userId) => {
    try {
      console.log('📝 Creating booking for user:', userId)
      console.log('📝 Booking data:', bookingData)
      
      // Backend expects only these fields according to Swagger
      // Field name is 'stationId' not 'pickupStationId' or 'returnStationId'
      const payload = {
        carId: bookingData.carId,
        stationId: bookingData.pickupStationId || bookingData.returnStationId || bookingData.stationId,
        pickupDateTime: bookingData.pickupDateTime,
        expectedReturnDateTime: bookingData.expectedReturnDateTime
      }
      
      console.log('📤 Sending payload:', payload)
      
      const res = await apiClient.post(`/Bookings/Create-With-Deposit?userId=${encodeURIComponent(userId)}`, payload)
      console.log('✅ Booking created:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error creating booking:', e.response?.data || e.message)
      
      // Log detailed validation errors if available
      if (e.response?.data?.errors) {
        console.error('📋 Validation errors:', e.response.data.errors)
      }
      
      throw e
    }
  },

  confirmBooking: async (bookingId, paymentMethod, paymentTransactionId = '') => {
    try {
      console.log('✅ Confirming booking:', bookingId)
      const payload = {
        bookingId: bookingId,
        paymentMethod: paymentMethod,
        paymentTransactionId: paymentTransactionId
      }
      const res = await apiClient.post('/Bookings/Confirm', payload)
      console.log('✅ Booking confirmed:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error confirming booking:', e.response?.data || e.message)
      throw e
    }
  },

  completeBooking: async (bookingId) => {
    try {
      console.log('✅ Completing booking:', bookingId)
      const res = await apiClient.post(`/Bookings/Complete-By-${encodeURIComponent(bookingId)}`)
      console.log('✅ Booking completed:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error completing booking:', e.response?.data || e.message)
      throw e
    }
  },

  getUserBookings: async (userId) => {
    try {
      console.log('📋 Fetching bookings for current user from:', `${SWAGGER_ROOT}/Bookings/My-Bookings`)
      const res = await apiClient.get('/Bookings/My-Bookings')
      console.log('✅ Raw /Bookings/My-Bookings response:', res.data)
      const responseData = res.data || {}

      // Common response shapes handled below
      // 1) Direct array: [ ... ]
      if (Array.isArray(responseData)) {
        console.log('ℹ️ Returning bookings (direct array), count:', responseData.length)
        return responseData
      }

      // 2) { data: [ ... ] }
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('ℹ️ Returning bookings from response.data, count:', responseData.data.length)
        return responseData.data
      }

      // 3) { data: { data: [ ... ] } } nested
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        console.log('ℹ️ Returning bookings from response.data.data, count:', responseData.data.data.length)
        return responseData.data.data
      }

      // 4) { data: { items: [ ... ] } }
      if (responseData.data && responseData.data.items && Array.isArray(responseData.data.items)) {
        console.log('ℹ️ Returning bookings from response.data.items, count:', responseData.data.items.length)
        return responseData.data.items
      }

      // 5) { items: [ ... ] }
      if (responseData.items && Array.isArray(responseData.items)) {
        console.log('ℹ️ Returning bookings from response.items, count:', responseData.items.length)
        return responseData.items
      }

      // 6) Some backends return an object keyed by 'bookings' or similar
      if (responseData.bookings && Array.isArray(responseData.bookings)) {
        console.log('ℹ️ Returning bookings from response.bookings, count:', responseData.bookings.length)
        return responseData.bookings
      }

      // If it's a single booking object, return it as array
      if (responseData && (responseData.id || responseData.bookingId || responseData.bookingStatus)) {
        console.log('ℹ️ Response looks like a single booking object, wrapping in array')
        return [responseData]
      }

      console.warn('⚠️ No bookings array found in /Bookings/My-Bookings response; returning empty array')
      return []
    } catch (e) {
      console.error('❌ Error fetching user bookings:', e.response?.data || e.message)
      // If unauthorized, rethrow so caller can handle (e.g., redirect to login)
      if (e.response && e.response.status === 401) {
        throw e
      }
      // For other errors return empty list to avoid breaking UI
      return []
    }
  },

  cancelBooking: async (bookingId, userId) => {
    try {
      console.log('🚫 Cancelling booking:', bookingId)
      const res = await apiClient.post(`/Bookings/Cancel-By-${encodeURIComponent(bookingId)}`, null, {
        params: { userId }
      })
      console.log('✅ Booking cancelled:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error cancelling booking:', e.response?.data || e.message)
      throw e
    }
  },

  // Feedback APIs
  createFeedback: async (userId, feedbackData) => {
    try {
      console.log('📝 Creating feedback for user:', userId)
      console.log('📝 Feedback data:', feedbackData)
      const res = await apiClient.post(`/Feedback/Create-By-User/${encodeURIComponent(userId)}`, feedbackData)
      console.log('✅ Feedback created:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error creating feedback:', e.response?.data || e.message)
      throw e
    }
  },

  updateFeedback: async (feedbackId, userId, feedbackData) => {
    try {
      console.log('✏️ Updating feedback:', feedbackId)
      console.log('📝 Updated data:', feedbackData)
      const res = await apiClient.put(`/Feedback/Update-By-${encodeURIComponent(feedbackId)}`, feedbackData, {
        params: { userId }
      })
      console.log('✅ Feedback updated:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error updating feedback:', e.response?.data || e.message)
      throw e
    }
  },

  // Upload CCCD documents (both front and back)
  uploadCCCD: async (frontFile, backFile) => {
    try {
      console.log('📤 Uploading CCCD documents')
      const formData = new FormData()
      
      if (frontFile) {
        formData.append('fileFront', frontFile, frontFile.name)
        console.log('📄 Added fileFront:', frontFile.name, 'size:', frontFile.size, 'type:', frontFile.type)
      }
      if (backFile) {
        formData.append('fileBack', backFile, backFile.name)
        console.log('📄 Added fileBack:', backFile.name, 'size:', backFile.size, 'type:', backFile.type)
      }
      
      // Log FormData contents
      for (let pair of formData.entries()) {
        console.log('📦 FormData entry:', pair[0], pair[1])
      }
      
      const res = await apiClient.post('/Auth/cccd', formData, {
        headers: {
          // Remove Content-Type to let browser set it with proper boundary
          'Content-Type': undefined
        },
        // Increase timeout for large files
        timeout: 30000
      })
      
      console.log('✅ CCCD uploaded successfully:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ CCCD upload error:', e)
      console.error('❌ Error response:', e.response?.data)
      console.error('❌ Error status:', e.response?.status)
      throw e
    }
  },

  // Upload GPLX documents (both front and back)
  uploadGPLX: async (frontFile, backFile) => {
    try {
      console.log('📤 Uploading GPLX documents')
      const formData = new FormData()
      
      if (frontFile) {
        formData.append('fileFront', frontFile, frontFile.name)
        console.log('📄 Added fileFront:', frontFile.name, 'size:', frontFile.size, 'type:', frontFile.type)
      }
      if (backFile) {
        formData.append('fileBack', backFile, backFile.name)
        console.log('📄 Added fileBack:', backFile.name, 'size:', backFile.size, 'type:', backFile.type)
      }
      
      // Log FormData contents
      for (let pair of formData.entries()) {
        console.log('📦 FormData entry:', pair[0], pair[1])
      }
      
      const res = await apiClient.post('/Auth/gplx', formData, {
        headers: {
          // Remove Content-Type to let browser set it with proper boundary
          'Content-Type': undefined
        },
        // Increase timeout for large files
        timeout: 30000
      })
      
      console.log('✅ GPLX uploaded successfully:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ GPLX upload error:', e)
      console.error('❌ Error response:', e.response?.data)
      console.error('❌ Error status:', e.response?.status)
      throw e
    }
  },

  // Old method - deprecated, keeping for compatibility
  uploadUserDocument: async (type, file) => {
    try {
      console.log(`📤 Uploading ${type} document file:`, file.name)
      
      // Create FormData
      const formData = new FormData()
      
      // Determine field name and endpoint based on type
      if (type.startsWith('cccd')) {
        // CCCD endpoint: /Auth/cccd with fileFront or fileBack
        if (type === 'cccdFront') {
          formData.append('fileFront', file)
          // Don't send fileBack if not uploading it
        } else {
          formData.append('fileBack', file)
          // Don't send fileFront if not uploading it
        }
        
        console.log(`📄 Sending to /Auth/cccd`)
        console.log('📦 FormData:', type === 'cccdFront' ? 'fileFront' : 'fileBack', file.name)
        
        const res = await apiClient.post('/Auth/cccd', formData)
        console.log(`✅ CCCD uploaded successfully:`, res.data)
        return res.data?.data || res.data || {}
      } else {
        // GPLX endpoint: /Auth/gplx with fileFront or fileBack
        if (type === 'licenseFront') {
          formData.append('fileFront', file)
        } else {
          formData.append('fileBack', file)
        }
        
        console.log(`📄 Sending to /Auth/gplx`)
        console.log('📦 FormData:', type === 'licenseFront' ? 'fileFront' : 'fileBack', file.name)
        
        const res = await apiClient.post('/Auth/gplx', formData)
        console.log(`✅ GPLX uploaded successfully:`, res.data)
        return res.data?.data || res.data || {}
      }
    } catch (e) {
      console.error(`❌ Error uploading ${type}:`, e)
      console.error(`❌ Response data:`, e.response?.data)
      console.error(`❌ Response status:`, e.response?.status)
      throw e
    }
  },

  // ==================== PAYMENT APIs ====================
  
  // Create payment for deposit, rental, or checkout
  // PaymentType: 0 = Deposit, 1 = Rental, 2 = Checkout (penalty/damage)
  createPayment: async (bookingId, paymentType = 0, description = 'Payment', extraAmount = 0) => {
    try {
      console.log('💳 Creating payment for booking:', bookingId, '| Type:', paymentType, '| Extra amount:', extraAmount)
      
      const payload = {
        bookingId: bookingId,
        paymentType: paymentType,
        description: description
      }
      
      // Add extraAmount only if it's provided (for checkout with damage fees)
      if (extraAmount > 0) {
        payload.extraAmount = extraAmount
      }
      
      const res = await apiClient.post('/Payment/create', payload)
      console.log('✅ Payment created:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error creating payment:', e.response?.data || e.message)
      throw e
    }
  },

  // Sync payment status after PayOS redirect
  syncPayment: async (bookingId) => {
    try {
      console.log('🔄 Syncing payment for booking:', bookingId)
      const res = await apiClient.post(`/Payment/sync/${encodeURIComponent(bookingId)}`)
      console.log('✅ Payment synced:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error syncing payment:', e.response?.data || e.message)
      throw e
    }
  },

  // Get booking details by ID (used to check status after payment)
  getBookingById: async (bookingId) => {
    try {
      console.log('📋 Fetching booking details for ID:', bookingId)
      const res = await apiClient.get(`/Bookings/Get-By-${encodeURIComponent(bookingId)}`)
      console.log('✅ Booking details:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error fetching booking details:', e.response?.data || e.message)
      throw e
    }
  },

  // Check if contract is confirmed (used before creating payment for rental/checkout)
  isContractConfirmed: async (bookingId) => {
    try {
      console.log('📄 Checking if contract is confirmed for booking:', bookingId)
      const res = await apiClient.get(`/Contracts/Get-By-Booking/${encodeURIComponent(bookingId)}`)
      const contract = res.data?.data || res.data || {}
      const isConfirmed = contract.isConfirmed === true || contract.IsConfirmed === true
      console.log('📄 Contract confirmed status:', isConfirmed)
      return isConfirmed
    } catch (e) {
      console.error('❌ Error checking contract:', e.response?.data || e.message)
      return false
    }
  },

  // ==================== CONTRACT APIs ====================
  
  // Create contract for booking with full DTO
  // Send complete TaoHopDongDto with all required fields from user profile, booking, and car data
  createContract: async (bookingId, userId, contractDto) => {
    try {
      console.log('📄 Creating contract for booking:', bookingId)
      console.log('  Sending full contract DTO:', contractDto)
      
      const res = await apiClient.post(
        `/Contracts/hopdong/tao?bookingId=${encodeURIComponent(bookingId)}&renterId=${encodeURIComponent(userId)}`,
        contractDto
      )
      
      console.log('✅ Contract created:', res.data)
      // Return full response so contractId can be extracted from .data field
      return res.data
    } catch (e) {
      console.error('❌ Error creating contract:', e.response?.data || e.message)
      throw e
    }
  },

  // Send contract email to user
  sendContractEmail: async (contractId, email) => {
    try {
      console.log('📧 Sending contract email')
      console.log('   Contract ID:', contractId)
      console.log('   Email:', email)
      
      const res = await apiClient.post(
        `/Contracts/hopdong/${encodeURIComponent(contractId)}/gui-email`,
        { email: email }
      )
      
      console.log('✅ Email sent successfully:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error sending email:', e.response?.data || e.message)
      throw e
    }
  }
}

API.decodeJwt = (token) => {
  const parts = token.split('.'); if (parts.length < 2) throw new Error('Invalid JWT')
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
  return JSON.parse(json)
}

export default API
