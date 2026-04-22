// src/services/order.service.js
import api from "./api";

// Get user's orders
export const getMyOrdersAPI = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/orders/my-orders?${queryString}`);
  return response;
};

// Get order by ID
export const getOrderByIdAPI = async (id, email = null) => {
  const params = email ? { email } : {};
  const response = await api.get(`/orders/${id}`, { params });
  return response;
};

// Guest order lookup
export const guestOrderLookupAPI = async (orderId, email) => {
  const response = await api.post("/orders/lookup", { orderId, email });
  return response;
};

// Cancel order
export const cancelOrderAPI = async (id) => {
  const response = await api.put(`/orders/${id}/cancel`);
  return response;
};

// Create order (checkout)
export const checkoutAPI = async (orderData) => {
  const response = await api.post("/checkout", orderData);
  return response;
};

// Admin: Get all orders
export const getAllOrdersAPI = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/orders?${queryString}`);
  return response;
};