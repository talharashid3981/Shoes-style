// src/services/review.service.js
import api from "./api";

// Get reviews for a product
export const getProductReviewsAPI = async (productId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/reviews/product/${productId}?${queryString}`);
  return response;
};

// Get my reviews
export const getMyReviewsAPI = async () => {
  const response = await api.get("/reviews/my-reviews");
  return response;
};

// Create review
export const createReviewAPI = async (productId, data) => {
  const response = await api.post("/reviews", { productId, ...data });
  return response;
};

// Update review
export const updateReviewAPI = async (id, data) => {
  const response = await api.put(`/reviews/${id}`, data);
  return response;
};

// Delete review
export const deleteReviewAPI = async (id) => {
  const response = await api.delete(`/reviews/${id}`);
  return response;
};

// Vote helpful
export const voteHelpfulAPI = async (id) => {
  const response = await api.post(`/reviews/${id}/vote`);
  return response;
};

// Get pending reviews (admin)
export const getPendingReviewsAPI = async () => {
  const response = await api.get("/admin/reviews/pending");
  return response;
};

// Approve review (admin)
export const approveReviewAPI = async (id) => {
  const response = await api.put(`/admin/reviews/${id}/approve`);
  return response;
};