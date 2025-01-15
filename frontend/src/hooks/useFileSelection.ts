import { useState, useCallback } from 'react';

interface FileSelectionOptions {
  multiple?: boolean;
  maxSelection?: number;
  onSelectionChange?: (selectedFiles: string[]) => void;
}

export const useFileSelection = (options: FileSelectionOptions = {}) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const toggleSelection = useCallback(
    (fileId: string) => {
      setSelectedFiles((prev) => {
        const isSelected = prev.includes(fileId);
        let newSelection: string[];

        if (isSelected) {
          // Remove from selection
          newSelection = prev.filter((id) => id !== fileId);
        } else {
          // Add to selection if within limits
          if (options.multiple === false) {
            // Single selection mode
            newSelection = [fileId];
          } else if (options.maxSelection && prev.length >= options.maxSelection) {
            // Max selection limit reached
            return prev;
          } else {
            // Add to multi-selection
            newSelection = [...prev, fileId];
          }
        }

        options.onSelectionChange?.(newSelection);
        return newSelection;
      });
    },
    [options]
  );

  const selectAll = useCallback(
    (fileIds: string[]) => {
      if (options.multiple === false) {
        return;
      }

      let newSelection = fileIds;
      if (options.maxSelection) {
        newSelection = fileIds.slice(0, options.maxSelection);
      }

      setSelectedFiles(newSelection);
      options.onSelectionChange?.(newSelection);
    },
    [options]
  );

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    options.onSelectionChange?.([]);
  }, [options]);

  const isSelected = useCallback(
    (fileId: string) => {
      return selectedFiles.includes(fileId);
    },
    [selectedFiles]
  );

  const getSelectionCount = useCallback(() => {
    return selectedFiles.length;
  }, [selectedFiles]);

  const canSelectMore = useCallback(() => {
    if (options.multiple === false) {
      return selectedFiles.length === 0;
    }
    if (options.maxSelection) {
      return selectedFiles.length < options.maxSelection;
    }
    return true;
  }, [options, selectedFiles]);

  const selectRange = useCallback(
    (startId: string, endId: string, allFileIds: string[]) => {
      if (options.multiple === false) {
        return;
      }

      const startIndex = allFileIds.indexOf(startId);
      const endIndex = allFileIds.indexOf(endId);

      if (startIndex === -1 || endIndex === -1) {
        return;
      }

      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex) + 1;
      let rangeSelection = allFileIds.slice(start, end);

      if (options.maxSelection) {
        rangeSelection = rangeSelection.slice(0, options.maxSelection);
      }

      setSelectedFiles(rangeSelection);
      options.onSelectionChange?.(rangeSelection);
    },
    [options]
  );

  return {
    selectedFiles,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    getSelectionCount,
    canSelectMore,
    selectRange,
  };
}; 