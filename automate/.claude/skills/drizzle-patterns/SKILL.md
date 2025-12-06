---
name: drizzle-patterns
description: Drizzle ORM schema patterns for Otaku Odyssey. Use when creating or modifying database schemas, migrations, or relations.
allowed-tools: Read, Write, Edit, Bash
---

# Drizzle ORM Patterns for Otaku Odyssey

## Schema Definition

Every table follows this pattern:

```typescript
import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  json,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Enums are defined outside the table
export const featureStatusEnum = pgEnum("feature_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
]);

// Table definition
export const features = pgTable("features", {
  // Primary key - always use cuid2
  id: text("id").primaryKey().$defaultFn(() => createId()),
  
  // Foreign keys
  conventionId: text("convention_id")
    .notNull()
    .references(() => conventions.id, { onDelete: "cascade" }),
  
  // Core fields
  name: text("name").notNull(),
  description: text("description"),
  
  // Status enum
  status: featureStatusEnum("status").default("draft").notNull(),
  
  // Numeric fields
  price: decimal("price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(0),
  
  // Boolean fields
  isActive: boolean("is_active").default(true).notNull(),
  
  // JSON fields (for flexible data)
  metadata: json("metadata").$type<Record<string, unknown>>(),
  
  // ALWAYS include audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Optional: soft delete
  deletedAt: timestamp("deleted_at"),
  
  // Optional: created by user
  createdBy: text("created_by").references(() => users.id),
});
```

## Relations

Define relations separately from the table:

```typescript
// One-to-Many: Convention has many features
export const featuresRelations = relations(features, ({ one, many }) => ({
  // Many-to-one: Feature belongs to Convention
  convention: one(conventions, {
    fields: [features.conventionId],
    references: [conventions.id],
  }),
  
  // One-to-many: Feature has many items
  items: many(featureItems),
  
  // Many-to-one: Feature created by User
  creator: one(users, {
    fields: [features.createdBy],
    references: [users.id],
  }),
}));

// Define the inverse relation on the parent
export const conventionsRelations = relations(conventions, ({ many }) => ({
  features: many(features),
  sponsors: many(sponsors),
  vendors: many(vendors),
}));
```

## Many-to-Many Relations

Use a junction table:

```typescript
// Junction table for many-to-many
export const sponsorBenefits = pgTable("sponsor_benefits", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  sponsorTierId: text("sponsor_tier_id")
    .notNull()
    .references(() => sponsorTiers.id, { onDelete: "cascade" }),
  benefitId: text("benefit_id")
    .notNull()
    .references(() => benefits.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for junction table
export const sponsorBenefitsRelations = relations(sponsorBenefits, ({ one }) => ({
  sponsorTier: one(sponsorTiers, {
    fields: [sponsorBenefits.sponsorTierId],
    references: [sponsorTiers.id],
  }),
  benefit: one(benefits, {
    fields: [sponsorBenefits.benefitId],
    references: [benefits.id],
  }),
}));
```

## Index File Export

Always export from `src/db/schema/index.ts`:

```typescript
// Export tables
export * from "./conventions";
export * from "./users";
export * from "./features";
export * from "./sponsors";

// If you have enums, export them too
export { featureStatusEnum } from "./features";
```

## Common Column Patterns

### Money/Currency
```typescript
price: decimal("price", { precision: 10, scale: 2 }).notNull(),
```

### Dates/Times
```typescript
startDate: timestamp("start_date").notNull(),
endDate: timestamp("end_date").notNull(),
checkInTime: timestamp("check_in_time"),
```

### Soft Delete
```typescript
deletedAt: timestamp("deleted_at"),
isDeleted: boolean("is_deleted").default(false).notNull(),
```

### Application Status Workflow
```typescript
export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "waitlisted",
  "cancelled",
]);
```

### Contact Information (JSON)
```typescript
contactInfo: json("contact_info").$type<{
  email: string;
  phone?: string;
  website?: string;
  social?: {
    twitter?: string;
    instagram?: string;
  };
}>(),
```

## Migration Commands

```bash
# Generate migration after schema changes
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Open Drizzle Studio
pnpm drizzle-kit studio

# Push schema directly (dev only)
pnpm drizzle-kit push
```

## Query Patterns

```typescript
// Find with relations
const feature = await db.query.features.findFirst({
  where: eq(features.id, id),
  with: {
    convention: true,
    items: {
      with: {
        category: true,
      },
    },
  },
});

// Insert returning
const [created] = await db
  .insert(features)
  .values({ ...input })
  .returning();

// Update returning
const [updated] = await db
  .update(features)
  .set({ ...changes, updatedAt: new Date() })
  .where(eq(features.id, id))
  .returning();

// Soft delete
await db
  .update(features)
  .set({ deletedAt: new Date() })
  .where(eq(features.id, id));

// Count with filter
const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(features)
  .where(eq(features.conventionId, conventionId));
```

## Checklist for New Schemas

- [ ] Use text() with cuid2 for primary key
- [ ] Define foreign keys with appropriate onDelete
- [ ] Include createdAt and updatedAt timestamps
- [ ] Define relations in separate declaration
- [ ] Export from schema/index.ts
- [ ] Generate migration with drizzle-kit generate
- [ ] Test migration with drizzle-kit migrate
