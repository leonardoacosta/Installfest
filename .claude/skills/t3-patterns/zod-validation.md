# Zod Validation Patterns

## Basic Schemas

```typescript
import { z } from "zod";

// Primitive types
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const dateSchema = z.date();

// With constraints
const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const ageSchema = z.number().min(0).max(120);
const uuidSchema = z.string().uuid();
```

## Object Schemas

```typescript
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateUserSchema = createUserSchema.partial().omit({
  password: true,
  confirmPassword: true,
});

// Type inference
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

## Array and Optional

```typescript
const tagsSchema = z.array(z.string()).min(1).max(10);

const optionalWithDefault = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  search: z.string().optional(),
});
```

## Enum and Union

```typescript
const statusSchema = z.enum(["draft", "published", "archived"]);

const responseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("success"), data: z.unknown() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
```

## Transform and Preprocess

```typescript
// Transform output
const slugSchema = z.string().transform((val) => val.toLowerCase().replace(/\s+/g, "-"));

// Preprocess input
const numberFromString = z.preprocess(
  (val) => (typeof val === "string" ? parseInt(val, 10) : val),
  z.number()
);

// Coerce types
const coercedNumber = z.coerce.number();
const coercedDate = z.coerce.date();
```

## Custom Validation

```typescript
const phoneSchema = z.string().refine(
  (val) => /^\+?[1-9]\d{1,14}$/.test(val),
  { message: "Invalid phone number" }
);

const fileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
}).refine(
  (file) => file.size <= 5 * 1024 * 1024,
  { message: "File must be less than 5MB" }
);
```

## Form Schemas (react-hook-form)

```typescript
export const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const signupFormSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms",
  }),
});
```

## API Input Schemas

```typescript
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSchema = paginationSchema.extend({
  query: z.string().min(1),
  filters: z.record(z.string()).optional(),
});
```

## Nested Objects

```typescript
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().default("US"),
});

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
});
```
