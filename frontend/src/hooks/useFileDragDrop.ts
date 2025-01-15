import { useState, useCallback, DragEvent } from 'react';
import { useFileMetadata } from './useFileMetadata';
import { useNotifications } from './useNotifications';

interface DragDropOptions {
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  onFileAccepted?: (file: File) => void;
  onFileRejected?: (file: File, reason: string) => void;
}

export const useFileDragDrop = (options: DragDropOptions = {}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { validateFileSize, validateFileType } = useFileMetadata();
  const { showError } = useNotifications();

  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const validateFile = useCallback(
    (file: File): { isValid: boolean; reason?: string } => {
      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        return {
          isValid: false,
          reason: `File size exceeds the maximum limit of ${options.maxSize} bytes`,
        };
      }

      // Check file type
      if (options.acceptedTypes && !options.acceptedTypes.includes(file.type)) {
        return {
          isValid: false,
          reason: `File type ${file.type} is not supported`,
        };
      }

      // Validate file size using the utility function
      if (!validateFileSize(file.size)) {
        return {
          isValid: false,
          reason: 'File size exceeds the maximum allowed limit',
        };
      }

      // Validate file type using the utility function
      if (!validateFileType(file.type)) {
        return {
          isValid: false,
          reason: 'File type is not supported',
        };
      }

      return { isValid: true };
    },
    [options.maxSize, options.acceptedTypes, validateFileSize, validateFileType]
  );

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      const { files } = event.dataTransfer;
      const fileList = Array.from(files);

      // Check number of files
      if (options.maxFiles && fileList.length > options.maxFiles) {
        showError(`Maximum ${options.maxFiles} files allowed`);
        return;
      }

      fileList.forEach((file) => {
        const { isValid, reason } = validateFile(file);

        if (isValid) {
          options.onFileAccepted?.(file);
        } else {
          options.onFileRejected?.(file, reason || 'File validation failed');
          showError(`${file.name}: ${reason}`);
        }
      });
    },
    [options, validateFile, showError]
  );

  const getInputProps = useCallback(
    () => ({
      accept: options.acceptedTypes?.join(','),
      multiple: options.maxFiles !== 1,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        if (options.maxFiles && files.length > options.maxFiles) {
          showError(`Maximum ${options.maxFiles} files allowed`);
          return;
        }

        files.forEach((file) => {
          const { isValid, reason } = validateFile(file);

          if (isValid) {
            options.onFileAccepted?.(file);
          } else {
            options.onFileRejected?.(file, reason || 'File validation failed');
            showError(`${file.name}: ${reason}`);
          }
        });

        // Reset the input
        event.target.value = '';
      },
    }),
    [options, validateFile, showError]
  );

  const getRootProps = useCallback(
    () => ({
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }),
    [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]
  );

  return {
    isDragging,
    getRootProps,
    getInputProps,
  };
}; 