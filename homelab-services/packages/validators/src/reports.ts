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
 * Report status enum
 */
export const reportStatusSchema = z.enum(['passed', 'failed', 'mixed']);

/**
 * Report creation schema
 */
export const createReportSchema = z.object({
  workflowName: z.string().min(1),
  runNumber: z.number().int().positive().optional(),
  hash: z.string().min(1),
  filePath: z.string().min(1),
  totalTests: z.number().int().min(0).default(0),
  passed: z.number().int().min(0).default(0),
  failed: z.number().int().min(0).default(0),
  skipped: z.number().int().min(0).default(0),
  status: reportStatusSchema.default('passed'),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Report response schema
 */
export const reportSchema = createReportSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.date(),
});

export type Report = z.infer<typeof reportSchema>;

/**
 * Report delete schema
 */
export const deleteReportSchema = z.object({
  id: z.number().int().positive(),
});

export type DeleteReportInput = z.infer<typeof deleteReportSchema>;

/**
 * Get workflows schema
 */
export const getWorkflowsSchema = z.object({
  limit: z.number().int().positive().optional(),
});

export type GetWorkflowsInput = z.infer<typeof getWorkflowsSchema>;
