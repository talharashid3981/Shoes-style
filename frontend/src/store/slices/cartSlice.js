import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  totalPrice: 0,
  totalItems: 0,
  coupon: null,
  discount: 0,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (state, action) => {
      const { items, totalPrice, totalItems, coupon, discount } = action.payload;
      state.items = items || [];
      state.totalPrice = totalPrice || 0;
      state.totalItems = totalItems || 0;
      state.coupon = coupon || null;
      state.discount = discount || 0;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
      state.totalItems = 0;
      state.coupon = null;
      state.discount = 0;
    },
  },
});

export const { setCart, setLoading, setError, clearCart } = cartSlice.actions;
export default cartSlice.reducer;