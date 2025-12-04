import { z } from 'zod';

// Valid Task tool agent types
export const agentTypeEnum = z.enum([
  't3-stack-developer',
  'e2e-test-engineer',
  'database-architect',
  'ux-design-specialist',
  'ui-animation-specialist',
  'docker-network-architect',
  'redis-cache-architect',
  'azure-bicep-architect',
  'accessible-ui-designer',
  'trpc-backend-engineer',
  'nextjs-frontend-specialist',
  'csharp-infrastructure-consultant',
  'sdlc-manager',
  'general-purpose',
]);

export type AgentType = z.infer<typeof agentTypeEnum>;

// Worker agent status
export const workerAgentStatusEnum = z.enum([
  'spawned',
  'active',
  'completed',
  'failed',
  'cancelled',
]);

export type WorkerAgentStatus = z.infer<typeof workerAgentStatusEnum>;

// Spawn request schema
export const workerAgentConfigSchema = z.object({
  sessionId: z.number().int().positive(),
  specId: z.string().min(1),
  agentType: agentTypeEnum.optional(), // Auto-selected if not provided
});

export type WorkerAgentConfig = z.infer<typeof workerAgentConfigSchema>;

// Worker status response
export const workerAgentStatusSchema = z.object({
  id: z.string(),
  sessionId: z.number().int().positive(),
  specId: z.string(),
  agentType: agentTypeEnum,
  status: workerAgentStatusEnum,
  spawnedAt: z.date(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  retryCount: z.number().int().nonnegative(),
  errorMessage: z.string().nullable(),
});

export type WorkerAgentStatusResponse = z.infer<typeof workerAgentStatusSchema>;

// Progress metrics schema
export const workerAgentProgressSchema = z.object({
  workerId: z.string(),
  status: workerAgentStatusEnum,
  toolsExecuted: z.number().int().nonnegative(),
  successRate: z.number().min(0).max(100), // Percentage
  filesChanged: z.array(z.string()),
  testsRun: z.number().int().nonnegative(),
  testsPassed: z.number().int().nonnegative().nullable(),
  elapsedMs: z.number().int().nonnegative(),
  taskCompletion: z.object({
    completed: z.number().int().nonnegative(),
    total: z.number().int().positive(),
    percentage: z.number().min(0).max(100),
  }),
  lastActivityAt: z.date().nullable(),
  currentTool: z.string().nullable(), // Currently executing tool
});

export type WorkerAgentProgress = z.infer<typeof workerAgentProgressSchema>;

// Query filters
export const workerAgentFilterSchema = z.object({
  projectId: z.number().int().positive().optional(),
  sessionId: z.number().int().positive().optional(),
  specId: z.string().optional(),
  status: workerAgentStatusEnum.optional(),
  limit: z.number().int().positive().max(100).default(50),
});

export type WorkerAgentFilter = z.infer<typeof workerAgentFilterSchema>;

// Worker ID schema
export const workerIdSchema = z.object({
  workerId: z.string().min(1),
});

export type WorkerIdInput = z.infer<typeof workerIdSchema>;

// Retry request schema
export const workerRetrySchema = z.object({
  workerId: z.string().min(1),
  forceAgentType: agentTypeEnum.optional(), // Override agent type for retry
});

export type WorkerRetryInput = z.infer<typeof workerRetrySchema>;

// Hook timeline entry
export const workerHookEntrySchema = z.object({
  hookId: z.number().int().positive(),
  timestamp: z.date(),
  toolName: z.string(),
  success: z.boolean(),
  durationMs: z.number().int().nonnegative(),
  errorMessage: z.string().nullable(),
});

export type WorkerHookEntry = z.infer<typeof workerHookEntrySchema>;

// Hook timeline query
export const workerHookTimelineSchema = z.object({
  workerId: z.string().min(1),
  limit: z.number().int().positive().max(100).default(50),
});

export type WorkerHookTimelineInput = z.infer<typeof workerHookTimelineSchema>;

// Agent selection result
export const agentSelectionResultSchema = z.object({
  agentType: agentTypeEnum,
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
  keywords: z.array(z.string()),
});

export type AgentSelectionResult = z.infer<typeof agentSelectionResultSchema>;
