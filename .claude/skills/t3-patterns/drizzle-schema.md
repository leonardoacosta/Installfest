# Drizzle Schema Patterns

## Basic Table Definition

```typescript
import { pgTable, varchar, uuid, timestamp, text, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## Table with Indexes

```typescript
import { index, uniqueIndex } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: text("content"),
  published: boolean("published").default(false),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("posts_slug_idx").on(table.slug),
  authorIdx: index("posts_author_idx").on(table.authorId),
  publishedIdx: index("posts_published_idx").on(table.published),
}));
```

## Enum Types

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["draft", "published", "archived"]);

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: statusEnum("status").default("draft").notNull(),
});
```

## Relations

```typescript
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  tags: many(postTags),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));
```

## Many-to-Many Junction Table

```typescript
export const postTags = pgTable("post_tags", {
  postId: uuid("post_id").references(() => posts.id).notNull(),
  tagId: uuid("tag_id").references(() => tags.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));
```

## Multi-Tenant Pattern

```typescript
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
}, (table) => ({
  orgIdx: index("projects_org_idx").on(table.organizationId),
}));
```

## Timestamp Helpers

```typescript
// Common timestamp columns
const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  ...timestamps,
});
```
