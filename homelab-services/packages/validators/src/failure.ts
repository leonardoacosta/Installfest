import { z } from 'zod';
import { paginationSchema, sortSchema } from './common';

/**
 * Failure classification type enum
 */
export const failureClassificationSchema = z.enum(['NEW', 'FLAKY', 'RECURRING', 'PERSISTENT']);

export type FailureClassification = z.infer<typeof failureClassificationSchema>;

/**
 * Test failure schema (from reports)
 */
export const testFailureSchema = z.object({
  id: z.number().int().positive(),
  reportId: z.number().int().positive(),
  testName: z.string(),
  testFile: z.string().optional(),
  lineNumber: z.number().int().positive().optional(),
  error: z.string().optional(),
  stackTrace: z.string().optional(),
  duration: z.number().int().optional(),
  retries: z.number().int().default(0),
  createdAt: z.date(),
});

export type TestFailure = z.infer<typeof testFailureSchema>;

/**
 * Failure history schema
 */
export const failureHistorySchema = z.object({
  id: z.number().int().positive(),
  testName: z.string(),
  testFile: z.string().optional(),
  lineNumber: z.number().int().positive().optional(),
  firstSeen: z.date(),
  lastSeen: z.date(),
  occurrences: z.number().int().default(1),
  consecutiveFailures: z.number().int().default(1),
  totalRuns: z.number().int().default(1),
  classificationType: failureClassificationSchema.optional(),
});

export type FailureHistory = z.infer<typeof failureHistorySchema>;

/**
 * Failure notification payload (sent to Claude Agent Server)
 */
export const failureNotificationSchema = z.object({
  source: z.string().default('playwright-server'),
  workflow: z.string(),
  runId: z.string().optional(),
  runNumber: z.number().int().positive(),
  reportUrl: z.string().url(),
  failures: z.array(
    z.object({
      testName: z.string(),
      testFile: z.string().optional(),
      lineNumber: z.number().int().positive().optional(),
      error: z.string().optional(),
      stackTrace: z.string().optional(),
      isFlaky: z.boolean().default(false),
      previousFailures: z.number().int().default(0),
      classificationType: failureClassificationSchema.optional(),
    })
  ),
  summary: z.object({
    totalTests: z.number().int(),
    failed: z.number().int(),
    passed: z.number().int(),
    newFailures: z.number().int(),
  }),
});

export type FailureNotification = z.infer<typeof failureNotificationSchema>;

/**
 * List active failures schema
 */
export const listActiveFailuresSchema = paginationSchema
  .merge(sortSchema)
  .extend({
    classificationType: failureClassificationSchema.optional(),
    workflow: z.string().optional(),
  });

export type ListActiveFailuresInput = z.infer<typeof listActiveFailuresSchema>;

/**
 * Get failure history schema
 */
export const getFailureHistorySchema = z.object({
  testName: z.string(),
  limit: z.number().int().positive().default(10),
});

export type GetFailureHistoryInput = z.infer<typeof getFailureHistorySchema>;

/**
 * Classify failure schema
 */
export const classifyFailureSchema = z.object({
  testName: z.string(),
  reportId: z.number().int().positive(),
});

export type ClassifyFailureInput = z.infer<typeof classifyFailureSchema>;

/**
 * Failure statistics schema
 */
export const failureStatsSchema = z.object({
  totalFailures: z.number().int(),
  newFailures: z.number().int(),
  flakyTests: z.number().int(),
  persistentFailures: z.number().int(),
  topFailingTests: z.array(
    z.object({
      testName: z.string(),
      count: z.number().int(),
      classificationType: failureClassificationSchema.optional(),
    })
  ).max(10),
});

export type FailureStats = z.infer<typeof failureStatsSchema>;
