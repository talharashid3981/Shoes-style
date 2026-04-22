import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  count: 0,
  isLoading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlist: (state, action) => {
      state.items = action.payload.items || [];
      state.count = action.payload.count || 0;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearWishlist: (state) => {
      state.items = [];
      state.count = 0;
    },
  },
});

export const { setWishlist, setLoading, setError, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;