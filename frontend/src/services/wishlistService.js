// src/services/wishlist.service.js
import api from "./api";

// Get wishlist
export const getWishlistAPI = async () => {
  const response = await api.get("/wishlist");
  return response;
};

// Add to wishlist
export const addToWishlistAPI = async (productId) => {
  const response = await api.post("/wishlist", { productId });
  return response;
};

// Remove from wishlist
export const removeFromWishlistAPI = async (productId) => {
  const response = await api.delete(`/wishlist/${productId}`);
  return response;
};

// Clear wishlist
export const clearWishlistAPI = async () => {
  const response = await api.delete("/wishlist");
  return response;
};

// Move to cart
export const moveToCartAPI = async (productId, variant, quantity) => {
  const response = await api.post("/wishlist/move-to-cart", {
    productId,
    variant,
    quantity,
  });
  return response;
};