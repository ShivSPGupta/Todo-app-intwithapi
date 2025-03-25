import { configureStore } from '@reduxjs/toolkit';
import taskReducer from '../features/taskSlice';
import authReducer from '../features/authSlice';

const store = configureStore({
  reducer: {
    tasks: taskReducer,
    auth: authReducer,
  },
});

export default store;