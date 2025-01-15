import { useState, useCallback, useMemo } from 'react';

export type SortField = 'name' | 'size' | 'type' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

interface FileSortingOptions {
  defaultField?: SortField;
  defaultDirection?: SortDirection;
  onSortChange?: (field: SortField, direction: SortDirection) => void;
}

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export const useFileSorting = (options: FileSortingOptions = {}) => {
  const [sortField, setSortField] = useState<SortField>(options.defaultField || 'name');
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    options.defaultDirection || 'asc'
  );

  const toggleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        // Toggle direction if same field
        const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDirection);
        options.onSortChange?.(field, newDirection);
      } else {
        // Set new field with default ascending direction
        setSortField(field);
        setSortDirection('asc');
        options.onSortChange?.(field, 'asc');
      }
    },
    [sortField, sortDirection, options]
  );

  const getSortIcon = useCallback(
    (field: SortField): string => {
      if (field !== sortField) return '↕️';
      return sortDirection === 'asc' ? '↑' : '↓';
    },
    [sortField, sortDirection]
  );

  const sortFiles = useCallback(
    (files: FileData[]): FileData[] => {
      return [...files].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'created_at':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case 'updated_at':
            comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            break;
          default:
            comparison = 0;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    },
    [sortField, sortDirection]
  );

  const sortParams = useMemo(
    () => ({
      field: sortField,
      direction: sortDirection,
    }),
    [sortField, sortDirection]
  );

  const resetSort = useCallback(() => {
    setSortField(options.defaultField || 'name');
    setSortDirection(options.defaultDirection || 'asc');
    options.onSortChange?.(options.defaultField || 'name', options.defaultDirection || 'asc');
  }, [options]);

  return {
    sortField,
    sortDirection,
    toggleSort,
    getSortIcon,
    sortFiles,
    sortParams,
    resetSort,
  };
}; 