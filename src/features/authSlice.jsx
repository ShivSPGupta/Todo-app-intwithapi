import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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

const firebaseAuthMessages = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/missing-email': 'Enter your email address first.',
  'auth/missing-password': 'Enter your password to continue.',
  'auth/operation-not-allowed': 'Email/password auth is not enabled in Firebase Authentication.',
  'auth/unauthorized-continue-uri': 'The password reset return URL is not allowed in Firebase Auth settings.',
  'auth/invalid-continue-uri': 'The password reset return URL is invalid.',
  'auth/weak-password': 'Use at least 6 characters for a stronger password.',
  'auth/user-not-found': 'No account was found with this email.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network issue detected. Check your connection and try again.',
};

const getAuthErrorMessage = (error, fallbackMessage) => (
  firebaseAuthMessages[error?.code] || fallbackMessage
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

export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ email }) => {
  await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/login`,
    handleCodeInApp: false,
  });
  return email;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    status: 'idle',
    error: null,
    authMessage: null,
    authResolved: false,
  },
  reducers: {
    setAuthState: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.authResolved = true;
      state.status = 'idle';
      state.error = null;
      state.authMessage = null;
    },
    clearAuthError: (state) => {
      state.error = null;
      state.authMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.authMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.authResolved = true;
        state.status = 'succeeded';
        state.authMessage = 'Account created successfully.';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = getAuthErrorMessage(action.error, 'Unable to create account.');
        state.authResolved = true;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.authMessage = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.authResolved = true;
        state.status = 'succeeded';
        state.authMessage = 'Signed in successfully.';
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = getAuthErrorMessage(action.error, 'Unable to sign in.');
        state.authResolved = true;
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.authMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.authMessage = `Password reset email sent to ${action.payload}.`;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = getAuthErrorMessage(action.error, 'Unable to send password reset email.');
      })
      .addCase(logout.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.authMessage = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.authResolved = true;
        state.authMessage = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = getAuthErrorMessage(action.error, 'Unable to sign out.');
      });
  },
});

export const { setAuthState, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
