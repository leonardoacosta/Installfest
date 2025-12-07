# Expo Router Patterns

## Basic Layout

```typescript
// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TRPCProvider } from "@/lib/trpc";

export default function RootLayout() {
  return (
    <TRPCProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </TRPCProvider>
  );
}
```

## Tab Navigation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Dynamic Routes

```typescript
// app/post/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import { api } from "@/lib/trpc";

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post } = api.post.getById.useQuery({ id });

  return (
    <View className="flex-1 p-4">
      <Text className="text-xl font-bold">{post?.title}</Text>
    </View>
  );
}

// Navigation
import { Link, router } from "expo-router";

// Declarative
<Link href="/post/123">View Post</Link>

// Imperative
router.push("/post/123");
router.replace("/post/123");
router.back();
```

## Protected Routes

```typescript
// app/(protected)/_layout.tsx
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@repo/auth";

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return <Stack />;
}
```

## Shared tRPC Integration

```typescript
// lib/trpc.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@repo/api";
import { getToken } from "./auth";

export const api = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();

const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: `${process.env.EXPO_PUBLIC_API_URL}/api/trpc`,
      headers: async () => {
        const token = await getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </api.Provider>
  );
}
```
