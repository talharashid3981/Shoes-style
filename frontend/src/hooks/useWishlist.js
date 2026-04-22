import { useDispatch, useSelector } from "react-redux";
import { setWishlist, setLoading, setError, clearWishlist } from "../store/slices/wishlistSlice";
import { getWishlistAPI } from "../services/wishlistService";

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
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const addToWishlist = async (productId) => {
    dispatch(setLoading(true));
    try {
      const response = await wishlistService.addToWishlist(productId);
      if (response.success) {
        dispatch(setWishlist(response));
        return response;
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const removeFromWishlist = async (productId) => {
    dispatch(setLoading(true));
    try {
      const response = await wishlistService.removeFromWishlist(productId);
      if (response.success) {
        dispatch(setWishlist(response));
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const clearAllWishlist = async () => {
    dispatch(setLoading(true));
    try {
      const response = await wishlistService.clearWishlist();
      if (response.success) {
        dispatch(clearWishlist());
      }
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const isInWishlist = (productId) => {
    return items.some(item => item.product?._id === productId || item.product === productId);
  };

  return {
    items,
    count,
    isLoading,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    clearAllWishlist,
    isInWishlist,
  };
};

export default useWishlist;