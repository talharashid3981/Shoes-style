// src/services/product.service.js
import api from "./api";

// Get all products with filters
export const getProductsAPI = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/products?${queryString}`);
  return response;
};

// Get single product by ID or slug
export const getProductByIdAPI = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response;
};

// Get related products
export const getRelatedProductsAPI = async (id) => {
  const response = await api.get(`/products/${id}/related`);
  return response;
};

// Update product (admin)
export const updateProductAPI = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response;
};



// Search products
export const searchProductsAPI = async (keyword) => {
  const response = await api.get("/products", {
    params: { keyword },
  });
  return response;
};