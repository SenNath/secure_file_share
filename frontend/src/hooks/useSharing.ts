import { useState, useCallback } from 'react';
import api from '@/utils/api';
import { FileMetadata } from './useFiles';

const API_BASE_URL = '/api/sharing/';

export interface ShareData {
  shared_with_email: string;
  access_level: 'VIEW' | 'EDIT' | 'FULL';
  expires_at?: string;
  notes?: string;
}

export interface ShareLinkData {
  access_level: 'VIEW' | 'EDIT' | 'FULL';
  expires_at: string;
  max_uses?: number;
  password?: string;
}

export interface FileShare {
  id: string;
  file: FileMetadata;
  shared_by: {
    id: string;
    email: string;
  };
  shared_with: {
    id: string;
    email: string;
  };
  access_level: string;
  created_at: string;
  expires_at: string | null;
  last_accessed_at: string | null;
  is_revoked: boolean;
  revoked_at: string | null;
  notes: string;
}

export interface ShareLink {
  id: string;
  file: FileMetadata;
  token: string;
  access_level: string;
  created_at: string;
  expires_at: string;
  max_uses: number | null;
  current_uses: number;
  last_used_at: string | null;
  password_protected: boolean;
  is_revoked: boolean;
  share_link: string;
}

interface UseSharingOptions {
  onError?: (error: Error) => void;
}

export const useSharing = (options: UseSharingOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
    options.onError?.(error);
  }, [options]);

  const shareFile = useCallback(async (fileId: string, shareData: ShareData) => {
    try {
      setLoading(true);
      const response = await api.post<FileShare>(`${API_BASE_URL}files/${fileId}/share/`, shareData);
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createShareLink = useCallback(async (fileId: string, linkData: ShareLinkData) => {
    try {
      setLoading(true);
      const response = await api.post<ShareLink>(`${API_BASE_URL}files/${fileId}/share-link/`, linkData);
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getFileShares = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      const response = await api.get<FileShare[]>(`${API_BASE_URL}files/${fileId}/shares/`);
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getShareLinks = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      const response = await api.get<ShareLink[]>(`${API_BASE_URL}files/${fileId}/share-links/`);
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const revokeShare = useCallback(async (shareId: string) => {
    try {
      setLoading(true);
      await api.delete(`${API_BASE_URL}shares/${shareId}/`);
      return true;
    } catch (err) {
      handleError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const revokeShareLink = useCallback(async (linkId: string) => {
    try {
      setLoading(true);
      await api.delete(`${API_BASE_URL}share-links/${linkId}/`);
      return true;
    } catch (err) {
      handleError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getSharedWithMe = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<FileShare[]>(`${API_BASE_URL}shared-with-me/`);
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getMyShares = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<FileShare[]>(`${API_BASE_URL}my-shares/`);
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    shareFile,
    createShareLink,
    getFileShares,
    getShareLinks,
    revokeShare,
    revokeShareLink,
    getSharedWithMe,
    getMyShares,
    loading,
    error,
  };
}; 