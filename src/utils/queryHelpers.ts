/**
 * Helper functions for database queries with pagination
 */

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Helper to add pagination params to URL
 */
export function getPaginationParams(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
} {
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');
  
  return {
    page: Math.max(1, page),
    pageSize: Math.min(100, Math.max(10, pageSize)) // Between 10 and 100
  };
}

/**
 * Calculate pagination offset
 */
export function getPaginationOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Build paginated result
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}
