import { z } from 'zod';

/**
 * OpenSpec spec schema (full spec with content)
 */
export const openspecSpecSchema = z.object({
  id: z.string().min(1),
  projectId: z.number().int().positive(),
  title: z.string().min(1),
  status: z.enum(['proposing', 'approved', 'assigned', 'in_progress', 'review', 'done', 'archived']).default('proposing'),
  proposalContent: z.string().nullable(),
  tasksContent: z.string().nullable(),
  designContent: z.string().nullable(),
  lastSyncedAt: z.date().nullable(),
  filesystemModifiedAt: z.date().nullable(),
  dbModifiedAt: z.date().nullable(),
  syncError: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OpenspecSpec = z.infer<typeof openspecSpecSchema>;

/**
 * OpenSpec spec creation input
 */
export const createOpenspecSpecSchema = z.object({
  id: z.string().min(1),
  projectId: z.number().int().positive(),
  title: z.string().min(1),
  status: z.enum(['proposing', 'approved', 'assigned', 'in_progress', 'review', 'done', 'archived']).optional(),
  proposalContent: z.string().nullable().optional(),
  tasksContent: z.string().nullable().optional(),
  designContent: z.string().nullable().optional(),
});

export type CreateOpenspecSpec = z.infer<typeof createOpenspecSpecSchema>;

/**
 * OpenSpec spec update input
 */
export const updateOpenspecSpecSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['proposing', 'approved', 'assigned', 'in_progress', 'review', 'done', 'archived']).optional(),
  proposalContent: z.string().nullable().optional(),
  tasksContent: z.string().nullable().optional(),
  designContent: z.string().nullable().optional(),
});

export type UpdateOpenspecSpec = z.infer<typeof updateOpenspecSpecSchema>;

/**
 * Sync conflict detection result
 */
export const syncConflictSchema = z.object({
  specId: z.string().min(1),
  filesystemModifiedAt: z.date(),
  dbModifiedAt: z.date(),
  lastSyncedAt: z.date(),
  conflictType: z.enum(['both_modified', 'filesystem_deleted', 'db_deleted']),
});

export type SyncConflict = z.infer<typeof syncConflictSchema>;

/**
 * Sync status response
 */
export const syncStatusSchema = z.object({
  specId: z.string().min(1),
  lastSyncedAt: z.date().nullable(),
  syncError: z.string().nullable(),
  filesystemModifiedAt: z.date().nullable(),
  dbModifiedAt: z.date().nullable(),
  hasConflict: z.boolean(),
  isStale: z.boolean(), // True if not synced in >30s
});

export type SyncStatus = z.infer<typeof syncStatusSchema>;

/**
 * Sync history record
 */
export const syncHistorySchema = z.object({
  id: z.number().int().positive(),
  specId: z.string().min(1),
  syncDirection: z.enum(['fs_to_db', 'db_to_fs']),
  triggeredBy: z.enum(['file_watcher', 'periodic', 'user_edit', 'manual']),
  success: z.boolean(),
  errorMessage: z.string().nullable(),
  filesChanged: z.array(z.string()).nullable(),
  syncedAt: z.date(),
});

export type SyncHistoryRecord = z.infer<typeof syncHistorySchema>;

/**
 * Proposal markdown structure
 */
export const proposalMarkdownSchema = z.object({
  title: z.string().min(1),
  why: z.string().min(1),
  whatChanges: z.string().min(1),
  impact: z.string().min(1),
});

export type ProposalMarkdown = z.infer<typeof proposalMarkdownSchema>;

/**
 * Task item in tasks.md
 */
export const taskItemSchema = z.object({
  id: z.string().min(1), // e.g., "1.1", "2.3"
  title: z.string().min(1),
  completed: z.boolean(),
  subtasks: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    completed: z.boolean(),
  })).optional(),
});

export type TaskItem = z.infer<typeof taskItemSchema>;

/**
 * Tasks markdown structure
 */
export const tasksMarkdownSchema = z.object({
  tasks: z.array(taskItemSchema),
});

export type TasksMarkdown = z.infer<typeof tasksMarkdownSchema>;

/**
 * Design markdown structure (flexible, no strict schema)
 */
export const designMarkdownSchema = z.object({
  content: z.string().min(1),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).optional(),
});

export type DesignMarkdown = z.infer<typeof designMarkdownSchema>;

/**
 * Sync input parameters
 */
export const syncSpecInputSchema = z.object({
  specId: z.string().min(1),
  immediate: z.boolean().default(false),
});

export type SyncSpecInput = z.infer<typeof syncSpecInputSchema>;

/**
 * Force sync input
 */
export const forceSyncInputSchema = z.object({
  projectId: z.number().int().positive().optional(),
  specId: z.string().min(1).optional(),
});

export type ForceSyncInput = z.infer<typeof forceSyncInputSchema>;

/**
 * Resolve conflict input
 */
export const resolveConflictInputSchema = z.object({
  specId: z.string().min(1),
  resolution: z.enum(['filesystem_wins', 'db_wins']),
});

export type ResolveConflictInput = z.infer<typeof resolveConflictInputSchema>;

/**
 * Get sync history input
 */
export const getSyncHistoryInputSchema = z.object({
  specId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetSyncHistoryInput = z.infer<typeof getSyncHistoryInputSchema>;
