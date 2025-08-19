import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import productReducer from "./slices/productSlice";
import orderReducer from "./slices/orderSlice";
import inventoryReducer from "./slices/inventorySlice";
import expenseReducer from "./slices/expenseSlice";
import analyticsReducer from "./slices/analyticsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    products: productReducer,
    orders: orderReducer,
    inventory: inventoryReducer,
    expenses: expenseReducer,
    analytics: analyticsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
