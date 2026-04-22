import { useDispatch, useSelector } from "react-redux";
import { setCart, setLoading, setError, clearCart } from "../store/slices/cartSlice";
import { getCartAPI, addToCartAPI, updateCartItemAPI, removeCartItemAPI, applyCouponAPI, removeCouponAPI } from "../services/cartService";

const useCart = () => {
  const dispatch = useDispatch();
  const { items, totalPrice, totalItems, coupon, discount, isLoading } = useSelector((state) => state.cart);

  const fetchCart = async () => {
    dispatch(setLoading(true));
    try {
      const response = await getCartAPI();
      if (response.success) {
        dispatch(setCart(response.cart));
      }
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const addToCart = async (productId, variant, quantity) => {
    dispatch(setLoading(true));
    try {
      const response = await addToCartAPI(productId, variant, quantity);
      if (response.success) {
        dispatch(setCart(response.cart));
        return response;
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    dispatch(setLoading(true));
    try {
      const response = await updateCartItemAPI(itemId, quantity);
      if (response.success) {
        dispatch(setCart(response.cart));
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const removeItem = async (itemId) => {
    dispatch(setLoading(true));
    try {
      const response = await removeCartItemAPI(itemId);
      if (response.success) {
        dispatch(setCart(response.cart));
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const applyCoupon = async (code) => {
    dispatch(setLoading(true));
    try {
      const response = await applyCouponAPI(code);
      if (response.success) {
        dispatch(setCart(response.cart));
        return response;
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const removeCoupon = async () => {
    dispatch(setLoading(true));
    try {
      const response = await removeCouponAPI();
      if (response.success) {
        dispatch(setCart(response.cart));
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const clearAllCart = () => {
    dispatch(clearCart());
  };

  return {
    items,
    totalPrice,
    totalItems,
    coupon,
    discount,
    isLoading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    clearAllCart,
  };
};

export default useCart;