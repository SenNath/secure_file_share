import { useCallback } from 'react';

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

export const useFileMetadata = () => {
  const getFileMetadata = useCallback((file: File): FileMetadata => {
    return {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      lastModified: file.lastModified,
    };
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = (bytes / Math.pow(1024, exponent)).toFixed(2);
    return `${value} ${units[exponent]}`;
  }, []);

  const getFileExtension = useCallback((filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }, []);

  const getMimeType = useCallback((filename: string): string => {
    const extension = getFileExtension(filename);
    const mimeTypes: { [key: string]: string } = {
      txt: 'text/plain',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      mp3: 'audio/mpeg',
      mp4: 'video/mp4',
      zip: 'application/zip',
      json: 'application/json',
      xml: 'application/xml',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }, [getFileExtension]);

  const isImage = useCallback((type: string): boolean => {
    return type.startsWith('image/');
  }, []);

  const isVideo = useCallback((type: string): boolean => {
    return type.startsWith('video/');
  }, []);

  const isAudio = useCallback((type: string): boolean => {
    return type.startsWith('audio/');
  }, []);

  const isPDF = useCallback((type: string): boolean => {
    return type === 'application/pdf';
  }, []);

  const isDocument = useCallback((type: string): boolean => {
    const documentTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    return documentTypes.includes(type);
  }, []);

  const validateFileSize = useCallback((size: number): boolean => {
    const maxSize = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '104857600'); // 100MB default
    return size <= maxSize;
  }, []);

  const validateFileType = useCallback((type: string): boolean => {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      // Text
      'text/plain',
      'application/json',
      'application/xml',
      // Media
      'audio/mpeg',
      'video/mp4',
    ];
    return allowedTypes.includes(type);
  }, []);

  return {
    getFileMetadata,
    formatFileSize,
    getFileExtension,
    getMimeType,
    isImage,
    isVideo,
    isAudio,
    isPDF,
    isDocument,
    validateFileSize,
    validateFileType,
  };
}; 