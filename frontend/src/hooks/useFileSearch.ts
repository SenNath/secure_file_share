import { useState, useCallback, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { addRecentSearch } from '../store/slices/searchSlice';

interface SearchOptions {
  debounceTime?: number;
  minSearchLength?: number;
  onSearch?: (term: string) => void;
  searchFields?: string[];
}

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export const useFileSearch = (options: SearchOptions = {}) => {
  const dispatch = useAppDispatch();
  const recentSearches = useAppSelector(state => state.search.recentSearches);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debounceTime = options.debounceTime || 300;
  const minSearchLength = options.minSearchLength || 2;
  const searchFields = options.searchFields || ['name', 'type'];

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        setIsSearching(true);
        options.onSearch?.(term);
        setIsSearching(false);
      }, debounceTime),
    [options, debounceTime]
  );

  // Update search term and trigger search
  const updateSearchTerm = useCallback(
    (term: string) => {
      setSearchTerm(term);
      if (term.length >= minSearchLength) {
        debouncedSearch(term);
      }
    },
    [debouncedSearch, minSearchLength]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    debouncedSearch.cancel();
    options.onSearch?.('');
  }, [debouncedSearch, options]);

  // Add to recent searches
  const addToRecentSearches = useCallback(
    (term: string) => {
      if (term.length >= minSearchLength) {
        dispatch(addRecentSearch(term));
      }
    },
    [dispatch, minSearchLength]
  );

  // Search files function
  const searchFiles = useCallback(
    (files: FileData[], term: string): FileData[] => {
      if (!term || term.length < minSearchLength) {
        return files;
      }

      const searchTerm = term.toLowerCase();
      return files.filter((file) =>
        searchFields.some((field) => {
          const value = file[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm);
          }
          return false;
        })
      );
    },
    [searchFields, minSearchLength]
  );

  // Get search suggestions
  const getSearchSuggestions = useCallback(
    (files: FileData[], term: string): string[] => {
      if (!term || term.length < minSearchLength) {
        return recentSearches;
      }

      const searchTerm = term.toLowerCase();
      const suggestions = new Set<string>();

      // Add matching file names
      files.forEach((file) => {
        searchFields.forEach((field) => {
          const value = file[field];
          if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
            suggestions.add(value);
          }
        });
      });

      // Add recent searches that match
      recentSearches.forEach((recent) => {
        if (recent.toLowerCase().includes(searchTerm)) {
          suggestions.add(recent);
        }
      });

      return Array.from(suggestions).slice(0, 5);
    },
    [searchFields, minSearchLength, recentSearches]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return {
    searchTerm,
    isSearching,
    recentSearches,
    updateSearchTerm,
    clearSearch,
    addToRecentSearches,
    searchFiles,
    getSearchSuggestions,
  };
}; 