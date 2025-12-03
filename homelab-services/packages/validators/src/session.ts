import { z } from 'zod';

export const createSessionSchema = z.object({
  projectId: z.number().int().positive(),
});

export const sessionIdSchema = z.object({
  id: z.number().int().positive(),
});

export const sessionFilterSchema = z.object({
  projectId: z.number().int().positive().optional(),
  status: z.enum(['running', 'stopped', 'error']).optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SessionIdInput = z.infer<typeof sessionIdSchema>;
export type SessionFilterInput = z.infer<typeof sessionFilterSchema>;
