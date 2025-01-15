import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction, resetState } from '../store/slices/authSlice';
import api from '../utils/api';
import { store } from '../store';

const API_BASE_URL = '/api/auth';
const USER_PROFILE_URL = '/api/auth/profile';

export interface User {
  id: string;
  email: string;
  username?: string;
  role: string;
  role_name: string;
  is_active: boolean;
  mfa_enabled: boolean;
  email_verified: boolean;
  permissions: string[];
} 

export interface AuthTokens {
  access: string;
  refresh: string;
}

interface APIAuthResponse {
  access: string;
  refresh: string;
  user: User;
  requires_mfa?: boolean;
}

interface UseAuthOptions {
  onError?: (error: Error) => void;
}

export interface MFAResponse {
  secret: string;
  qr_uri: string;
  backup_codes: string[];
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const dispatch = useAppDispatch();
  const { user, loading, error, isAuthenticated, accessToken, refreshToken: storedRefreshToken } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleError = useCallback((error: Error) => {
    dispatch(loginFailure(error.message));
    options.onError?.(error);
  }, [dispatch, options]);

  const register = useCallback(async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      dispatch(loginStart());
      await api.post<APIAuthResponse>(`${API_BASE_URL}/register/`, {
        username,
        email,
        password
      });

      return email;
    } catch (err) {
      handleError(err as Error);
      return false;
    }
  }, [dispatch, handleError]);

  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<APIAuthResponse> => {
    try {
      dispatch(loginStart());
      const response = await api.post<APIAuthResponse>(`${API_BASE_URL}/login/`, {
        email,
        password
      });

      const { access, refresh, requires_mfa, user: responseUser } = response.data;
      
      if (!requires_mfa && access && refresh) {
        dispatch(loginSuccess({
          access,
          refresh,
          user: responseUser,
          requires_mfa: requires_mfa || false
        }));
        navigate('/dashboard');
      }
      
      return response.data;
    } catch (err) {
      handleError(err as Error);
      throw err;
    }
  }, [dispatch, handleError, navigate]);

  const refreshToken = useCallback(async () => {
    try {
      if (!storedRefreshToken) return false;

      const response = await api.post<APIAuthResponse>(`${API_BASE_URL}/refresh/`, {
        refresh_token: storedRefreshToken
      });

      const { access, refresh, user: responseUser } = response.data;
      dispatch(loginSuccess({
        access,
        refresh,
        user: responseUser,
        requires_mfa: false
      }));
      return true;
    } catch (err) {
      handleError(err as Error);
      dispatch(logoutAction());
      return false;
    }
  }, [dispatch, handleError, storedRefreshToken]);

  const logout = useCallback(async () => {
    try {
      if (storedRefreshToken) {
        await api.post(`${API_BASE_URL}/logout/`, {
          refresh_token: storedRefreshToken
        });
      }
    } catch (err) {
      handleError(err as Error);
    } finally {
      dispatch(logoutAction());
      navigate('/login');
    }
  }, [dispatch, handleError, navigate, storedRefreshToken]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const response = await api.put<User>(USER_PROFILE_URL, data);
      if (accessToken && storedRefreshToken) {
        dispatch(loginSuccess({
          access: accessToken,
          refresh: storedRefreshToken,
          user: response.data,
          requires_mfa: response.data.mfa_enabled
        }));
      }
      return true;
    } catch (err) {
      handleError(err as Error);
      return false;
    }
  }, [dispatch, handleError, accessToken, storedRefreshToken]);

  const updatePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      dispatch(loginStart());
      await api.put(`${API_BASE_URL}/profile/`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      return true;
    } catch (err) {
      handleError(err as Error);
      return false;
    }
  }, [dispatch, handleError]);

  const enableMFA = useCallback(async (email: string): Promise<MFAResponse> => {
    try {
      const response = await api.post<MFAResponse>(`${API_BASE_URL}/mfa/enable/`, { email });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.response?.data?.error || 'Failed to enable MFA';
      options.onError?.(new Error(message));
      throw new Error(message);
    }
  }, [options]);

  const verifyMFA = useCallback(async (email: string, code: string) => {
    try {

      
      const response = await api.post<APIAuthResponse>(`${API_BASE_URL}/mfa/verify/`, {
        email,
        code
      });
      

      
      if (response.data.access && response.data.refresh) {
        dispatch(loginSuccess({
          access: response.data.access,
          refresh: response.data.refresh,
          user: response.data.user,
          requires_mfa: false
        }));
        
        // Wait for next tick to ensure store is updated
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Verify tokens are in store before navigation
        const state = store.getState();

        
        if (state.auth.isAuthenticated && state.auth.accessToken) {

          navigate('/dashboard');
        } else {
          console.warn('⚠️ Auth state not properly set after MFA verification');
        }
      }
      
      console.groupEnd();
      return response.data;
    } catch (error: any) {
      console.error('❌ MFA Verification Error:', error);
      const message = error.response?.data?.error || 'Failed to verify MFA code';
      handleError(new Error(message));
      console.groupEnd();
      throw new Error(message);
    }
  }, [dispatch, handleError, navigate]);

  const disableMFA = useCallback(async (): Promise<void> => {
    try {
      await api.post(`${API_BASE_URL}/mfa/disable/`);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to disable MFA';
      options.onError?.(new Error(message));
      throw new Error(message);
    }
  }, [options]);

  const resetAuthState = useCallback(() => {
    dispatch(resetState());
  }, [dispatch]);

  // Load user profile if tokens exist
  useEffect(() => {
    const loadProfile = async () => {
      if (accessToken && !user) {
        try {
          const response = await api.get<User>(USER_PROFILE_URL);
          dispatch(loginSuccess({
            access: accessToken,
            refresh: storedRefreshToken || '',
            user: response.data,
            requires_mfa: false
          }));
        } catch (err) {
          handleError(err as Error);
          dispatch(logoutAction());
        }
      }
    };
    loadProfile();
  }, [dispatch, handleError, user, accessToken, storedRefreshToken]);

  const hasPermission = useCallback((permission: string) => {
    return user?.permissions?.includes(permission) || false;
  }, [user]);

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    updatePassword,
    isAuthenticated,
    enableMFA,
    verifyMFA,
    disableMFA,
    refreshToken,
    resetAuthState,
    hasPermission,
  };
}; 