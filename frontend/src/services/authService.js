import api from './api.js';

export const registerAPI = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response;
};

export const loginAPI = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response;
};

export const logoutAPI = async () => {
  const response = await api.post('/auth/logout');
  return response;
};

export const getCurrentUserAPI = async () => {
  const response = await api.get('/auth/profile');
  return response;
};

// ✅ FIXED: removed the erroneous `userId` first parameter.
// Previously: updateProfileAPI(userId, userData) — when called as
// updateProfileAPI(userData), the data went into `userId` and `userData`
// was undefined, causing the server to receive an empty request body.
export const updateProfileAPI = async (userData) => {
  const response = await api.put('/auth/profile', userData);
  return response;
};

export const verifyEmailAPI = async (token) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  return response;
};

export const resendVerificationAPI = async (email) => {
  const response = await api.post('/auth/resend-verification', { email });
  return response;
};

export const forgotPasswordAPI = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response;
};

export const resetPasswordAPI = async (token, password) => {
  const response = await api.post(`/auth/reset-password/${token}`, { password });
  return response;
};