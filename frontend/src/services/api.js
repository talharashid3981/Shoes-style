import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'https://aih-nyt8.onrender.com' || 'http://localhost:8000/api',
  withCredentials: true, // Required for httpOnly cookies
});

// Request interceptor - can add auth headers here if needed
api.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toLowerCase();

    // Let the browser set multipart boundary automatically for FormData.
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    } else if (method !== 'get' && method !== 'head') {
      config.headers = config.headers || {};
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    // No need to manually add JWT token - it's in httpOnly cookie
    // Add timestamp to prevent caching
    if (method === 'get') {
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
