import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { isAuthenticated: JSON.parse(sessionStorage.getItem('auth')) || false },
  reducers: {
    login: (state) => { 
      state.isAuthenticated = true;
      sessionStorage.setItem('auth', JSON.stringify(true));
    },
    logout: (state) => { 
      state.isAuthenticated = false;
      sessionStorage.setItem('auth', JSON.stringify(false));
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;