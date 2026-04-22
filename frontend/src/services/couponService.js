import api from './api.js';

export const validateCouponAPI = async (code, cartTotal, userId = null) => {
  return api.post('/coupons/validate', { code, cartTotal, userId });
};