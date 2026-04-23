// src/services/adminService.js
import api from "./api";

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStatsAPI = async () => {
  const response = await api.get("/admin/stats");
  return response;
};

export const getRecentOrdersAPI = async () => {
  const response = await api.get("/admin/recent-orders");
  return response;
};

export const getTopProductsAPI = async () => {
  const response = await api.get("/admin/top-products");
  return response;
};

export const getLowStockAPI = async () => {
  const response = await api.get("/admin/low-stock");
  return response;
};

// ─── Orders ────────────────────────────────────────────────────────────────────
export const getAllOrdersAPI = async (params) => {
  const response = await api.get("/orders/my-orders", { params });
  return response;
};

export const updateOrderStatusAPI = async (orderId, status, trackingNumber) => {
  const response = await api.put(`/orders/${orderId}/status`, { status, trackingNumber });
  return response;
};

// ─── Products ──────────────────────────────────────────────────────────────────
// ✅ FIXED: accepts params object so page/limit/search are passed correctly
export const getProductsAPI = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response;
};

export const createProductAPI = async (data) => {
  const response = await api.post("/products", data);
  return response;
};

export const updateProductAPI = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response;
};

export const uploadImagesAPI = async (id, formData) => {
  const response = await api.post(`/products/${id}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

export const deleteProductAPI = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response;
};

// ─── Users ─────────────────────────────────────────────────────────────────────
export const getAllUsersAPI = async (params) => {
  const response = await api.get("/users", { params });
  return response;
};

export const updateUserAdminAPI = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response;
};

export const deleteUserAdminAPI = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response;
};

// ─── Coupons ───────────────────────────────────────────────────────────────────
export const getCouponsAPI = async () => {
  const response = await api.get("/coupons");
  return response;
};

export const createCouponAPI = async (data) => {
  const response = await api.post("/coupons", data);
  return response;
};

export const updateCouponAPI = async (id, data) => {
  const response = await api.put(`/coupons/${id}`, data);
  return response;
};

export const deleteCouponAPI = async (id) => {
  const response = await api.delete(`/coupons/${id}`);
  return response;
};

// ─── Banners ───────────────────────────────────────────────────────────────────
export const getAllBannersAPI = async () => {
  const response = await api.get("/banners/all");
  return response;
};

export const createBannerAPI = async (data) => {
  const response = await api.post("/banners", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

export const updateBannerAPI = async (id, data) => {
  const response = await api.put(`/banners/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

export const deleteBannerAPI = async (id) => {
  const response = await api.delete(`/banners/${id}`);
  return response;
};

// ─── Categories ────────────────────────────────────────────────────────────────
export const getCategoriesAPI = async () => {
  const response = await api.get("/categories");
  return response;
};

export const createCategoryAPI = async (data) => {
  const response = await api.post("/categories", data);
  return response;
};

// ✅ ADDED: was missing — used in CategorySection edit
export const updateCategoryAPI = async (id, data) => {
  const response = await api.put(`/categories/${id}`, data);
  return response;
};

export const deleteCategoryAPI = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response;
};

// ─── Collections ───────────────────────────────────────────────────────────────
export const getCollectionsAPI = async () => {
  const response = await api.get("/collections");
  return response;
};

export const createCollectionAPI = async (data) => {
  const response = await api.post("/collections", data);
  return response;
};

// ✅ ADDED: was missing — used in CollectionsSection edit
export const updateCollectionAPI = async (id, data) => {
  const response = await api.put(`/collections/${id}`, data);
  return response;
};

export const deleteCollectionAPI = async (id) => {
  const response = await api.delete(`/collections/${id}`);
  return response;
};

// ─── Reviews ───────────────────────────────────────────────────────────────────
export const getAllReviewsAPI = async (params) => {
  const response = await api.get("/reviews", { params });
  return response;
};

export const updateReviewStatusAPI = async (id, status) => {
  const response = await api.put(`/reviews/${id}/status`, { status });
  return response;
};

// ─── Newsletter / Subscribers ──────────────────────────────────────────────────
export const getSubscribersAPI = async () => {
  const response = await api.get("/subscribers");
  return response;
};

export const deleteSubscriberAPI = async (id) => {
  const response = await api.delete(`/subscribers/${id}`);
  return response;
};

export const exportSubscribersAPI = async () => {
  const response = await api.get("/subscribers/export", { responseType: "blob" });
  return response;
};

export const getCampaignsAPI = async () => {
  const response = await api.get("/newsletter/campaigns");
  return response;
};

export const createCampaignAPI = async (data) => {
  const response = await api.post("/newsletter/campaigns", data);
  return response;
};

export const sendCampaignAPI = async (id) => {
  const response = await api.post(`/newsletter/campaigns/${id}/send`);
  return response;
};
