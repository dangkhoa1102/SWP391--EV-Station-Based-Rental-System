// API Configuration for FEC Electric Car Rental  
const API_BASE_URL = 'https://localhost:7001'; // Using HTTPS to match backend

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      window.location.href = 'home_page.html';
    }
    return Promise.reject(error);
  }
);

// Export for use in HTML files (non-module)
window.API = {
  baseURL: API_BASE_URL,
  
  // Authentication endpoints
  login: async (email, password) => {
    try {
      console.log('Sending login request to:', API_BASE_URL + '/api/Auth/login');
      console.log('Login data:', { username: email, password: '***' });
      
      // Backend uses "username" field but accepts email as value
      const response = await api.post('/api/Auth/login', { 
        username: email,  // field name is "username" but value is email
        password: password 
      });
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      
      if (error.response) {
        // Server responded with error status
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        throw error.response.data || { message: `Server error: ${error.response.status}` };
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
        throw { message: 'Unable to connect to server. Please check your network connection.' };
      } else {
        // Other error
        console.error('Unknown error:', error.message);
        throw { message: error.message || 'An unknown error occurred' };
      }
    }
  },
  
  register: async (username, email, phoneNumber, password) => {
    try {
      // Backend .NET thường dùng PascalCase
      const requestBody = { 
        Name: username,              // Backend yêu cầu "Name" với N viết hoa
        Email: email, 
        PhoneNumber: phoneNumber,
        Password: password,
        ConfirmPassword: password,
        Role: 'Customer'
      };
      
      console.log('Sending register request to:', API_BASE_URL + '/api/Auth/register');
      console.log('Register data:', { ...requestBody, password: '***', confirmPassword: '***' });
      
      const response = await api.post('/api/Auth/register', requestBody);
      console.log('Register response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Register error details:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        throw error.response.data || { message: `Server error: ${error.response.status}` };
      } else if (error.request) {
        console.error('Network error:', error.request);
        throw { message: 'Unable to connect to server. Please check your network connection.' };
      } else {
        console.error('Unknown error:', error.message);
        throw { message: error.message || 'An unknown error occurred' };
      }
    }
  },
  
  refreshToken: async () => {
    try {
      const response = await api.post('/api/Auth/refresh');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/api/Auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/api/Auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Get current user info
  getMe: async () => {
    try {
      console.log('Fetching current user info from:', API_BASE_URL + '/api/Auth/me');
      const response = await api.get('/api/Auth/me');
      console.log('User info response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get user info error:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        throw error.response.data || { message: `Server error: ${error.response.status}` };
      } else if (error.request) {
        console.error('Network error:', error.request);
        throw { message: 'Unable to connect to server. Please check your network connection.' };
      } else {
        console.error('Unknown error:', error.message);
        throw { message: error.message || 'An unknown error occurred' };
      }
    }
  },
  
  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      console.log('Sending change password request to:', API_BASE_URL + '/api/Auth/change-password');
      
      const response = await api.post('/api/Auth/change-password', { 
        userId: userId,
        currentPassword: currentPassword,
        newPassword: newPassword
      });
      
      console.log('Change password response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Change password error details:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        throw error.response.data || { message: `Server error: ${error.response.status}` };
      } else if (error.request) {
        console.error('Network error:', error.request);
        throw { message: 'Unable to connect to server. Please check your network connection.' };
      } else {
        console.error('Unknown error:', error.message);
        throw { message: error.message || 'An unknown error occurred' };
      }
    }
  }
};