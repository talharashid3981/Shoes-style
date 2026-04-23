import api from "./api";

// Get wishlist
export const getWishlistAPI = async () => {
  return api.get("/wishlist");
};

// Add to wishlist
export const addToWishlistAPI = async (productId, variant = undefined) => {
  return api.post("/wishlist", { productId, variant });
};

// Remove from wishlist
export const removeFromWishlistAPI = async (itemId) => {
  return api.delete(`/wishlist/${itemId}`);
};

// Clear wishlist
export const clearWishlistAPI = async () => {
  return api.delete("/wishlist");
};

// Check if product/variant exists in wishlist
export const checkWishlistItemAPI = async (productId, variant = undefined) => {
  const params = {};
  if (variant?.color) params.color = variant.color;
  if (variant?.size) params.size = variant.size;
  return api.get(`/wishlist/check/${productId}`, { params });
};
