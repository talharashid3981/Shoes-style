import { useDispatch, useSelector } from "react-redux";
import {
  setWishlist,
  setLoading,
  setError,
  clearWishlist,
} from "../store/slices/wishlistSlice";
import {
  getWishlistAPI,
  addToWishlistAPI,
  removeFromWishlistAPI,
  clearWishlistAPI,
} from "../services/wishlistService";

const normalizeVariant = (variant) => ({
  color: variant?.color || "",
  size: variant?.size || "",
});

const sameVariant = (a, b) => {
  const va = normalizeVariant(a);
  const vb = normalizeVariant(b);
  return va.color === vb.color && va.size === vb.size;
};

const useWishlist = () => {
  const dispatch = useDispatch();
  const { items, count, isLoading } = useSelector((state) => state.wishlist);

  const fetchWishlist = async () => {
    dispatch(setLoading(true));
    try {
      const response = await getWishlistAPI();
      if (response.success) {
        dispatch(setWishlist(response));
      }
      return response;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const addToWishlist = async (productId, variant = undefined) => {
    dispatch(setLoading(true));
    try {
      const response = await addToWishlistAPI(productId, variant);
      if (response.success) {
        dispatch(setWishlist(response));
      }
      return response;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const removeFromWishlist = async (itemId) => {
    dispatch(setLoading(true));
    try {
      const response = await removeFromWishlistAPI(itemId);
      if (response.success) {
        dispatch(setWishlist(response));
      }
      return response;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const clearAllWishlist = async () => {
    dispatch(setLoading(true));
    try {
      const response = await clearWishlistAPI();
      if (response.success) {
        dispatch(clearWishlist());
      }
      return response;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const getWishlistItem = (productId, variant = undefined) =>
    items.find((item) => {
      const itemProductId = item.product?._id || item.product;
      return itemProductId === productId && sameVariant(item.variant, variant);
    });

  const getWishlistItemId = (productId, variant = undefined) =>
    getWishlistItem(productId, variant)?._id || null;

  const removeProductFromWishlist = async (productId, variant = undefined) => {
    const itemId = getWishlistItemId(productId, variant);
    if (!itemId) return null;
    return removeFromWishlist(itemId);
  };

  const isInWishlist = (productId, variant = undefined) =>
    Boolean(getWishlistItem(productId, variant));

  return {
    items,
    count,
    isLoading,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    removeProductFromWishlist,
    clearAllWishlist,
    isInWishlist,
    getWishlistItemId,
  };
};

export default useWishlist;
