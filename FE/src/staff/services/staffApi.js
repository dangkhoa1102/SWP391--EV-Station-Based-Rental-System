import axios from 'axios'

// Resolve API base from env (Vite or CRA) with sensible fallback
let API_BASE = 'http://localhost:5054'
try {
  // Access Vite env if available (in ESM builds)
  // eslint-disable-next-line no-undef
  // @ts-ignore
  if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
    // eslint-disable-next-line no-undef
    // @ts-ignore
    API_BASE = import.meta.env.VITE_API_URL
  }
} catch {}
try {
  if (typeof process !== 'undefined' && process?.env?.REACT_APP_API_URL) {
    API_BASE = process.env.REACT_APP_API_URL
  }
} catch {}
// Normalize and append /api
const SWAGGER_ROOT = `${String(API_BASE).replace(/\/+$/, '')}/api`

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
  try {
    cfg.metadata = cfg.metadata || {}
    cfg.metadata.start = Date.now()
  } catch {}
  return cfg
})

apiClient.interceptors.response.use(
  r => {
    try {
      const cfg = r?.config || {}
      const method = (cfg.method || 'GET').toUpperCase()
      const url = (cfg.baseURL || '') + (cfg.url || '')
      const start = cfg?.metadata?.start
      if (start) {
        const ms = Date.now() - start
        if (ms > 1500) {
          console.warn(`⏱️ API slow ${method} ${url} took ${ms} ms`)
        } else {
          console.log(`⏱️ API ${method} ${url} took ${ms} ms`)
        }
      }
    } catch {}
    return r
  },
  e => {
    try {
      const cfg = e?.config || {}
      const method = (cfg.method || 'GET').toUpperCase()
      const url = (cfg.baseURL || '') + (cfg.url || '')
      const start = cfg?.metadata?.start
      if (start) {
        const ms = Date.now() - start
        console.warn(`⏱️ API error ${method} ${url} after ${ms} ms`)
      }
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
  // Lightweight method to fetch server time via response headers
  getServerTime: async () => {
    try {
      const res = await apiClient.get('/Auth/Me')
      const h = res && res.headers ? res.headers : {}
      const dateHeader = h['date'] || h['Date'] || null
      if (dateHeader) return new Date(dateHeader)
    } catch {}
    return new Date()
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

  /**
   * Update a station's slot/capacity count.
   * Tries multiple common endpoints and payload shapes.
   * @param {string} stationId GUID/Id of the station
   * @param {number} slots new slot count (or capacity)
   */
  updateStationSlots: async (stationId, slots) => {
    if (!stationId && stationId !== 0) throw new Error('stationId is required')
    if (slots == null || Number.isNaN(Number(slots))) throw new Error('slots is required and must be a number')
    const id = encodeURIComponent(stationId)
    const bodies = [
      { stationId, slots },
      { StationId: stationId, Slots: slots },
      { id: stationId, slots },
      { Id: stationId, Slots: slots },
      { stationId, slotCount: slots },
      { stationId, capacity: slots },
      { id: stationId, capacity: slots },
      { stationId, totalSlots: slots },
    ]
    const attempts = [
      // Action-style
      { method: 'post', url: '/Stations/Update-Slots' },
      { method: 'post', url: '/Station/Update-Slots' },
      { method: 'post', url: '/Stations/Update-Capacity' },
      { method: 'post', url: '/Stations/Update' },
      // REST-style with path
      { method: 'put', url: `/stations/${id}/slots` },
      { method: 'put', url: `/Stations/${id}/Slots` },
      { method: 'put', url: `/stations/${id}/capacity` },
      { method: 'put', url: `/Stations/${id}` },
      // Query variants
      { method: 'post', url: '/Stations/Update-Slots', query: { stationId, slots } },
    ]
    let lastErr
    for (const a of attempts) {
      // build config
      const cfg = {}
      if (a.query) cfg.params = a.query
      for (const body of bodies) {
        try {
          const res = await apiClient[a.method](a.url, a.query ? undefined : body, cfg)
          const data = res?.data
          // unwrap common wrapper
          if (data && typeof data === 'object' && 'data' in data) {
            if (data.isSuccess === false) {
              const msg = data.message || (Array.isArray(data.errors) ? data.errors.join('; ') : 'Update failed')
              const err = new Error(msg); err.body = data; throw err
            }
            return data.data
          }
          return data
        } catch (e) {
          lastErr = e
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
    }
    throw lastErr || new Error('Update station slots endpoint not found')
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
    if (!stationId) return []
    const id = encodeURIComponent(stationId)
    const attempts = [
      // Provided variant
      { url: `/Cars/Get-Available-By-Station/${id}` },
      { url: '/Cars/Get-Available-By-Station', opts: { params: { stationId } } },
      // Common get-by-station variants
      { url: `/Cars/Get-By-Station/${id}` },
      { url: '/Cars/Get-By-Station', opts: { params: { stationId } } },
      { url: '/Cars/Get-By-Station', opts: { params: { StationId: stationId } } },
      { url: '/Cars/Get-By-Station', opts: { params: { stationID: stationId } } },
      // Resource aliases
      { url: `/Vehicles/Get-By-Station/${id}` },
      { url: '/Vehicles/Get-By-Station', opts: { params: { stationId } } },
      // REST style
      { url: `/car/station/${id}` },
      { url: `/cars/station/${id}` },
      { url: `/vehicle/station/${id}` },
      { url: `/vehicles/station/${id}` },
      // Station nested
      { url: `/Stations/${id}/Cars` },
      { url: `/Stations/${id}/vehicles` },
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient.get(a.url, a.opts)
        const responseData = res.data
        if (Array.isArray(responseData)) return responseData
        if (Array.isArray(responseData?.data?.data)) return responseData.data.data
        if (Array.isArray(responseData?.data?.items)) return responseData.data.items
        if (Array.isArray(responseData?.data)) return responseData.data
        if (Array.isArray(responseData?.items)) return responseData.items
      } catch (e) {
        const code = e?.response?.status
        // Treat 400 as a variant mismatch (e.g., GUID vs int), keep trying
        if (code && code !== 404 && code !== 405 && code !== 400) throw e
      }
    }
    return []
  },

  getCarById: async (carId) => {
    const id = encodeURIComponent(carId)
    const attempts = [
      // Action style
      { url: `/Cars/Get-By-Id/${id}` },
      { url: `/Car/Get-By-Id/${id}` },
      { url: '/Cars/Get-By-Id', opts: { params: { id: carId, carId } } },
      { url: '/Cars/Get-By', opts: { params: { id: carId, carId } } },
      // Provided odd variant
      { url: `/Cars/Get-By-${id}` },
      // REST style resources
      { url: `/car/${id}` }, { url: `/cars/${id}` }, { url: `/Car/${id}` }, { url: `/Cars/${id}` },
      { url: `/vehicle/${id}` }, { url: `/vehicles/${id}` }, { url: `/Vehicle/${id}` }, { url: `/Vehicles/${id}` }
    ]
    for (const a of attempts) {
      try {
        const res = await apiClient.get(a.url, a.opts)
        const responseData = res.data
        // Unwrap common shapes
        const unwrapped = responseData && typeof responseData === 'object' && 'data' in responseData ? responseData.data : responseData
        if (!unwrapped) continue
        if (Array.isArray(unwrapped)) {
          const found = unwrapped.find(c => (c.id || c.Id || c.carId || c.CarId) === carId)
          if (found) return found
          continue
        }
        return unwrapped
      } catch (e) {
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405 && code !== 400) throw e
      }
    }
    throw new Error('Car not found')
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
      { url: '/Bookings/Get-By-Station', opts: { params: { StationId: stationId } } },
      { url: '/Bookings/Get-By-Station', opts: { params: { stationID: stationId } } },
      { url: '/Bookings/Get-All-By-Station', opts: { params: { stationId } } },
      { url: `/Bookings/Get-All-By-Station/${id}` },
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
        const code = e?.response?.status
        // Continue on 400 as well (often validation on route shape)
        if (code && code !== 404 && code !== 405 && code !== 400) throw e
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

  // Save check-in details for a booking
  checkInBooking: async (bookingId, payload) => {
    const id = encodeURIComponent(bookingId)
    const bodyVariants = [
      payload,
      { bookingId, ...payload },
      { Id: bookingId, ...payload }
    ]
    const attempts = [
      { method: 'post', url: `/bookings/${id}/checkin` },
      { method: 'post', url: `/Bookings/${id}/Check-In` },
      { method: 'post', url: `/booking/${id}/checkin` },
      { method: 'post', url: `/Bookings/Check-In` },
      { method: 'post', url: `/Bookings/CheckIn` },
      { method: 'post', url: `/bookings/checkin` },
    ]
    let lastErr
    for (const a of attempts) {
      for (const body of bodyVariants) {
        try {
          const res = await apiClient[a.method](a.url, body)
          const data = res.data
          return data && typeof data === 'object' && 'data' in data ? data.data : data
        } catch (e) {
          lastErr = e
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
    }
    throw lastErr || new Error('Check-in endpoint not found')
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

  // Resolve vehicle model (brand + model) starting from a booking id
  // 1) Load booking (prefers API.getBookingById fallbacks)
  // 2) If CarId/VehicleId exists, load the car via getCarById
  // 3) Fallback: parse carInfo string or nested car fields
  getVehicleModelFromBooking: async (bookingId) => {
    if (!bookingId) throw new Error('bookingId required')
    // Step 1: booking detail
    const booking = await API.getBookingById(bookingId)
    // Step 2: try car id-based fetch
    const carId = booking?.carId || booking?.CarId || booking?.vehicleId || booking?.VehicleId || booking?.car?.id || booking?.car?.Id
    if (carId) {
      try {
        let car = await API.getCarById(carId)
        if (!car || (!car.id && !car.Id)) {
          try { car = await API.getCarByIdRest?.(carId) } catch {}
        }
  const brand = car?.brand ?? car?.Brand ?? null
  const model = car?.model ?? car?.Model ?? null
  const nameCandidate = car?.name ?? car?.Name ?? [brand, model].filter(Boolean).join(' ')
  const name  = nameCandidate != null ? nameCandidate : null
        return { brand, model, name, raw: car }
      } catch (e) {
        // continue to fallback parsing
      }
    }
    // Step 3: fallback sources
    const carInfo = booking?.carInfo ?? booking?.CarInfo
    if (typeof carInfo === 'string' && carInfo.trim()) {
      const parts = carInfo.trim().split(/\s+/)
      const brand = parts.shift() || ''
      const model = parts.join(' ')
      const name = [brand, model].filter(Boolean).join(' ')
      return { brand: brand || null, model: model || null, name: name || null, raw: carInfo }
    }
  const brand = booking?.car?.brand ?? booking?.car?.Brand ?? booking?.vehicle?.brand ?? booking?.vehicle?.Brand ?? booking?.carBrand ?? booking?.CarBrand ?? null
  const model = booking?.car?.model ?? booking?.car?.Model ?? booking?.vehicle?.model ?? booking?.vehicle?.Model ?? booking?.carModel ?? booking?.CarModel ?? null
  const nameCandidate2  = booking?.car?.name  ?? booking?.car?.Name  ?? booking?.vehicle?.name  ?? booking?.vehicle?.Name  ?? [brand, model].filter(Boolean).join(' ')
  const name = nameCandidate2 != null ? nameCandidate2 : null
    if (brand || model || name) return { brand, model, name, raw: booking?.car || booking?.vehicle || null }
    throw new Error('No car information available on booking')
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

// Payment-related helpers used during staff check-in payment flow
// Create a payment for a booking. Default paymentType='Rental' (enum 1)
API.createPayment = async (bookingId, paymentType = 'Rental', description = 'Rental payment at check-in') => {
  if (!bookingId) throw new Error('bookingId is required')
  const payloads = [
    // Prefer explicit enum name as string, as required by backend
    { bookingId, paymentType, description },
    { BookingId: bookingId, PaymentType: paymentType, Description: description },
    // Fallback: numeric enum (1)
    { bookingId, paymentType: 1, description },
    { BookingId: bookingId, PaymentType: 1, Description: description },
  ]
  const endpoints = [
    '/Payment/Create', '/Payments/Create', '/payment/create', '/payments/create',
  ]
  let lastErr
  for (const url of endpoints) {
    for (const body of payloads) {
      try {
        const res = await apiClient.post(url, body)
        const data = res?.data
        return data && typeof data === 'object' && 'data' in data ? data.data : data
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
  }
  throw lastErr || new Error('Create payment endpoint not found')
}

// Trigger server to sync payment status from gateway for a given booking
API.syncPaymentStatus = async (bookingId) => {
  if (!bookingId) throw new Error('bookingId is required')
  const id = encodeURIComponent(bookingId)
  const endpoints = [
    `/Payment/sync/${id}`, `/Payments/sync/${id}`, `/payment/sync/${id}`, `/payments/sync/${id}`,
    // Some backends accept POST body with bookingId
    { url: '/Payment/sync', opts: { method: 'post', body: { bookingId } } },
    { url: '/Payments/sync', opts: { method: 'post', body: { bookingId } } },
  ]
  let lastErr
  for (const ep of endpoints) {
    try {
      if (typeof ep === 'string') {
        const res = await apiClient.post(ep)
        const data = res?.data
        return data && typeof data === 'object' && 'data' in data ? data.data : data
      } else {
        const res = await apiClient.post(ep.url, ep.opts?.body)
        const data = res?.data
        return data && typeof data === 'object' && 'data' in data ? data.data : data
      }
    } catch (e) {
      lastErr = e
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) throw e
    }
  }
  throw lastErr || new Error('Payment sync endpoint not found')
}

// Fetch payment by booking to display current gateway/backend payment status
API.getPaymentByBooking = async (bookingId) => {
  if (!bookingId) throw new Error('bookingId is required')
  const id = encodeURIComponent(bookingId)
  const attempts = [
    `/Payment/By-Booking/${id}`,
    `/Payments/By-Booking/${id}`,
    '/Payment/By-Booking',
    '/Payments/By-Booking',
    `/Payment/Get-By-Booking/${id}`,
    `/Payments/Get-By-Booking/${id}`,
    '/Payment/Get-By-Booking',
    '/Payments/Get-By-Booking',
    // Generic search with query
    { url: '/Payment', opts: { params: { bookingId } } },
    { url: '/Payments', opts: { params: { bookingId } } },
  ]
  for (const a of attempts) {
    try {
      const res = typeof a === 'string' ? await apiClient.get(a) : await apiClient.get(a.url, a.opts)
      const body = res?.data
      const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
      return unwrapped
    } catch (e) {
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) throw e
    }
  }
  return null
}

API.decodeJwt = (token) => {
  const parts = token.split('.'); if (parts.length < 2) throw new Error('Invalid JWT')
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
  return JSON.parse(json)
}

// Resolve Staff entity Id for the current user (or a provided userId)
// Tries, in order:
// 1) /Users/Get-My-Profile -> staffId | StaffId
// 2) JWT claims or localStorage for userId, then lookup staff by user via common endpoints
//    - /Staff/Get-By-User-Id/{userId}
//    - /Staff/Get-By-User/{userId}
//    - /Staffs/Get-By-User-Id/{userId}
//    - /Staff/By-UserId/{userId}
//    - /Staff/User/{userId}
//    - /Users/{userId}/Staff
//    - query variants: ?userId=
API.resolveStaffId = async (userId = null) => {
  // 1) Try profile
  try {
    const me = await API.getMyProfile()
    const sid = me?.staffId || me?.StaffId || me?.staffID || me?.StaffID
    if (sid) return sid
    // capture userId if not provided
    if (!userId) userId = me?.id || me?.Id || me?.userId || me?.UserId || null
  } catch {}
  // 2) Try local userId sources
  if (!userId) {
    try { userId = localStorage.getItem('userId') || null } catch {}
  }
  if (!userId) {
    try {
      const t = localStorage.getItem('token')
      if (t) {
        const d = API.decodeJwt(t)
        userId = d['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || d.sub || d.userId || d.UserId || d.id || d.Id || null
      }
    } catch {}
  }
  if (!userId) throw new Error('Unable to determine userId to resolve staffId')

  const id = encodeURIComponent(userId)
  const attempts = [
    { url: `/Staff/Get-By-User-Id/${id}` },
    { url: `/Staff/Get-By-User/${id}` },
    { url: `/Staffs/Get-By-User-Id/${id}` },
    { url: `/Staff/By-UserId/${id}` },
    { url: `/Staff/User/${id}` },
    { url: `/Users/${id}/Staff` },
    // querystring variants
    { url: `/Staff/Get-By-User-Id`, opts: { params: { userId } } },
    { url: `/Staff/Get-By-User`, opts: { params: { userId } } },
  ]
  for (const a of attempts) {
    try {
      const res = await apiClient.get(a.url, a.opts)
      const body = res?.data
      const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
      if (!unwrapped) continue
      const staffObj = Array.isArray(unwrapped)
        ? (unwrapped.find(s => (s.userId || s.UserId) === userId) || unwrapped[0])
        : unwrapped
      const sid = staffObj?.staffId || staffObj?.StaffId || staffObj?.id || staffObj?.Id
      if (sid) return sid
    } catch (e) {
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) throw e
    }
  }
  throw new Error('Staff id not found for current user')
}

// Check-In with Contract (specific canonical endpoint)
// Expected payload shape:
// { bookingId: GUID, staffId: GUID, checkInNotes?: string, checkInPhoto?: File }
API.checkInWithContract = async (payload) => {
  if (!payload || !payload.bookingId || !payload.staffId) {
    throw new Error('Missing required fields: bookingId, staffId')
  }
  
  // Create FormData for multipart/form-data
  const formData = new FormData()
  formData.append('BookingId', payload.bookingId)
  formData.append('StaffId', payload.staffId)
  
  if (payload.checkInNotes) {
    formData.append('CheckInNotes', payload.checkInNotes)
  }
  
  if (payload.checkInPhoto && payload.checkInPhoto instanceof File) {
    formData.append('CheckInPhoto', payload.checkInPhoto)
  }
  
  const attempts = [
    '/api/Bookings/Check-In-With-Contract',
    '/Bookings/Check-In-With-Contract',
    '/bookings/Check-In-With-Contract',
  ]
  let lastErr
  for (const url of attempts) {
    try {
      const res = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
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
  throw lastErr || new Error('Check-In-With-Contract endpoint not found')
}

// Check-Out with Payment (Bước 5)
// Expected payload shape:
// { bookingId: GUID, staffId: GUID, actualReturnDateTime?: DateTime, checkOutNotes?: string, checkOutPhotoUrl?: string, damageFee?: number }
API.checkOutBooking = async (payload) => {
  if (!payload || !payload.bookingId || !payload.staffId) {
    throw new Error('Missing required fields: bookingId, staffId')
  }
  
  // Normalize field names to match backend DTO (both PascalCase and camelCase)
  const body = {
    BookingId: payload.bookingId,
    StaffId: payload.staffId,
    ActualReturnDateTime: payload.actualReturnDateTime || null,
    CheckOutNotes: payload.checkOutNotes || '',
    CheckOutPhotoUrl: payload.checkOutPhotoUrl || '',
    DamageFee: payload.damageFee || 0
  }
  
  const attempts = [
    '/Bookings/Check-Out-With-Payment',
    '/bookings/Check-Out-With-Payment',
    '/Bookings/checkout',
  ]
  let lastErr
  for (const url of attempts) {
    try {
      const res = await apiClient.post(url, body)
      const respBody = res?.data
      if (respBody && typeof respBody === 'object' && 'data' in respBody) {
        if (respBody.isSuccess === false) {
          const msg = respBody.message || (Array.isArray(respBody.errors) ? respBody.errors.join('; ') : 'Request failed')
          const err = new Error(msg)
          err.body = respBody
          throw err
        }
        return respBody.data
      }
      return respBody
    } catch (e) {
      lastErr = e
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) throw e
    }
  }
  throw lastErr || new Error('Check-Out-With-Payment endpoint not found')
}

// =============================================================================
// FLEET MANAGEMENT (Staff can also use these for station management)
// =============================================================================

/**
 * Get detailed car status report
 * @param {string} stationId - Filter by station (optional)
 * @param {string} status - Filter by status (optional)
 */
API.getCarStatusReport = async (stationId = null, status = null) => {
  const params = {}
  if (stationId) params.stationId = stationId
  if (status) params.status = status
  const attempts = ['/Admin/Fleet/Car-Status', '/Fleet/Car-Status', '/Staff/Fleet/Car-Status']
  for (const url of attempts) {
    try {
      const res = await apiClient.get(url, { params })
      const body = res?.data
      return body && typeof body === 'object' && 'data' in body ? body.data : body
    } catch (e) {
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) throw e
    }
  }
  return null
}

/**
 * Assign staff to station
 * @param {string} stationId - Station ID
 * @param {string} staffId - Staff user ID
 */
API.assignStaffToStation = async (stationId, staffId) => {
  if (!stationId || !staffId) throw new Error('stationId and staffId are required')
  const attempts = [
    { url: `/Stations/${encodeURIComponent(stationId)}/Assign-Staff`, params: { staffId } },
    { url: `/Admin/Stations/${encodeURIComponent(stationId)}/Assign-Staff`, params: { staffId } }
  ]
  for (const a of attempts) {
    try {
      const res = await apiClient.post(a.url, null, { params: a.params })
      const body = res?.data
      return body && typeof body === 'object' && 'data' in body ? body.data : body
    } catch (e) {
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) throw e
    }
  }
  throw new Error('Assign staff to station endpoint not found')
}

export default API
