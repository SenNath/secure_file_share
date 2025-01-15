import { useState, useCallback, useMemo } from 'react';

interface PaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number, pageSize: number) => void;
}

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export const useFilePagination = (options: PaginationOptions = {}) => {
  const [currentPage, setCurrentPage] = useState(options.defaultPage || 1);
  const [pageSize, setPageSize] = useState(options.defaultPageSize || 10);

  const pageSizeOptions = useMemo(
    () => options.pageSizeOptions || [10, 20, 50, 100],
    [options.pageSizeOptions]
  );

  const changePage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      options.onPageChange?.(page, pageSize);
    },
    [pageSize, options]
  );

  const changePageSize = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when changing page size
      options.onPageChange?.(1, size);
    },
    [options]
  );

  const paginateFiles = useCallback(
    (files: FileData[]): FileData[] => {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return files.slice(startIndex, endIndex);
    },
    [currentPage, pageSize]
  );

  const getPaginationInfo = useCallback(
    (totalItems: number) => {
      const totalPages = Math.ceil(totalItems / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalItems);

      return {
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        startIndex: startIndex + 1,
        endIndex,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      };
    },
    [currentPage, pageSize]
  );

  const getPageNumbers = useCallback(
    (totalItems: number, maxPageButtons = 5): number[] => {
      const totalPages = Math.ceil(totalItems / pageSize);
      const halfMaxButtons = Math.floor(maxPageButtons / 2);

      let startPage = Math.max(currentPage - halfMaxButtons, 1);
      let endPage = Math.min(startPage + maxPageButtons - 1, totalPages);

      if (endPage - startPage + 1 < maxPageButtons) {
        startPage = Math.max(endPage - maxPageButtons + 1, 1);
      }

      return Array.from(
        { length: endPage - startPage + 1 },
        (_, index) => startPage + index
      );
    },
    [currentPage, pageSize]
  );

  const goToFirstPage = useCallback(() => {
    changePage(1);
  }, [changePage]);

  const goToLastPage = useCallback(
    (totalItems: number) => {
      const totalPages = Math.ceil(totalItems / pageSize);
      changePage(totalPages);
    },
    [changePage, pageSize]
  );

  const goToNextPage = useCallback(
    (totalItems: number) => {
      const totalPages = Math.ceil(totalItems / pageSize);
      if (currentPage < totalPages) {
        changePage(currentPage + 1);
      }
    },
    [currentPage, pageSize, changePage]
  );

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      changePage(currentPage - 1);
    }
  }, [currentPage, changePage]);

  return {
    currentPage,
    pageSize,
    pageSizeOptions,
    changePage,
    changePageSize,
    paginateFiles,
    getPaginationInfo,
    getPageNumbers,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
  };
}; 