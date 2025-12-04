import { z } from 'zod';
import { paginationSchema, sortSchema } from './common';
import { failureClassificationSchema } from './failure';

/**
 * Remediation status enum
 */
export const remediationStatusSchema = z.enum([
  'pending',
  'in_progress',
  'fixed',
  'failed',
  'skipped',
]);

export type RemediationStatus = z.infer<typeof remediationStatusSchema>;

/**
 * Remediation attempt schema
 */
export const remediationAttemptSchema = z.object({
  id: z.number().int().positive(),
  reportId: z.number().int().positive(),
  testName: z.string(),
  claudeSessionId: z.string().optional(),
  triggeredAt: z.date(),
  completedAt: z.date().optional(),
  status: remediationStatusSchema,
  fixDescription: z.string().optional(),
  prUrl: z.string().url().optional(),
  rerunReportId: z.number().int().positive().optional(),
  rerunPassed: z.boolean().optional(),
  errorMessage: z.string().optional(),
  classificationType: failureClassificationSchema.optional(),
});

export type RemediationAttempt = z.infer<typeof remediationAttemptSchema>;

/**
 * Create remediation attempt schema
 */
export const createRemediationAttemptSchema = z.object({
  reportId: z.number().int().positive(),
  testName: z.string(),
  claudeSessionId: z.string().optional(),
  status: remediationStatusSchema.default('pending'),
  classificationType: failureClassificationSchema.optional(),
});

export type CreateRemediationAttemptInput = z.infer<typeof createRemediationAttemptSchema>;

/**
 * Update remediation attempt schema
 */
export const updateRemediationAttemptSchema = z.object({
  id: z.number().int().positive(),
  status: remediationStatusSchema.optional(),
  completedAt: z.date().optional(),
  fixDescription: z.string().optional(),
  prUrl: z.string().url().optional(),
  rerunReportId: z.number().int().positive().optional(),
  rerunPassed: z.boolean().optional(),
  errorMessage: z.string().optional(),
});

export type UpdateRemediationAttemptInput = z.infer<typeof updateRemediationAttemptSchema>;

/**
 * List remediation attempts schema
 */
export const listRemediationAttemptsSchema = paginationSchema
  .merge(sortSchema)
  .extend({
    status: remediationStatusSchema.optional(),
    testName: z.string().optional(),
    workflow: z.string().optional(),
  });

export type ListRemediationAttemptsInput = z.infer<typeof listRemediationAttemptsSchema>;

/**
 * Trigger remediation schema
 */
export const triggerRemediationSchema = z.object({
  reportId: z.number().int().positive(),
  testName: z.string().optional(), // Optional: specific test or all failed tests
  force: z.boolean().default(false), // Force even if below threshold
});

export type TriggerRemediationInput = z.infer<typeof triggerRemediationSchema>;

/**
 * Remediation statistics schema
 */
export const remediationStatsSchema = z.object({
  totalAttempts: z.number().int(),
  successfulFixes: z.number().int(),
  failedAttempts: z.number().int(),
  pendingAttempts: z.number().int(),
  averageTimeToFix: z.number(), // in seconds
  successRate: z.number(), // percentage
  byClassification: z.array(
    z.object({
      classificationType: failureClassificationSchema,
      count: z.number().int(),
      successRate: z.number(),
    })
  ),
  topFixedTests: z.array(
    z.object({
      testName: z.string(),
      attempts: z.number().int(),
      successRate: z.number(),
    })
  ).max(10),
});

export type RemediationStats = z.infer<typeof remediationStatsSchema>;
