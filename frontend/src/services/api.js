import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true, // Required for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - can add auth headers here if needed
api.interceptors.request.use(
  (config) => {
    // No need to manually add JWT token - it's in httpOnly cookie
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    return response.data; // Return data directly
  },
  (error) => {
    const errorData = {
      message: error.response?.data?.message || error.message || 'Something went wrong',
      status: error.response?.status,
      success: false,
    };

    // Handle specific status codes
    if (error.response?.status === 401) {
      // Unauthorized - clear auth state
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    if (error.response?.status === 403) {
      // Forbidden - email unverified or insufficient permissions
      if (error.response?.data?.emailUnverified) {
        window.dispatchEvent(new CustomEvent('auth:unverified', {
          detail: { email: error.response.data.email }
        }));
      }
    }

    return Promise.reject(errorData);
  }
);

export default api;
