import { z } from 'zod';

// Spec status enum
export const specStatusSchema = z.enum([
  'proposing',
  'approved',
  'assigned',
  'in_progress',
  'review',
  'applied',
  'archived'
]);

export type SpecStatus = z.infer<typeof specStatusSchema>;

// Trigger types
export const triggerTypeSchema = z.enum(['user', 'system', 'worker']);

export type TriggerType = z.infer<typeof triggerTypeSchema>;

// Verification status
export const verificationStatusSchema = z.enum(['pending', 'tests_passed', 'tests_failed']);

export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

// State transition schema
export const stateTransitionSchema = z.object({
  specId: z.string(),
  fromState: specStatusSchema.nullable(),
  toState: specStatusSchema,
  triggeredBy: triggerTypeSchema,
  triggerUserId: z.number().optional(),
  triggerSessionId: z.number().optional(),
  notes: z.string().optional(),
});

export type StateTransition = z.infer<typeof stateTransitionSchema>;

// Transition request schema
export const transitionRequestSchema = z.object({
  specId: z.string(),
  toState: specStatusSchema,
  notes: z.string().optional(),
  userId: z.number().optional(),
  sessionId: z.number().optional(),
});

export type TransitionRequest = z.infer<typeof transitionRequestSchema>;

// Lifecycle history schema
export const lifecycleHistorySchema = z.object({
  id: z.number(),
  specId: z.string(),
  fromState: specStatusSchema.nullable(),
  toState: specStatusSchema,
  triggeredBy: triggerTypeSchema,
  triggerUserId: z.number().nullable(),
  triggerSessionId: z.number().nullable(),
  transitionedAt: z.date(),
  notes: z.string().nullable(),
});

export type LifecycleHistory = z.infer<typeof lifecycleHistorySchema>;

// Applied spec schema
export const appliedSpecSchema = z.object({
  id: z.number(),
  specId: z.string(),
  projectId: z.number(),
  appliedAt: z.date(),
  appliedBy: z.number().nullable(),
  verificationStatus: verificationStatusSchema,
  verificationNotes: z.string().nullable(),
});

export type AppliedSpec = z.infer<typeof appliedSpecSchema>;

// Applied spec create schema
export const createAppliedSpecSchema = z.object({
  specId: z.string(),
  projectId: z.number(),
  appliedBy: z.number().optional(),
  verificationNotes: z.string().optional(),
});

export type CreateAppliedSpec = z.infer<typeof createAppliedSpecSchema>;

// Verification update schema
export const updateVerificationSchema = z.object({
  specId: z.string(),
  projectId: z.number(),
  status: verificationStatusSchema,
  notes: z.string().optional(),
});

export type UpdateVerification = z.infer<typeof updateVerificationSchema>;

// Approve spec schema
export const approveSpecSchema = z.object({
  specId: z.string(),
  userId: z.number().optional(),
});

export type ApproveSpec = z.infer<typeof approveSpecSchema>;

// Reject spec schema
export const rejectSpecSchema = z.object({
  specId: z.string(),
  reason: z.string(),
  userId: z.number().optional(),
});

export type RejectSpec = z.infer<typeof rejectSpecSchema>;

// Mark applied schema
export const markAppliedSchema = z.object({
  specId: z.string(),
  projectId: z.number(),
  userId: z.number().optional(),
  sessionId: z.number().optional(),
  verificationNotes: z.string().optional(),
});

export type MarkApplied = z.infer<typeof markAppliedSchema>;
