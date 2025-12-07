# Monitoring Setup Patterns

## PostHog Analytics

```typescript
// lib/posthog.ts
import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: false, // We'll capture manually
    capture_pageleave: true,
  });
}

// components/posthog-provider.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (pathname) {
      posthog.capture("$pageview", {
        $current_url: window.location.href,
      });
    }
  }, [pathname, searchParams]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Usage in component
import { usePostHog } from "posthog-js/react";

function FeatureButton() {
  const posthog = usePostHog();

  return (
    <Button onClick={() => {
      posthog.capture("feature_clicked", { feature: "export" });
    }}>
      Export
    </Button>
  );
}
```

## Sentry Error Tracking

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
  ],
});

// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Manual error capture
import * as Sentry from "@sentry/nextjs";

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: "payments" },
    extra: { userId: user.id },
  });
}

// User identification
Sentry.setUser({
  id: user.id,
  email: user.email,
});
```

## Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## Application Insights (.NET Integration)

```typescript
// For frontend calling .NET backend
// lib/telemetry.ts

interface TelemetryEvent {
  name: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

export async function trackEvent(event: TelemetryEvent) {
  // Send to backend which forwards to App Insights
  await fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}

// Usage
trackEvent({
  name: "purchase_completed",
  properties: { plan: "pro" },
  measurements: { amount: 29.99 },
});
```

## Custom Metrics Dashboard

```typescript
// server: router/metrics.ts
export const metricsRouter = createTRPCRouter({
  getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
    const [users, revenue, activeUsers] = await Promise.all([
      ctx.db.select({ count: sql<number>`count(*)` }).from(usersTable),
      ctx.db.select({ sum: sql<number>`sum(amount)` }).from(payments),
      ctx.db.select({ count: sql<number>`count(distinct user_id)` })
        .from(sessions)
        .where(gt(sessions.lastActiveAt, sql`now() - interval '7 days'`)),
    ]);

    return {
      totalUsers: users[0]?.count ?? 0,
      totalRevenue: revenue[0]?.sum ?? 0,
      weeklyActiveUsers: activeUsers[0]?.count ?? 0,
    };
  }),
});

// Component
export function MetricCards() {
  const { data } = api.metrics.getDashboardMetrics.useQuery();

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>Total Users</CardHeader>
        <CardContent className="text-3xl font-bold">
          {data?.totalUsers.toLocaleString()}
        </CardContent>
      </Card>
      {/* More cards */}
    </div>
  );
}
```

## Health Check Endpoint

```typescript
// app/api/health/route.ts
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "up",
        cache: "up",
      },
    });
  } catch (error) {
    return Response.json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
```
