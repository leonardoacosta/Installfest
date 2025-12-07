# Payments Integration Patterns

## Stripe Checkout

```typescript
// server: router/payments.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const paymentsRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(z.object({
      priceId: z.string(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await stripe.checkout.sessions.create({
        customer_email: ctx.session.user.email,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: { userId: ctx.session.user.id },
      });

      return { url: session.url };
    }),

  createPortalSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });

      const session = await stripe.billingPortal.sessions.create({
        customer: user!.stripeCustomerId!,
        return_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
      });

      return { url: session.url };
    }),
});
```

## Stripe Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
  }

  return new Response("OK", { status: 200 });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  await db.update(users).set({
    stripeCustomerId: session.customer as string,
    subscriptionStatus: "active",
    subscriptionId: session.subscription as string,
  }).where(eq(users.id, userId));
}
```

## Polar Integration

```typescript
// server: router/polar.ts
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN! });

export const polarRouter = createTRPCRouter({
  createCheckout: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const checkout = await polar.checkouts.custom.create({
        productId: input.productId,
        successUrl: `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
        customerEmail: ctx.session.user.email,
        metadata: { userId: ctx.session.user.id },
      });

      return { url: checkout.url };
    }),

  getProducts: publicProcedure.query(async () => {
    const products = await polar.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID!,
    });
    return products.result.items;
  }),
});
```

## Pricing UI Component

```typescript
"use client";

export function PricingCard({ plan }: { plan: Plan }) {
  const mutation = api.payments.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url!;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <div className="text-3xl font-bold">
          ${plan.price}<span className="text-sm text-muted-foreground">/mo</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => mutation.mutate({
            priceId: plan.stripePriceId,
            successUrl: `${window.location.origin}/checkout/success`,
            cancelUrl: `${window.location.origin}/pricing`,
          })}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Loading..." : "Subscribe"}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## Subscription Guard

```typescript
// middleware or component
export function RequireSubscription({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = api.user.me.useQuery();

  if (isLoading) return <LoadingSpinner />;

  if (user?.subscriptionStatus !== "active") {
    return (
      <div className="text-center py-10">
        <h2>Subscription Required</h2>
        <p>Please subscribe to access this feature.</p>
        <Button asChild>
          <Link href="/pricing">View Plans</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
```
