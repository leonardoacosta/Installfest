# tRPC Router Patterns

## Basic Router Structure

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const featureRouter = createTRPCRouter({
  // Public query - no auth required
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.items.findMany({
        limit: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return { items, nextCursor };
    }),

  // Protected query - requires auth
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.query.items.findFirst({
        where: eq(items.id, input.id),
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  // Mutation - create
  create: protectedProcedure
    .input(createItemSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(items).values({
        ...input,
        userId: ctx.session.user.id,
      }).returning();
    }),

  // Mutation - update
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateItemSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(items)
        .set({ ...input.data, updatedAt: new Date() })
        .where(and(
          eq(items.id, input.id),
          eq(items.userId, ctx.session.user.id),
        ))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  // Mutation - delete
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(items)
        .where(and(
          eq(items.id, input.id),
          eq(items.userId, ctx.session.user.id),
        ));
      return { success: true };
    }),
});
```

## Router with Relations

```typescript
export const postRouter = createTRPCRouter({
  getWithComments: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.id),
        with: {
          author: { columns: { id: true, name: true, image: true } },
          comments: {
            orderBy: desc(comments.createdAt),
            limit: 10,
            with: { author: { columns: { name: true } } },
          },
        },
      });
    }),
});
```

## Subscription Pattern

```typescript
export const notificationRouter = createTRPCRouter({
  onNew: protectedProcedure.subscription(async function* ({ ctx }) {
    const userId = ctx.session.user.id;

    while (true) {
      const notification = await waitForNotification(userId);
      yield notification;
    }
  }),
});
```

## Middleware Pattern

```typescript
const loggedProcedure = publicProcedure.use(async ({ ctx, next, path }) => {
  const start = Date.now();
  const result = await next();
  console.log(`${path} took ${Date.now() - start}ms`);
  return result;
});

const ownerProcedure = protectedProcedure.use(async ({ ctx, next, input }) => {
  const item = await ctx.db.query.items.findFirst({
    where: eq(items.id, input.id),
  });
  if (item?.userId !== ctx.session.user.id) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, item } });
});
```
