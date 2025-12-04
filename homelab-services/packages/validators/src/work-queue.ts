import { z } from 'zod';

export const workQueueStatusEnum = z.enum(['queued', 'assigned', 'blocked', 'completed']);

export const workQueueItemSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  specId: z.string(),
  priority: z.number().min(1).max(5),
  position: z.number().int().min(0),
  status: workQueueStatusEnum,
  blockedBy: z.string().nullable(),
  addedAt: z.date(),
  assignedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
});

export const workQueueFilterSchema = z.object({
  projectId: z.number().optional(),
  statuses: z.array(workQueueStatusEnum).optional(),
  priorityMin: z.number().min(1).max(5).optional(),
  priorityMax: z.number().min(1).max(5).optional(),
});

export const workQueueReorderItemSchema = z.object({
  workItemId: z.number(),
  newPosition: z.number().int().min(0),
});

export const workQueueReorderSchema = z.object({
  projectId: z.number(),
  newOrder: z.array(workQueueReorderItemSchema),
});

export const addWorkItemSchema = z.object({
  projectId: z.number(),
  specId: z.string(),
  priority: z.number().min(1).max(5).optional().default(3),
});

export const assignWorkItemSchema = z.object({
  workItemId: z.number(),
  sessionId: z.number(),
});

export const blockWorkItemSchema = z.object({
  workItemId: z.number(),
  blockedBySpecId: z.string(),
});

export type WorkQueueStatus = z.infer<typeof workQueueStatusEnum>;
export type WorkQueueItem = z.infer<typeof workQueueItemSchema>;
export type WorkQueueFilter = z.infer<typeof workQueueFilterSchema>;
export type WorkQueueReorder = z.infer<typeof workQueueReorderSchema>;
export type AddWorkItem = z.infer<typeof addWorkItemSchema>;
export type AssignWorkItem = z.infer<typeof assignWorkItemSchema>;
export type BlockWorkItem = z.infer<typeof blockWorkItemSchema>;
