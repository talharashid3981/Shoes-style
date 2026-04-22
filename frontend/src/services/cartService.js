import api from './api.js';

export const getCartAPI = async () => {
  return api.get('/cart');
};

export const addToCartAPI = async (productId, variant, quantity) => {
  return api.post('/cart', { productId, variant, quantity });
};

export const updateCartItemAPI = async (itemId, quantity) => {
  return api.put(`/cart/${itemId}`, { quantity });
};

export const removeCartItemAPI = async (itemId) => {
  return api.delete(`/cart/${itemId}`);
};

export const applyCouponAPI = async (code) => {
  return api.post('/cart/apply-coupon', { code });
};

export const removeCouponAPI = async () => {
  return api.delete('/cart/coupon');
};