import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orders: [],
  currentOrder: null,
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload.orders;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.pages = action.payload.pages;
      state.isLoading = false;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
});

export const { setOrders, setCurrentOrder, setLoading, setError, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;