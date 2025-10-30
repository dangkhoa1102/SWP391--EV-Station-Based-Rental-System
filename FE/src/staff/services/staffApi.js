import axios from 'axios'

const SWAGGER_ROOT = 'http://localhost:5054/api'

const apiClient = axios.create({
  baseURL: SWAGGER_ROOT,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000
})

apiClient.interceptors.request.use(cfg => {
  try {
    const t = localStorage.getItem('token')
    if (t && t !== 'null') {
      cfg.headers.Authorization = `Bearer ${t}`
    }
  } catch (e) {}
  return cfg
})

apiClient.interceptors.response.use(
  r => r,
  e => {
    try {
      const cfg = e?.config || {}
      const method = (cfg.method || 'GET').toUpperCase()
      const url = (cfg.baseURL || '') + (cfg.url || '')
      console.error(`🛑 API ${method} ${url} failed`, {
        status: e?.response?.status,
        data: e?.response?.data,
        params: cfg.params,
        body: cfg.data
      })
    } catch {}
    return Promise.reject(e)
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
    
    if (token) {
      localStorage.setItem('token', token)
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
      } catch (e) {
        console.error('❌ Error decoding JWT:', e)
      }
    }
    
    // Also check if userId is directly in the response payload
    if (payload.userId || payload.UserId || payload.id || payload.Id) {
      const directUserId = payload.userId || payload.UserId || payload.id || payload.Id
      console.log('👤 UserId from response payload:', directUserId)
      localStorage.setItem('userId', directUserId)
    }
    
    if (payload.user) localStorage.setItem('user', JSON.stringify(payload.user))
    return { raw: res.data, token, payload }
  },

  register: async (fullName, email, phoneNumber, password) => {
    const res = await apiClient.post('/Auth/Register', { FullName: fullName, Email: email, PhoneNumber: phoneNumber, Password: password, ConfirmPassword: password, Role: 'Customer' })
    return res.data
  },

  refreshToken: async () => { const res = await apiClient.post('/Auth/Refresh-Token'); return res.data },
  logout: async () => { const res = await apiClient.post('/Auth/Logout'); localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); localStorage.removeItem('userEmail'); return res.data },
  forgotPassword: async (email) => { const res = await apiClient.post('/Auth/forgot-password', { email }); return res.data },
  getMe: async () => { 
    const res = await apiClient.get('/Auth/Me');
    const data = res?.data?.data ?? res?.data ?? {};
    return data;
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
  patch: async (endpoint, body, opts) => (await apiClient.patch(endpoint, body, opts)).data,

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

  // REST-style car endpoints (integrated per provided API spec)
  listCars: async (opts = { page: 1, pageSize: 20, search: '' }) => {
    const params = {}
    if (opts.page) params.page = opts.page
    if (opts.pageSize) params.pageSize = opts.pageSize
    if (opts.search) params.search = opts.search
    const res = await apiClient.get('/car', { params })
    const body = res.data
    // unwrap {data} if present
    return body && typeof body === 'object' && 'data' in body ? body.data : body
  },
  getCarByIdRest: async (carId) => {
    const res = await apiClient.get(`/car/${encodeURIComponent(carId)}`)
    const body = res.data
    return body && typeof body === 'object' && 'data' in body ? body.data : body
  },
  getCarsByStation: async (stationId) => {
    const id = encodeURIComponent(stationId)
    const attempts = [
      `/car/station/${id}`,
      `/cars/station/${id}`,
      `/Car/Station/${id}`,
      `/Cars/Station/${id}`,
      `/vehicle/station/${id}`,
      `/vehicles/station/${id}`,
      `/Vehicle/Station/${id}`,
      `/Vehicles/Station/${id}`
    ]
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        if (e?.response?.status !== 404) throw e
      }
    }
    return []
  },
  getAvailableCars: async (stationId) => {
    if (stationId) return API.getCarsByStation(stationId)
    const res = await apiClient.get('/car/available')
    const body = res.data
    return body && typeof body === 'object' && 'data' in body ? body.data : body
  },
  createCar: async (payload) => {
    // Try a wide range of common endpoints used across variants
    const attempts = [
      // REST base resources
      '/car', '/cars', '/Car', '/Cars',
      // Action-style endpoints
      '/Car/Create', '/Cars/Create', '/Car/Add', '/Cars/Add',
      '/Car/Create-Car', '/Cars/Create-Car',
      // Alternate resource name
      '/vehicle', '/vehicles', '/Vehicle', '/Vehicles',
      '/Vehicle/Create', '/Vehicles/Create', '/Vehicle/Add', '/Vehicles/Add'
    ]
    const tried = []
    for (const url of attempts) {
      try {
        tried.push(url)
        const res = await apiClient.post(url, payload)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        if (e?.response?.status !== 404) throw e
        // else continue
      }
    }
    throw new Error(`Create car endpoint not found (tried ${tried.join(', ')})`)
  },
  updateCar: async (carId, updatePayload) => {
    const id = encodeURIComponent(carId)
    const attempts = [`/car/${id}`, `/cars/${id}`, `/Car/${id}`, `/Cars/${id}`, `/vehicle/${id}`, `/vehicles/${id}`, `/Vehicle/${id}`, `/Vehicles/${id}`]
    for (const url of attempts) {
      try {
        const res = await apiClient.put(url, updatePayload)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        if (e?.response?.status !== 404) throw e
      }
    }
    throw new Error('Update car endpoint not found (tried /car/{id}, /cars/{id}, /Car/{id})')
  },
  updateCarDescription: async (carId, description) => {
    const id = encodeURIComponent(carId)
    const attempts = [`/car/${id}`, `/cars/${id}`, `/Car/${id}`, `/Cars/${id}`, `/vehicle/${id}`, `/vehicles/${id}`, `/Vehicle/${id}`, `/Vehicles/${id}`]
    for (const url of attempts) {
      try {
        const res = await apiClient.put(url, { description })
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        if (e?.response?.status !== 404) throw e
      }
    }
    throw new Error('Update description endpoint not found')
  },
  deleteCar: async (carId) => {
    const id = encodeURIComponent(carId)
    const attempts = [`/car/${id}`, `/cars/${id}`, `/Car/${id}`, `/Cars/${id}`, `/vehicle/${id}`, `/vehicles/${id}`, `/Vehicle/${id}`, `/Vehicles/${id}`]
    for (const url of attempts) {
      try {
        const res = await apiClient.delete(url)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        if (e?.response?.status !== 404) throw e
      }
    }
    throw new Error('Delete car endpoint not found (tried /car/{id}, /cars/{id}, /Car/{id})')
  },
  updateBatteryLevel: async (carId, batteryLevel) => {
    const res = await apiClient.patch(`/car/${encodeURIComponent(carId)}/battery/${encodeURIComponent(batteryLevel)}`)
    const body = res.data
    return body && typeof body === 'object' && 'data' in body ? body.data : body
  },
  updateStatus: async (carId, status) => {
    const res = await apiClient.patch(`/car/${encodeURIComponent(carId)}/status/${encodeURIComponent(status)}`)
    const body = res.data
    return body && typeof body === 'object' && 'data' in body ? body.data : body
  },
  searchCars: async (term) => {
    const res = await apiClient.get(`/car/search/${encodeURIComponent(term)}`)
    const body = res.data
    return body && typeof body === 'object' && 'data' in body ? body.data : body
  },
  listStations: async () => {
    const res = await apiClient.get('/station')
    const body = res.data
    return body && typeof body === 'object' && 'data' in body ? body.data : body
  },
  getCarBattery: async (carId) => {
    const res = await apiClient.get(`/car/${encodeURIComponent(carId)}`)
    const body = res.data
    const car = body && typeof body === 'object' && 'data' in body ? body.data : body
    return car?.currentBatteryLevel ?? car?.CurrentBatteryLevel ?? null
  },
  getCarCapacity: async (carId) => {
    const res = await apiClient.get(`/car/${encodeURIComponent(carId)}`)
    const body = res.data
    const car = body && typeof body === 'object' && 'data' in body ? body.data : body
    // Try common field names for capacity
    return car?.batteryCapacity ?? car?.BatteryCapacity ?? car?.capacity ?? car?.capacityKWh ?? car?.batteryCapacityKWh ?? null
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
  // Station-scoped bookings with multiple backend fallbacks
  getBookingsByStation: async (stationId) => {
    if (!stationId) return []
    const id = encodeURIComponent(stationId)
    const attempts = [
      // Legacy
      { url: `/Bookings/Get-By-Station/${id}` },
      { url: '/Bookings/Get-By-Station', opts: { params: { stationId } } },
      { url: '/Bookings/Get-All', opts: { params: { stationId } } },
      { url: `/Stations/${id}/Bookings` },
      // REST style
      { url: `/booking/station/${id}` },
      { url: '/booking', opts: { params: { stationId } } },
      { url: '/booking', opts: { params: { station: stationId } } }
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient.get(a.url, a.opts)
        const body = res.data
        if (Array.isArray(body)) return body
        if (Array.isArray(body?.data?.data)) return body.data.data
        if (Array.isArray(body?.data?.items)) return body.data.items
        if (Array.isArray(body?.data)) return body.data
        if (Array.isArray(body?.items)) return body.items
        if (Array.isArray(body?.bookings)) return body.bookings
        if (Array.isArray(body?.results)) return body.results
        if (body && (body.id || body.bookingId || body.BookingId)) return [body]
      } catch (e) {
        // try next
      }
    }
    return []
  },

  listBookings: async (opts = { page: 1, pageSize: 100 }) => {
    const attempts = [
      { url: '/Bookings/Get-All', opts: { params: { pageNumber: opts.page, pageSize: opts.pageSize } } },
      { url: '/booking', opts: { params: { page: opts.page, pageSize: opts.pageSize } } }
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient.get(a.url, a.opts)
        const body = res.data
        if (Array.isArray(body)) return body
        if (Array.isArray(body?.data?.data)) return body.data.data
        if (Array.isArray(body?.data?.items)) return body.data.items
        if (Array.isArray(body?.data)) return body.data
        if (Array.isArray(body?.items)) return body.items
        if (Array.isArray(body?.bookings)) return body.bookings
        if (Array.isArray(body?.results)) return body.results
        if (body && (body.id || body.bookingId || body.BookingId)) return [body]
      } catch (e) {
        // continue
      }
    }
    return []
  },
  createBooking: async (bookingData, userId) => {
    try {
      console.log('📝 Creating booking for user:', userId)
      console.log('📝 Booking data:', bookingData)
      
      // Send userId in both query param AND body to support different API designs
      const res = await apiClient.post(`/Bookings/Create?userId=${encodeURIComponent(userId)}`, {
        ...bookingData,
        userId: userId // Also include userId in body
      })
      console.log('✅ Booking created:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error creating booking:', e.response?.data || e.message)
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
      console.log('📋 Fetching bookings for user:', userId)
      const res = await apiClient.get(`/Bookings/Get-By-User/${encodeURIComponent(userId)}`)
      console.log('✅ User bookings response:', res.data)
      const responseData = res.data
      
      if (Array.isArray(responseData)) return responseData
      if (responseData.data && Array.isArray(responseData.data)) return responseData.data
      if (responseData.items && Array.isArray(responseData.items)) return responseData.items
      
      return []
    } catch (e) {
      console.error('❌ Error fetching user bookings:', e.response?.data || e.message)
      return []
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
