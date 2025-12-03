import { z } from 'zod';

/**
 * Common pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Common ID parameter schema
 */
export const idParamSchema = z.object({
  id: z.number().int().positive(),
});

export type IdParam = z.infer<typeof idParamSchema>;

/**
 * Common string ID parameter schema
 */
export const stringIdParamSchema = z.object({
  id: z.string().min(1),
});

export type StringIdParam = z.infer<typeof stringIdParamSchema>;

/**
 * Common sorting schema
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SortInput = z.infer<typeof sortSchema>;

/**
 * Common search schema
 */
export const searchSchema = z.object({
  query: z.string().optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;

/**
 * Combined list query schema (pagination + sorting + search)
 */
export const listQuerySchema = paginationSchema
  .merge(sortSchema)
  .merge(searchSchema);

export type ListQueryInput = z.infer<typeof listQuerySchema>;
