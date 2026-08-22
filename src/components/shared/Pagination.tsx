'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  /** Total row count across every page — when provided, renders a "Showing X to Y of Z" label. */
  totalItems?: number;
  /** Label for the "Showing X to Y of Z <itemLabel>" text (e.g. "partners", "users"). */
  itemLabel?: string;
  className?: string;
}

// Shared pager — numbered buttons with "..." truncation, prev/next, and a page-size <select>.
// Extracted from UserListTable's original client-side pager; every list screen now drives this
// off a REAL totalPages from the backend's { data, pagination } envelope instead of
// Math.ceil(array.length / pageSize).
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  totalItems,
  itemLabel,
  className,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const validPage = Math.min(Math.max(1, page), safeTotalPages);

  // Generate page numbers list for rendering, truncating with '...' once there are more than 7.
  const pageNumbers = useMemo(() => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    if (validPage <= 4) {
      return [1, 2, 3, 4, 5, '...', safeTotalPages];
    }
    if (validPage >= safeTotalPages - 3) {
      return [1, '...', safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages];
    }
    return [1, '...', validPage - 1, validPage, validPage + 1, '...', safeTotalPages];
  }, [safeTotalPages, validPage]);

  const startIndex = totalItems === undefined ? undefined : totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = totalItems === undefined ? undefined : Math.min(validPage * pageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className ?? ''}`}>
      {totalItems !== undefined && (
        <p className="text-xs text-gray-500 font-medium">
          Showing {startIndex} to {endIndex} of {totalItems}{itemLabel ? ` ${itemLabel}` : ''}
        </p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            disabled={validPage === 1}
            onClick={() => onPageChange(Math.max(1, validPage - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {pageNumbers.map((item, idx) => {
            if (item === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="text-xs text-gray-400 px-1">
                  ...
                </span>
              );
            }
            const pageNum = item as number;
            const isActive = pageNum === validPage;
            return (
              <Button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                variant={isActive ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 rounded-lg text-xs font-semibold"
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            disabled={validPage >= safeTotalPages}
            onClick={() => onPageChange(Math.min(safeTotalPages, validPage + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none cursor-pointer"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}/ Page</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
