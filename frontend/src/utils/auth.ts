import { store } from '../store';

interface StoredAuth {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    role: string;
    mfa_enabled: boolean;
  };
}

export const getStoredAuth = (): StoredAuth | null => {
  try {
    const state = store.getState();
    if (state.auth.accessToken && state.auth.refreshToken && state.auth.user) {
      return {
        access: state.auth.accessToken,
        refresh: state.auth.refreshToken,
        user: state.auth.user
      };
    }
    return null;
  } catch (error) {
    console.error('Error reading auth state:', error);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const state = store.getState();
  return state.auth.isAuthenticated && !!state.auth.accessToken;
};

export const getAccessToken = (): string | null => {
  const state = store.getState();
  return state.auth.accessToken;
};

export const getRefreshToken = (): string | null => {
  const state = store.getState();
  return state.auth.refreshToken;
};

export const getCurrentUser = () => {
  const state = store.getState();
  return state.auth.user;
}; 