import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../hooks/useAuth';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  requiresMfa: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  requires_mfa: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  requiresMfa: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.user = action.payload.user;
      state.requiresMfa = action.payload.requires_mfa;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.requiresMfa = false;
      state.loading = false;
      state.error = null;
    },
    refreshTokenStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    refreshTokenSuccess: (state, action: PayloadAction<AuthResponse>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.user = action.payload.user;
      state.loading = false;
      state.error = null;
    },
    refreshTokenFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    resetState: () => initialState
  }
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  refreshTokenStart,
  refreshTokenSuccess,
  refreshTokenFailure,
  updateUser,
  resetState
} = authSlice.actions;

export default authSlice.reducer; 