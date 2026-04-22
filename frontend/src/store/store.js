import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import cartReducer from "./slices/cartSlice.js";
import productReducer from "./slices/productSlice.js";
import orderReducer from "./slices/orderSlice.js";
import wishlistReducer from "./slices/wishlistSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    orders: orderReducer,
    wishlist: wishlistReducer,
  },
});