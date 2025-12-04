import { z } from 'zod';

/**
 * Threshold configuration schema
 */
export const thresholdConfigSchema = z.object({
  id: z.number().int().positive(),
  enabled: z.boolean().default(true),
  minFailedTests: z.number().int().min(0).default(1),
  failureRate: z.number().int().min(0).max(100).default(0),
  includeFlaky: z.boolean().default(false),
  onlyNewFailures: z.boolean().default(true),
  criticalTestPatterns: z.string().optional(), // JSON array
  excludeTestPatterns: z.string().optional(), // JSON array
  rateLimitPerWorkflow: z.number().int().min(0).default(1),
  globalRateLimit: z.number().int().min(0).default(5),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ThresholdConfig = z.infer<typeof thresholdConfigSchema>;

/**
 * Update threshold configuration schema
 */
export const updateThresholdConfigSchema = z.object({
  enabled: z.boolean().optional(),
  minFailedTests: z.number().int().min(0).optional(),
  failureRate: z.number().int().min(0).max(100).optional(),
  includeFlaky: z.boolean().optional(),
  onlyNewFailures: z.boolean().optional(),
  criticalTestPatterns: z.array(z.string()).optional(),
  excludeTestPatterns: z.array(z.string()).optional(),
  rateLimitPerWorkflow: z.number().int().min(0).optional(),
  globalRateLimit: z.number().int().min(0).optional(),
});

export type UpdateThresholdConfigInput = z.infer<typeof updateThresholdConfigSchema>;

/**
 * Validate pattern schema (for testing regex patterns)
 */
export const validatePatternSchema = z.object({
  pattern: z.string(),
  testStrings: z.array(z.string()).optional(),
});

export type ValidatePatternInput = z.infer<typeof validatePatternSchema>;

/**
 * Pattern validation result schema
 */
export const patternValidationResultSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
  matches: z.array(
    z.object({
      input: z.string(),
      matched: z.boolean(),
    })
  ).optional(),
});

export type PatternValidationResult = z.infer<typeof patternValidationResultSchema>;
