import { useState, useCallback } from 'react';
import api from '@/utils/api';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';

const API_BASE_URL = '/api/files/';

export interface FileMetadata {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  size: number;
  formatted_size: string;
  checksum: string;
  status: 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  upload_started_at: string;
  upload_completed_at: string | null;
  last_accessed_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  description: string;
  tags: string[];
  metadata: Record<string, any>;
  modified_at: string | null;
  owner?: {
    id: string;
    email: string;
  };
  shares?: Array<{
    id: string;
    shared_with: {
      id: string;
      email: string;
    };
    access_level: string;
    created_at: string;
  }>;
  latest_version?: {
    id: string;
    version_number: number;
    size: number;
    checksum: string;
    created_at: string;
    comment: string;
  };
}

export interface UploadChunkResponse {
  id: string;
  chunk_number: number;
  size: number;
  checksum: string;
  status: string;
}

interface UseFilesOptions {
  onError?: (error: Error) => void;
}

interface ShareLinkResponse {
  share_link: string;
}

interface FileVersionData {
  id: string;
  version_number: number;
  size: number;
  checksum: string;
  created_at: string;
  created_by: {
    email: string;
  };
  comment?: string;
}

interface SharedFile {
  id: string;
  name: string;
  size: number;
  shared_by: {
    email: string;
  };
  shared_at: string;
  expires_at: string;
}

const validateFileType = (file: File) => {
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type '${file.type}' is not supported. Please upload a supported file format.`);
  }
};

const validateFileSize = (file: File) => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds the maximum limit of 100MB.`);
  }
};

export const useFiles = (options: UseFilesOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
    options.onError?.(error);
  }, [options]);

  const listFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ results: FileMetadata[] }>(API_BASE_URL);
      return response.data.results || [];
    } catch (err) {
      handleError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      const response = await api.get<FileMetadata>(`${API_BASE_URL}/${fileId}`);
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const uploadFile = useCallback(async (file: File, onProgress?: (progress: number) => void) => {
    try {
      setLoading(true);
      // Validate file before starting upload
      validateFileType(file);
      validateFileSize(file);

      // Initialize upload
      console.log('Initializing upload...');
      const initResponse = await api.post<FileMetadata>(`${API_BASE_URL}/upload/initialize/`, {
        name: file.name,
        mime_type: file.type,
        size: file.size
      });

      if (!initResponse.data?.id) {
        throw new Error('Failed to initialize file upload');
      }

      const fileId = initResponse.data.id;
      const chunkSize = 1024 * 1024; // 1MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      console.log('Upload details:', { chunkSize, totalChunks });

      // Upload chunks
      for (let chunk = 0; chunk < totalChunks; chunk++) {
        const start = chunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunkBlob);
        formData.append('chunk_number', chunk.toString());

        console.log(`Uploading chunk ${chunk + 1}/${totalChunks}`);
        const chunkResponse = await api.post<UploadChunkResponse>(
          `${API_BASE_URL}/upload/${fileId}/chunk/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        console.log(`Chunk ${chunk + 1} uploaded:`, chunkResponse.data);

        if (onProgress) {
          const progress = ((chunk + 1) / totalChunks) * 100;
          console.log(`Upload progress: ${progress.toFixed(1)}%`);
          onProgress(progress);
        }
      }

      // Complete upload
      console.log('Completing upload...');
      const completeResponse = await api.post<FileMetadata>(
        `${API_BASE_URL}/upload/${fileId}/complete/`
      );

      console.log('Upload completed successfully:', completeResponse.data);
      return completeResponse.data;
    } catch (err) {
      console.error('File upload error:', err);
      const error = err as Error;
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        response: (err as any)?.response?.data
      });
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const downloadFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      const response = await api.get<Blob>(`${API_BASE_URL}/${fileId}/download/`, {
        responseType: 'blob'
      });

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'download';

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Download failed'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      await api.delete(`${API_BASE_URL}/${fileId}/`);
      return true;
    } catch (err) {
      handleError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const moveFile = useCallback(async (fileId: string, newName: string) => {
    try {
      setLoading(true);
      const response = await api.post<FileMetadata>(
        `${API_BASE_URL}/${fileId}/move/`,
        { new_name: newName }
      );
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const copyFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      const response = await api.post<FileMetadata>(
        `${API_BASE_URL}/${fileId}/copy/`
      );
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const restoreFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      await api.post(`${API_BASE_URL}${fileId}/restore/`);
      return true;
    } catch (err) {
      handleError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const bulkDelete = useCallback(async (fileIds: string[]) => {
    try {
      setLoading(true);
      await api.post(`${API_BASE_URL}/bulk/delete/`, { file_ids: fileIds });
      return true;
    } catch (err) {
      handleError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const bulkMove = useCallback(async (
    files: { id: string; newName: string }[]
  ) => {
    try {
      setLoading(true);
      const fileIds = files.map(f => f.id);
      const newNames = Object.fromEntries(
        files.map(f => [f.id, f.newName])
      );
      const response = await api.post<FileMetadata[]>(
        `${API_BASE_URL}/bulk/move/`,
        { file_ids: fileIds, new_names: newNames }
      );
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const bulkCopy = useCallback(async (fileIds: string[]) => {
    try {
      setLoading(true);
      const response = await api.post<FileMetadata[]>(
        `${API_BASE_URL}/bulk/copy/`,
        { file_ids: fileIds }
      );
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const searchFiles = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const response = await api.get<FileMetadata[]>(
        `${API_BASE_URL}/search/`,
        { params: { q: query } }
      );
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getRecentFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<FileMetadata[]>(`${API_BASE_URL}/recent/`);
      return response.data;
    } catch (err) {
      handleError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getTrash = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ results: FileMetadata[] }>(`${API_BASE_URL}trash/`);
      return response.data.results || [];
    } catch (err) {
      handleError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const generateShareLink = async (fileId: string): Promise<string> => {
    try {
      const response = await api.post<ShareLinkResponse>(`/files/${fileId}/share`);
      return response.data.share_link;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to generate share link'));
      throw error;
    }
  };

  const getFileVersions = async (fileId: string): Promise<FileVersionData[]> => {
    try {
      const response = await api.get<FileVersionData[]>(`/files/${fileId}/versions`);
      return response.data;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to get file versions'));
      throw error;
    }
  };

  const downloadVersion = async (fileId: string, versionId: string): Promise<void> => {
    try {
      const response = await api.get<Blob>(`/files/${fileId}/versions/${versionId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', ''); // The server will set the filename
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to download version'));
      throw error;
    }
  };

  const viewFile = useCallback(async (fileId: string) => {
    try {
      const response = await api.get<Blob>(`${API_BASE_URL}${fileId}/content/`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(response.data);
      return url;
    } catch (err) {
      handleError(err as Error);
      return null;
    }
  }, [handleError]);

  return {
    listFiles,
    viewFile,
    getFile,
    uploadFile,
    downloadFile,
    deleteFile,
    getTrash,
    restoreFile,
    loading,
    error,
  };
}; 