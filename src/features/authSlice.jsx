import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';

const serializeUser = (user) => (
  user
    ? {
        uid: user.uid,
        email: user.email,
      }
    : null
);

export const registerUser = createAsyncThunk('auth/registerUser', async ({ email, password }) => {
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  return serializeUser(credentials.user);
});

export const login = createAsyncThunk('auth/login', async ({ email, password }) => {
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return serializeUser(credentials.user);
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await signOut(auth);
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    status: 'idle',
    error: null,
    authResolved: false,
  },
  reducers: {
    setAuthState: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.authResolved = true;
      state.status = 'idle';
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.authResolved = true;
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unable to create account.';
        state.authResolved = true;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.authResolved = true;
        state.status = 'succeeded';
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unable to sign in.';
        state.authResolved = true;
      })
      .addCase(logout.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.authResolved = true;
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unable to sign out.';
      });
  },
});

export const { setAuthState, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
