import { router, publicProcedure } from '../trpc/init';
import { hooks, sessions, type Hook } from '@homelab/db';
import { ingestHookSchema, hookFilterSchema } from '@homelab/validators';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import { hookEmitter } from '../events/hookEmitter';

export const hooksRouter = router({
  ingest: publicProcedure
    .input(ingestHookSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify session exists
      const session = await ctx.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session[0]) {
        throw new Error('Session not found');
      }

      // Insert hook event
      const result = await ctx.db
        .insert(hooks)
        .values({
          sessionId: input.sessionId,
          hookType: input.hookType,
          toolName: input.toolName,
          toolInput: input.toolInput,
          toolOutput: input.toolOutput,
          durationMs: input.durationMs,
          success: input.success,
          errorMessage: input.errorMessage,
          metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        })
        .returning();

      // Emit event for real-time subscribers
      hookEmitter.emitHook({
        ...result[0],
        metadata: input.metadata || null,
      } as any);

      return result[0];
    }),

  list: publicProcedure
    .input(hookFilterSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.sessionId) {
        conditions.push(eq(hooks.sessionId, input.sessionId));
      }

      if (input.toolName) {
        conditions.push(eq(hooks.toolName, input.toolName));
      }

      if (input.hookType) {
        conditions.push(eq(hooks.hookType, input.hookType));
      }

      if (input.from) {
        conditions.push(gte(hooks.timestamp, new Date(input.from)));
      }

      if (input.to) {
        conditions.push(lte(hooks.timestamp, new Date(input.to)));
      }

      const result = await ctx.db
        .select()
        .from(hooks)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(hooks.timestamp))
        .limit(input.limit);

      // Parse metadata JSON
      return result.map((hook) => ({
        ...hook,
        metadata: hook.metadata ? JSON.parse(hook.metadata) : null,
      }));
    }),

  stats: publicProcedure
    .input(z.object({ sessionId: z.number().int().positive().optional() }))
    .query(async ({ ctx, input }) => {
      // This is a simplified version - in production, use SQL aggregations
      const conditions = input.sessionId
        ? [eq(hooks.sessionId, input.sessionId)]
        : [];

      const allHooks = await ctx.db
        .select()
        .from(hooks)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Group by hook type
      const stats: Record<string, {
        count: number;
        avgDuration: number;
        successCount: number;
      }> = {};

      allHooks.forEach((hook) => {
        if (!stats[hook.hookType]) {
          stats[hook.hookType] = {
            count: 0,
            avgDuration: 0,
            successCount: 0,
          };
        }

        stats[hook.hookType].count += 1;
        stats[hook.hookType].avgDuration += hook.durationMs || 0;
        if (hook.success) {
          stats[hook.hookType].successCount += 1;
        }
      });

      // Calculate averages
      Object.keys(stats).forEach((hookType) => {
        stats[hookType].avgDuration =
          stats[hookType].avgDuration / stats[hookType].count;
      });

      return Object.entries(stats).map(([hookType, data]) => ({
        hookType,
        ...data,
      }));
    }),

  subscribe: publicProcedure
    .input(z.object({
      sessionId: z.number().int().positive().optional()
    }))
    .subscription(({ input }) => {
      return observable<Hook & { metadata: any }>((emit) => {
        const onHook = (hook: Hook & { metadata: any }) => {
          // Filter by session if specified
          if (!input.sessionId || hook.sessionId === input.sessionId) {
            emit.next(hook);
          }
        };

        // Subscribe to hook events
        const unsubscribe = hookEmitter.onHook(onHook);

        // Return cleanup function
        return () => {
          unsubscribe();
        };
      });
    }),
});
