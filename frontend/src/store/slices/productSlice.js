import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  currentProduct: null,
  relatedProducts: [],
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload.products;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.pages = action.payload.pages;
      state.isLoading = false;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
      state.isLoading = false;
    },
    setRelatedProducts: (state, action) => {
      state.relatedProducts = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
});

export const { 
  setProducts, 
  setCurrentProduct, 
  setRelatedProducts, 
  setLoading, 
  setError, 
  clearCurrentProduct 
} = productSlice.actions;

export default productSlice.reducer;