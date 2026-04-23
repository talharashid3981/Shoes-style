// src/services/reviewService.js
import api from "./api";

// Get reviews for a product (public)
export const getProductReviewsAPI = async (productId) => {
  const response = await api.get(`/reviews/product/${productId}`);
  return response;
};

// Get current logged-in user's own review for this product
export const getMyProductReviewAPI = async (productId) => {
  const response = await api.get(`/reviews/product/${productId}/my-review`);
  return response;
};

// Create review
// ✅ FIXED: backend createReview expects { product, rating, title, comment, images }
// Old code sent { productId, ... } — productId is not the field name the schema uses.
export const createReviewAPI = async (productId, data) => {
  const response = await api.post("/reviews", {
    product: productId,   // ✅ must be "product" to match backend
    rating:  data.rating,
    title:   data.title,
    comment: data.comment,
    images:  data.images || [],
  });
  return response;
};

// Vote helpful/unhelpful on a review
export const voteReviewAPI = async (id, vote = "helpful") => {
  const response = await api.post(`/reviews/${id}/vote`, { vote });
  return response;
};

// Upload review images
export const uploadReviewImagesAPI = async (files) => {
  const formData = new FormData();
  files.forEach(f => formData.append("images", f));
  const response = await api.post("/reviews/upload-images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

// ─── Admin ─────────────────────────────────────────────────────────────────────

export const getAllReviewsAPI = async (params = {}) => {
  const response = await api.get("/reviews", { params });
  return response;
};

export const updateReviewStatusAPI = async (id, status) => {
  const response = await api.put(`/reviews/${id}/status`, { status });
  return response;
};

export const toggleFeaturedReviewAPI = async (id) => {
  const response = await api.put(`/reviews/${id}/feature`);
  return response;
};
