import { useState, useCallback, useMemo } from 'react';
import { useFileMetadata } from './useFileMetadata';

interface FileFilterOptions {
  defaultSearchTerm?: string;
  defaultFileTypes?: string[];
  onFilterChange?: (files: FileData[]) => void;
}

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export const useFileFiltering = (options: FileFilterOptions = {}) => {
  const [searchTerm, setSearchTerm] = useState(options.defaultSearchTerm || '');
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(
    options.defaultFileTypes || []
  );
  const { isImage, isVideo, isAudio, isPDF, isDocument } = useFileMetadata();

  const fileTypeCategories = useMemo(
    () => [
      { id: 'image', label: 'Images', check: isImage },
      { id: 'video', label: 'Videos', check: isVideo },
      { id: 'audio', label: 'Audio', check: isAudio },
      { id: 'pdf', label: 'PDFs', check: isPDF },
      { id: 'document', label: 'Documents', check: isDocument },
    ],
    [isImage, isVideo, isAudio, isPDF, isDocument]
  );

  const updateSearchTerm = useCallback(
    (term: string) => {
      setSearchTerm(term);
      options.onFilterChange?.([]); // Trigger filter change
    },
    [options]
  );

  const toggleFileType = useCallback(
    (type: string) => {
      setSelectedFileTypes((prev) => {
        const newTypes = prev.includes(type)
          ? prev.filter((t) => t !== type)
          : [...prev, type];
        options.onFilterChange?.([]); // Trigger filter change
        return newTypes;
      });
    },
    [options]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedFileTypes([]);
    options.onFilterChange?.([]); // Trigger filter change
  }, [options]);

  const filterFiles = useCallback(
    (files: FileData[]): FileData[] => {
      return files.filter((file) => {
        // Apply search term filter
        const matchesSearch =
          !searchTerm ||
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.type.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply file type filter
        const matchesType =
          selectedFileTypes.length === 0 ||
          selectedFileTypes.some((type) => {
            const category = fileTypeCategories.find((cat) => cat.id === type);
            return category?.check(file.type);
          });

        return matchesSearch && matchesType;
      });
    },
    [searchTerm, selectedFileTypes, fileTypeCategories]
  );

  const getFilterStats = useCallback(
    (files: FileData[]) => {
      const filteredFiles = filterFiles(files);
      return {
        total: files.length,
        filtered: filteredFiles.length,
        hasFilters: searchTerm !== '' || selectedFileTypes.length > 0,
      };
    },
    [filterFiles, searchTerm, selectedFileTypes]
  );

  const getAvailableFileTypes = useCallback(
    (files: FileData[]) => {
      const types = new Set<string>();
      files.forEach((file) => {
        fileTypeCategories.forEach((category) => {
          if (category.check(file.type)) {
            types.add(category.id);
          }
        });
      });
      return Array.from(types);
    },
    [fileTypeCategories]
  );

  return {
    searchTerm,
    selectedFileTypes,
    fileTypeCategories,
    updateSearchTerm,
    toggleFileType,
    clearFilters,
    filterFiles,
    getFilterStats,
    getAvailableFileTypes,
  };
}; 