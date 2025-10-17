// Centralized API helper - forced to use swagger backend on port 5054
const SWAGGER_ROOT = 'http://localhost:5054/api';

if (typeof axios === 'undefined') {
  console.error('Axios is required by api.js. Please include axios before this script.');
} else {
  // Ensure axios uses the forced swagger root as the default base for relative requests
  try { axios.defaults.baseURL = SWAGGER_ROOT; } catch (e) {}
}

// single axios instance
const apiClient = axios.create({
  baseURL: SWAGGER_ROOT,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000
});

apiClient.interceptors.request.use(cfg => {
  try {
    const t = localStorage.getItem('token');
    if (t && t !== 'null') {
      // Use Bearer prefix for authentication
      cfg.headers.Authorization = `Bearer ${t}`;
      console.log('Added token to request (with Bearer prefix):', t.substring(0, 20) + '...');
    }
  } catch (e) {}
  return cfg;
});

apiClient.interceptors.response.use(r => r, e => Promise.reject(e));

window.API = {
  baseURL: SWAGGER_ROOT,
  _client: apiClient,

  login: async (email, password) => {
    const res = await apiClient.post('/Auth/Login', { Email: email, Password: password });
    const payload = res.data?.data || res.data || {};
    const token = payload.token || payload.accessToken || res.data?.token;
    if (token) {
      localStorage.setItem('token', token);
      
      // Try to extract and save userId from JWT
      try {
        const decoded = window.API.decodeJwt(token);
        const userId = decoded.UserId || decoded.userId || decoded.uid || decoded.nameid || decoded.sub;
        if (userId) {
          localStorage.setItem('userId', userId);
          console.log('✅ Saved userId from JWT:', userId);
        }
      } catch (e) {
        console.warn('Could not decode JWT to extract userId');
      }
    }
    if (payload.user) localStorage.setItem('user', JSON.stringify(payload.user));
    return { raw: res.data, token, payload };
  },

  register: async (fullName, email, phoneNumber, password) => {
    const res = await apiClient.post('/Auth/Register', { FullName: fullName, Email: email, PhoneNumber: phoneNumber, Password: password, ConfirmPassword: password, Role: 'Customer' });
    return res.data;
  },

  refreshToken: async () => {
    const res = await apiClient.post('/Auth/Refresh-Token');
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post('/Auth/Logout');
    localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); localStorage.removeItem('userEmail');
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await apiClient.post('/Auth/forgot-password', { email });
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/Auth/Me');
    return res.data;
  },

  getMyProfile: async () => {
    console.log('getMyProfile called');
    const token = localStorage.getItem('token');
    console.log('Current token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    
    const res = await apiClient.get('/Users/Get-My-Profile');
    console.log('getMyProfile response:', res.data);
    const data = res.data;
    // Handle nested response: data.data > data
    if (data.data && typeof data.data === 'object') return data.data;
    return data;
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    const res = await apiClient.post('/Auth/Change-Password', { userId, currentPassword, newPassword });
    return res.data;
  },

  getAllStations: async (page = 1, pageSize = 10, search = '', sortBy = 'Id', sortDesc = false) => {
    // Backend accepts NO parameters (all optional). Only send params if explicitly provided and non-empty.
    const params = {};
    // ONLY add params if they have actual values (not defaults)
    if (page && page !== 1) params.PageIndex = page;
    if (pageSize && pageSize !== 10 && pageSize !== 500) params.PageSize = pageSize;
    if (search && search.trim()) params.Search = search.trim();
    if (sortBy && sortBy !== 'Id') params.SortBy = sortBy;
    if (sortDesc === true) params.SortDesc = true;
    
    console.log('getAllStations called with params:', params);
    const res = await apiClient.get('/Stations/Get-All', Object.keys(params).length > 0 ? { params } : {});
    console.log('getAllStations response:', res.data);
    
    const data = res.data;
    // Backend returns: { isSuccess: true, message: "string", data: { data: [...], currentPage, pageSize, ... } }
    // Priority: nested data.data.data (paginated wrapper) > data.data (simple wrapper) > direct array
    if (data.data && data.data.data && Array.isArray(data.data.data)) return data.data.data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.result)) return data.result;
    const key = Object.keys(data || {}).find(k => Array.isArray(data[k]));
    return key ? data[key] : [];
  },

  getAllCars: async (page = 1, pageSize = 100, search = '', sortBy = 'Id', sortDesc = false) => {
    // Fetch all cars from the API
    const params = {};
    if (page && page !== 1) params.Page = page;
    if (pageSize && pageSize !== 100) params.PageSize = pageSize;
    if (search && search.trim()) params.Search = search.trim();
    if (sortBy && sortBy !== 'Id') params.SortBy = sortBy;
    if (sortDesc === true) params.SortDesc = true;
    
    console.log('getAllCars called with params:', params);
    const res = await apiClient.get('/Cars/Get-All', Object.keys(params).length > 0 ? { params } : {});
    console.log('getAllCars response:', res.data);
    
    const data = res.data;
    // Normalize response: nested data.data > data.data > direct array > other shapes
    if (data.data && data.data.data && Array.isArray(data.data.data)) return data.data.data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.result)) return data.result;
    const key = Object.keys(data || {}).find(k => Array.isArray(data[k]));
    return key ? data[key] : [];
  },

  getAvailableCarsByStation: async (stationId) => {
    console.log('getAvailableCarsByStation called with stationId:', stationId);
    const res = await apiClient.get(`/Cars/Get-Available-By-Station/${encodeURIComponent(stationId)}`);
    console.log('getAvailableCarsByStation response:', res.data);
    
    const data = res.data;
    // Normalize response: nested data.data > data.data > direct array > other shapes
    if (data.data && data.data.data && Array.isArray(data.data.data)) return data.data.data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.result)) return data.result;
    const key = Object.keys(data || {}).find(k => Array.isArray(data[k]));
    return key ? data[key] : [];
  },

  getCarById: async (carId) => {
    console.log('getCarById called with carId:', carId);
    const res = await apiClient.get(`/Cars/Get-By-${encodeURIComponent(carId)}`);
    console.log('getCarById response:', res.data);
    
    const data = res.data;
    // Handle nested response: data.data (single object) > data > direct object
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data;
    if (typeof data === 'object' && !Array.isArray(data) && data.id) return data;
    return null;
  },

  createBooking: async (payload, userId) => {
    console.log('createBooking called with userId:', userId, 'payload:', payload);
    const res = await apiClient.post(`/Bookings/Create?userId=${encodeURIComponent(userId)}`, payload);
    console.log('createBooking response:', res.data);
    return res.data?.data || res.data || {};
  },

  confirmBooking: async (bookingId, paymentMethod, paymentTransactionId = null) => {
    console.log('confirmBooking called with bookingId:', bookingId, 'paymentMethod:', paymentMethod);
    const payload = {
      bookingId: bookingId,
      paymentMethod: paymentMethod, // "bank" or "cash"
    };
    // Only include transactionId if provided (not required for cash payments)
    if (paymentTransactionId) {
      payload.paymentTransactionId = paymentTransactionId;
    }
    const res = await apiClient.post(`/Bookings/Confirm`, payload);
    console.log('confirmBooking response:', res.data);
    return res.data?.data || res.data || {};
  },

  completeBooking: async (bookingId) => {
    console.log('completeBooking called with bookingId:', bookingId);
    const res = await apiClient.post(`/Bookings/Complete-By-${encodeURIComponent(bookingId)}`);
    console.log('completeBooking response:', res.data);
    return res.data?.data || res.data || {};
  },

  getUserBookings: async (userId) => {
    console.log('getUserBookings called with userId:', userId);
    const res = await apiClient.get(`/Bookings/Get-By-User/${encodeURIComponent(userId)}`);
    console.log('getUserBookings raw response:', res.data);
    
    const data = res.data;
    // Normalize response: nested data.data > data > direct array
    if (data.data && Array.isArray(data.data)) {
      console.log('getUserBookings returning data.data:', data.data);
      return data.data;
    }
    if (Array.isArray(data)) {
      console.log('getUserBookings returning data:', data);
      return data;
    }
    if (Array.isArray(data.items)) {
      console.log('getUserBookings returning data.items:', data.items);
      return data.items;
    }
    console.log('getUserBookings returning empty array');
    return [];
  }
};

// convenience wrappers
['get','post','put','delete','patch'].forEach(m => {
  window.API[m] = async (endpoint, body, opts) => {
    if (m === 'get' || m === 'delete') return (await apiClient[m](endpoint, opts)).data;
    return (await apiClient[m](endpoint, body, opts)).data;
  };
});

window.API.decodeJwt = (token) => {
  const parts = token.split('.'); if (parts.length < 2) throw new Error('Invalid JWT');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  return JSON.parse(json);
};

