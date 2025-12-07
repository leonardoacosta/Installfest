# Integration Test Patterns

## tRPC Router Testing

```typescript
// tests/routers/user.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createCallerFactory } from "@/server/api/trpc";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

const createCaller = createCallerFactory(appRouter);

describe("userRouter", () => {
  let caller: ReturnType<typeof createCaller>;

  beforeEach(async () => {
    // Create test context with mock session
    caller = createCaller({
      db,
      session: {
        user: { id: "test-user-id", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    // Clean up test data
    await db.delete(users).where(eq(users.email, "test@example.com"));
  });

  afterEach(async () => {
    await db.delete(users).where(eq(users.email, "test@example.com"));
  });

  it("creates a user", async () => {
    const result = await caller.user.create({
      name: "Test User",
      email: "test@example.com",
    });

    expect(result).toMatchObject({
      name: "Test User",
      email: "test@example.com",
    });
  });

  it("gets user by id", async () => {
    // Create user first
    const created = await caller.user.create({
      name: "Test User",
      email: "test@example.com",
    });

    const result = await caller.user.getById({ id: created.id });

    expect(result).toMatchObject({
      id: created.id,
      name: "Test User",
    });
  });

  it("throws NOT_FOUND for invalid id", async () => {
    await expect(
      caller.user.getById({ id: "invalid-id" })
    ).rejects.toThrow("NOT_FOUND");
  });
});
```

## Database Integration

```typescript
// tests/db/transactions.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/server/db";
import { orders, orderItems } from "@/server/db/schema";

describe("order transactions", () => {
  beforeEach(async () => {
    await db.delete(orderItems);
    await db.delete(orders);
  });

  it("creates order with items atomically", async () => {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({ userId: "user-1", total: 100 })
        .returning();

      await tx.insert(orderItems).values([
        { orderId: order.id, productId: "prod-1", quantity: 2 },
        { orderId: order.id, productId: "prod-2", quantity: 1 },
      ]);

      return order;
    });

    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, result.id),
    });

    expect(items).toHaveLength(2);
  });

  it("rolls back on error", async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.insert(orders).values({ userId: "user-1", total: 100 });
        throw new Error("Simulated error");
      })
    ).rejects.toThrow("Simulated error");

    const orders = await db.query.orders.findMany();
    expect(orders).toHaveLength(0);
  });
});
```

## API Route Testing

```typescript
// tests/api/webhook.test.ts
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";
import Stripe from "stripe";

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));

describe("Stripe webhook", () => {
  it("handles checkout.session.completed", async () => {
    const mockEvent: Stripe.Event = {
      id: "evt_test",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test",
          metadata: { userId: "user-123" },
          customer: "cus_test",
          subscription: "sub_test",
        } as Stripe.Checkout.Session,
      },
    } as Stripe.Event;

    vi.mocked(Stripe).mockImplementation(() => ({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(mockEvent),
      },
    } as unknown as Stripe));

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "stripe-signature": "test-sig" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

## Service Layer Testing

```typescript
// tests/services/email.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailService } from "@/server/services/email";
import { Resend } from "resend";

vi.mock("resend");

describe("EmailService", () => {
  let emailService: EmailService;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSend = vi.fn().mockResolvedValue({ id: "email-id" });
    vi.mocked(Resend).mockImplementation(() => ({
      emails: { send: mockSend },
    } as unknown as Resend));

    emailService = new EmailService();
  });

  it("sends welcome email", async () => {
    await emailService.sendWelcome({
      to: "user@example.com",
      name: "John",
    });

    expect(mockSend).toHaveBeenCalledWith({
      from: "noreply@app.com",
      to: "user@example.com",
      subject: "Welcome to App!",
      html: expect.stringContaining("John"),
    });
  });

  it("handles send failure", async () => {
    mockSend.mockRejectedValue(new Error("Failed to send"));

    await expect(
      emailService.sendWelcome({ to: "user@example.com", name: "John" })
    ).rejects.toThrow("Failed to send");
  });
});
```

## Test Utilities

```typescript
// tests/utils/test-helpers.ts
import { db } from "@/server/db";
import { users, sessions } from "@/server/db/schema";

export async function createTestUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const [user] = await db
    .insert(users)
    .values({
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      ...overrides,
    })
    .returning();
  return user;
}

export async function createTestSession(userId: string) {
  return {
    user: { id: userId, email: "test@example.com" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

export async function cleanupTestData() {
  await db.delete(sessions);
  await db.delete(users);
}
```

## Test Database Setup

```typescript
// vitest.setup.ts
import { beforeAll, afterAll, afterEach } from "vitest";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, connection } from "@/server/db";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
});

afterEach(async () => {
  // Clean up test data after each test
  // Be careful with this in integration tests
});

afterAll(async () => {
  await connection.end();
});
```
