import axios from 'axios'

// Swagger API base URL
export const SWAGGER_ROOT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5054/api'

// Create axios client with interceptors
export const apiClient = axios.create({
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

        // Call refresh token API directly using axios (not apiClient, to avoid interceptor recursion)
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

// Helper: decode JWT without validation
export const decodeJwt = (token) => {
  if (!token) return {}
  try {
    const parts = token.split('.')
    if (parts.length < 2) return {}
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(atob(payload).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    return JSON.parse(json)
  } catch (e) {
    console.warn('decodeJwt failed', e)
    return {}
  }
}

// Export a default object with backwards compatibility
export default {
  apiClient,
  SWAGGER_ROOT,
  decodeJwt
}
