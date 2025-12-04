import { z } from 'zod';

export const ingestHookSchema = z.object({
  sessionId: z.number().int().positive(),
  hookType: z.string().min(1),
  toolName: z.string().optional(),
  toolInput: z.string().optional(),
  toolOutput: z.string().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
  metadata: z.string().optional(), // JSON string
});

export const hookFilterSchema = z.object({
  sessionId: z.number().int().positive().optional(),
  toolName: z.string().optional(),
  hookType: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type IngestHookInput = z.infer<typeof ingestHookSchema>;
export type HookFilterInput = z.infer<typeof hookFilterSchema>;
