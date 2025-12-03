import { SQL, sql } from 'drizzle-orm';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Calculate pagination offset from page number and limit
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Wrap query results with pagination metadata
 */
export function createPaginatedResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResult<T> {
  return {
    data,
    pagination: createPaginationMeta(page, limit, total),
  };
}

/**
 * Apply limit and offset to a query
 */
export function applyPagination<T extends SQL>(
  query: T,
  page: number,
  limit: number
): T {
  const offset = getPaginationOffset(page, limit);
  return sql`${query} LIMIT ${limit} OFFSET ${offset}` as T;
}
