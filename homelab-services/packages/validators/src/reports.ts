import { z } from 'zod';
import { paginationSchema, sortSchema } from './common';
import { dateRangeSchema } from './date-range';

/**
 * Playwright report filter schema
 */
export const reportFilterSchema = paginationSchema
  .merge(sortSchema)
  .merge(dateRangeSchema)
  .extend({
    workflow: z.string().optional(),
    status: z.enum(['passed', 'failed', 'skipped']).optional(),
  });

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;

/**
 * Report creation schema
 */
export const createReportSchema = z.object({
  workflowName: z.string().min(1),
  runNumber: z.number().int().positive(),
  hash: z.string().min(1),
  filePath: z.string().min(1),
  totalTests: z.number().int().min(0),
  passed: z.number().int().min(0),
  failed: z.number().int().min(0),
  skipped: z.number().int().min(0),
  status: z.enum(['passed', 'failed', 'skipped']),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Report response schema
 */
export const reportSchema = createReportSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.string().datetime(),
});

export type Report = z.infer<typeof reportSchema>;
