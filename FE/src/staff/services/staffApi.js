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
    const body = res.data
    const raw = body && typeof body === 'object' && 'data' in body ? body.data : body
    const profile = raw && typeof raw === 'object' ? { ...raw } : (raw || {})
    // Normalize: role, and inject userName from JWT claims if backend omits it
    try {
      if (!profile.role && profile.userRole) profile.role = profile.userRole
      if (!profile.userName && !profile.username) {
        const t = localStorage.getItem('token')
        if (t) {
          const claims = API.decodeJwt(t)
          const uname = claims?.preferred_username || claims?.unique_name || claims?.userName || claims?.username || claims?.name
          if (uname) profile.userName = uname
        }
      }
    } catch {}
    return profile
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await apiClient.post('/Users/Change-Password', { currentPassword, newPassword })
    return res.data
  },

  // Update My Profile (generic fields)
  updateMyProfile: async (updatePayload) => {
    // Primary endpoint
    const attempts = [
      { method: 'put', url: '/Users/Update-My-Profile', body: updatePayload },
      // Common alternates seen across codebases
      { method: 'put', url: '/users/Update-My-Profile', body: updatePayload },
      { method: 'put', url: '/Users/Update', body: updatePayload },
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient[a.method](a.url, a.body)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Update-My-Profile endpoint not found')
  },

  // Best-effort username update. Backend must accept userName/username in its DTO
  updateUsername: async (newUsername) => {
    const payloads = [
      { userName: newUsername },
      { username: newUsername },
    ]
    const urls = [
      '/Users/Update-My-Profile',
      '/users/Update-My-Profile',
      '/Users/Update-Username',
      '/Users/Update-UserName',
      '/Users/Change-Username',
      '/Users/Change-UserName',
      '/Auth/Update-UserName',
    ]
    const tried = []
    for (const url of urls) {
      for (const body of payloads) {
        try {
          tried.push(`PUT ${url} ${Object.keys(body)[0]}`)
          const res = await apiClient.put(url, body)
          const data = res.data
          return data && typeof data === 'object' && 'data' in data ? data.data : data
        } catch (e) {
          const code = e?.response?.status
          if (code !== 404 && code !== 405) throw e
        }
      }
    }
    throw new Error(`Username update endpoint not found (tried ${tried.join(' | ')})`)
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
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
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
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
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
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Update description endpoint not found')
  },
  deleteCar: async (carId) => {
    const id = encodeURIComponent(carId)
    const resources = ['car','cars','Car','Cars','vehicle','vehicles','Vehicle','Vehicles']
    const tried = []
    // 1) RESTful DELETE /{resource}/{id}
    for (const r of resources) {
      const url = `/${r}/${id}`
      try {
        tried.push(`DELETE ${url}`)
        const res = await apiClient.delete(url)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    // 2) Action routes with path param: POST /{resource}/Delete|Remove/{id}
    for (const r of resources) {
      for (const action of ['Delete','Remove']) {
        const url = `/${r}/${action}/${id}`
        try {
          tried.push(`POST ${url}`)
          const res = await apiClient.post(url)
          const body = res.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code !== 404 && code !== 405) throw e
        }
      }
    }
    // 3) Action routes with body: POST /{resource}/Delete|Remove  { id | carId | CarId }
    for (const r of resources) {
      for (const action of ['Delete','Remove']) {
        for (const key of ['id','carId','CarId']) {
          const url = `/${r}/${action}`
          try {
            tried.push(`POST ${url} body:{${key}}`)
            const res = await apiClient.post(url, { [key]: carId })
            const body = res.data
            return body && typeof body === 'object' && 'data' in body ? body.data : body
          } catch (e) {
            const code = e?.response?.status
            if (code !== 404 && code !== 405) throw e
          }
        }
      }
    }
    // 4) Action routes with explicit suffix: POST /{resource}/Delete-By-Id/{id} and query form
    for (const r of resources) {
      for (const label of ['Delete-By-Id','Remove-By-Id']) {
        const url1 = `/${r}/${label}/${id}`
        try {
          tried.push(`POST ${url1}`)
          const res = await apiClient.post(url1)
          const body = res.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code !== 404 && code !== 405) throw e
        }
        const url2 = `/${r}/${label}`
        try {
          tried.push(`POST ${url2}?id=`)
          const res = await apiClient.post(url2, null, { params: { id: carId } })
          const body = res.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code !== 404 && code !== 405) throw e
        }
      }
    }
    // 5) Action routes with hyphen form used elsewhere: POST /{resource}/Delete-By-{id} and Remove-By-
    for (const r of resources) {
      for (const label of ['Delete-By','Remove-By']) {
        const url3 = `/${r}/${label}-${id}`
        try {
          tried.push(`POST ${url3}`)
          const res = await apiClient.post(url3)
          const body = res.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code !== 404 && code !== 405) throw e
        }
      }
    }
    throw new Error(`Delete car endpoint not found (tried ${tried.join(' | ')})`)
  },
  updateBatteryLevel: async (carId, batteryLevel) => {
    const id = encodeURIComponent(carId)
    const pct = encodeURIComponent(batteryLevel)
    const tried = []
    const attempts = [
      { method: 'patch', url: `/car/${id}/battery/${pct}` },
      { method: 'patch', url: `/cars/${id}/battery/${pct}` },
      { method: 'put',   url: `/car/${id}/battery`, body: { batteryLevel, currentBatteryLevel: batteryLevel } },
      { method: 'put',   url: `/cars/${id}/battery`, body: { batteryLevel, currentBatteryLevel: batteryLevel } },
      { method: 'post',  url: `/car/Update-Battery/${id}/${pct}` },
      { method: 'post',  url: `/cars/Update-Battery/${id}/${pct}` },
      { method: 'post',  url: `/car/Update-Battery`, body: { id: carId, batteryLevel, currentBatteryLevel: batteryLevel } },
      { method: 'post',  url: `/cars/Update-Battery`, body: { id: carId, batteryLevel, currentBatteryLevel: batteryLevel } },
    ]
    for (const a of attempts) {
      try {
        tried.push(`${a.method.toUpperCase()} ${a.url}`)
        const res = await apiClient[a.method](a.url, a.body)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    throw new Error(`Update battery endpoint not found (tried ${tried.join(' | ')})`)
  },
  updateStatus: async (carId, status) => {
    const id = encodeURIComponent(carId)
    const st = encodeURIComponent(status)
    const tried = []
    const attempts = [
      { method: 'patch', url: `/car/${id}/status/${st}` },
      { method: 'patch', url: `/cars/${id}/status/${st}` },
      { method: 'put',   url: `/car/${id}/status`, body: { status } },
      { method: 'put',   url: `/cars/${id}/status`, body: { status } },
      { method: 'post',  url: `/car/Update-Status/${id}/${st}` },
      { method: 'post',  url: `/cars/Update-Status/${id}/${st}` },
      { method: 'post',  url: `/car/Update-Status`, body: { id: carId, status } },
      { method: 'post',  url: `/cars/Update-Status`, body: { id: carId, status } },
    ]
    for (const a of attempts) {
      try {
        tried.push(`${a.method.toUpperCase()} ${a.url}`)
        const res = await apiClient[a.method](a.url, a.body)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    throw new Error(`Update status endpoint not found (tried ${tried.join(' | ')})`)
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
  ,

  // Fetch user details by ID (used to resolve username for bookings)
  getUserById: async (userId) => {
    const id = encodeURIComponent(userId)
    const attempts = [
      `/Users/Get-By-${id}`,
      `/Users/Get-By-Id/${id}`,
      `/Users/${id}`,
      `/users/${id}`,
      `/User/${id}`,
      `/Users/Details/${id}`,
      // Querystring variants
      `/Users/Get-By-Id`,
      `/users/Get-By-Id`,
      `/Users/Get-By`,
      `/users/Get-By`,
    ]
    for (const url of attempts) {
      try {
        const isQueryStyle = url.endsWith('Get-By-Id') || url.endsWith('Get-By')
        const res = await apiClient.get(url, isQueryStyle ? { params: { id: userId, userId } } : undefined)
        const body = res.data
        // Unwrap common shapes
        const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
        if (!unwrapped) continue
        // If result is an array (e.g., search), pick the exact id
        if (Array.isArray(unwrapped)) {
          const found = unwrapped.find(u => (u.id || u.Id || u.userId || u.UserId) === userId)
          if (found) return found
          continue
        }
        return unwrapped
      } catch (e) {
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('User lookup endpoint not found')
  },

  // Get current user's bookings (prefers /bookings/me; falls back via profile/JWT)
  getMyBookings: async () => {
    const attempts = [
      { url: '/bookings/me' },
      { url: '/Bookings/me' },
      { url: '/booking/me' }
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient.get(a.url)
        const body = res.data
        if (Array.isArray(body)) return body
        if (Array.isArray(body?.data?.data)) return body.data.data
        if (Array.isArray(body?.data?.items)) return body.data.items
        if (Array.isArray(body?.data)) return body.data
        if (Array.isArray(body?.items)) return body.items
        if (Array.isArray(body?.bookings)) return body.bookings
        if (Array.isArray(body?.results)) return body.results
      } catch (e) {
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    // Fallback: resolve userId then fetch by user
    let userId = null
    try {
      const me = await API.getMyProfile()
      userId = me?.id || me?.userId || me?.UserId
    } catch {}
    if (!userId) {
      try {
        const t = localStorage.getItem('token')
        if (t) {
          const d = API.decodeJwt(t)
          userId = d['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || d.sub || d.userId || d.UserId || d.id || d.Id
        }
      } catch {}
    }
    if (!userId) throw new Error('Unable to determine current user id to load bookings')
    return await API.getBookingsForUser(userId)
  },

  // Get bookings for a specific user (admin/staff)
  getBookingsForUser: async (userId) => {
    const id = encodeURIComponent(userId)
    const attempts = [
      `/bookings/user/${id}`,
      `/Bookings/User/${id}`,
      `/booking/user/${id}`,
      `/Bookings/Get-By-User/${id}`
    ]
    for (const url of attempts) {
      try {
        const res = await apiClient.get(url)
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
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    return []
  },

  // Get a single booking by id
  getBookingById: async (bookingId) => {
    const id = encodeURIComponent(bookingId)
    const attempts = [
      `/bookings/${id}`,
      `/Bookings/${id}`,
      `/booking/${id}`,
      `/Bookings/Get-By-${id}`,
      `/Bookings/Get-By-Id/${id}`,
      // Query-string variants
      { url: '/Bookings/Get-By-Id', opts: { params: { id: bookingId, bookingId } } },
      { url: '/Bookings/Get-By', opts: { params: { id: bookingId, bookingId } } },
      { url: '/bookings', opts: { params: { id: bookingId } } },
      { url: '/Bookings', opts: { params: { bookingId } } }
    ]
    for (const a of attempts) {
      try {
        const res = typeof a === 'string' ? await apiClient.get(a) : await apiClient.get(a.url, a.opts)
        const body = res.data
        const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
        if (unwrapped) return unwrapped
      } catch (e) {
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    throw new Error('Booking not found')
  },

  // Resolve user firstName/lastName for a given bookingId using multiple fallbacks
  // 1) Load booking -> try embedded user fields
  // 2) If userId present, fetch user by id (requires permission)
  // 3) Fallback: if caller is the booking owner, use Get-My-Profile
  getUserNameByBookingId: async (bookingId) => {
    if (!bookingId) throw new Error('bookingId required')

    const pickNames = (obj) => {
      if (!obj || typeof obj !== 'object') return { firstName: '', lastName: '' }
      const firstName = obj.firstName || obj.FirstName || obj.givenName || obj.GivenName || obj.name || ''
      const lastName = obj.lastName || obj.LastName || obj.surname || obj.Surname || ''
      return { firstName, lastName }
    }

    // Step 1: try booking endpoint variants via existing helper
    let booking
    try {
      booking = await API.getBookingById(bookingId)
      // Check embedded user info
      const user = booking?.user || booking?.userDto || booking?.User || booking?.data?.user || null
      if (user) return pickNames(user)
      // Else pick userId for step 2
      const userId = booking?.userId || booking?.UserId || booking?.data?.userId || booking?.userID || booking?.UserID
      if (userId) {
        try {
          const u = await API.getUserById(userId)
          return pickNames(u && (u.data || u))
        } catch (ux) {
          // If forbidden, continue to step 3
          const code = ux?.response?.status
          if (code && code !== 401 && code !== 403 && code !== 404 && code !== 405) throw ux
        }
      }
    } catch (bErr) {
      const code = bErr?.response?.status
      if (code === 404) throw new Error('Booking not found')
      // otherwise, try step 3
    }

    // Step 3: use current user's profile (works if caller is the booking owner)
    try {
      const me = await API.getMyProfile()
      return pickNames(me && (me.data || me))
    } catch (meErr) {
      // fall through
    }
    throw new Error('No accessible API returns the booking user\'s name for your role — backend change required')
  },

  // Cancel a booking
  cancelBooking: async (bookingId, reason = '') => {
    const id = encodeURIComponent(bookingId)
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
    const attempts = [
      { method: 'patch', url: `/bookings/cancel/${id}${query}` },
      { method: 'patch', url: `/Bookings/Cancel/${id}${query}` },
      { method: 'post',  url: `/bookings/${id}/cancel${query}` },
      { method: 'post',  url: `/Bookings/${id}/Cancel${query}` },
      // Body variants
      { method: 'post',  url: `/Bookings/Cancel`, body: { id: bookingId, reason } },
      { method: 'post',  url: `/Bookings/Cancel`, body: { bookingId, reason } },
    ]
    let lastErr
    for (const a of attempts) {
      try {
        const res = await apiClient[a.method](a.url, a.body)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    throw lastErr || new Error('Unable to cancel booking')
  },

  // Hard delete a booking (if backend supports it); otherwise expect 401/403/405
  deleteBooking: async (bookingId) => {
    const id = encodeURIComponent(bookingId)
    const resources = ['booking','bookings','Booking','Bookings']
    const tried = []
    // 1) RESTful DELETE /{resource}/{id}
    for (const r of resources) {
      const url = `/${r}/${id}`
      try {
        tried.push(`DELETE ${url}`)
        const res = await apiClient.delete(url)
        const body = res.data
        return body && typeof body === 'object' && 'data' in body ? body.data : body
      } catch (e) {
        const code = e?.response?.status
        if (code !== 404 && code !== 405) throw e
      }
    }
    // 2) Action routes with path param: POST /{resource}/Delete|Remove/{id}
    for (const r of resources) {
      for (const action of ['Delete','Remove']) {
        const url = `/${r}/${action}/${id}`
        try {
          tried.push(`POST ${url}`)
          const res = await apiClient.post(url)
          const body = res.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code !== 404 && code !== 405) throw e
        }
      }
    }
    // 3) Action routes with body: POST /{resource}/Delete|Remove  { id | bookingId | BookingId }
    for (const r of resources) {
      for (const action of ['Delete','Remove']) {
        for (const key of ['id','bookingId','BookingId']) {
          const url = `/${r}/${action}`
          try {
            tried.push(`POST ${url} body:{${key}}`)
            const res = await apiClient.post(url, { [key]: bookingId })
            const body = res.data
            return body && typeof body === 'object' && 'data' in body ? body.data : body
          } catch (e) {
            const code = e?.response?.status
            if (code !== 404 && code !== 405) throw e
          }
        }
      }
    }
    // 4) By-Id suffix or query forms
    for (const r of resources) {
      for (const label of ['Delete-By-Id','Remove-By-Id','Delete-By','Remove-By']) {
        const url1 = `/${r}/${label}/${id}`
        try {
          tried.push(`POST ${url1}`)
          const res = await apiClient.post(url1)
          const body = res.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code !== 404 && code !== 405) throw e
        }
        const url2 = `/${r}/${label}`
        try {
          tried.push(`POST ${url2}?id=`)
          const res = await apiClient.post(url2, null, { params: { id: bookingId } })
          const body = res.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code !== 404 && code !== 405) throw e
        }
      }
    }
    throw new Error(`Delete booking endpoint not found (tried ${tried.join(' | ')})`)
  }
}

API.decodeJwt = (token) => {
  const parts = token.split('.'); if (parts.length < 2) throw new Error('Invalid JWT')
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
  return JSON.parse(json)
}

export default API
