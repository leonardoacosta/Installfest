import { z } from 'zod';

export const ingestHookSchema = z.object({
  sessionId: z.number().int().positive(),
  hookType: z.string().min(1),
  toolName: z.string().optional(),
  toolInput: z.string().optional(),
  toolOutput: z.string().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  success: z.boolean().optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const hookFilterSchema = z.object({
  sessionId: z.number().int().positive().optional(),
  toolName: z.string().optional(),
  hookType: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().positive().max(1000).default(100),
});

export type IngestHookInput = z.infer<typeof ingestHookSchema>;
export type HookFilterInput = z.infer<typeof hookFilterSchema>;
