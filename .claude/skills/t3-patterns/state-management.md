# State Management Patterns

## React Query via tRPC

```typescript
// Automatic caching and refetching
const { data, isLoading, error, refetch } = api.posts.list.useQuery({
  limit: 10,
});

// Optimistic updates
const utils = api.useUtils();

const mutation = api.posts.create.useMutation({
  onMutate: async (newPost) => {
    await utils.posts.list.cancel();
    const previous = utils.posts.list.getData();
    utils.posts.list.setData(undefined, (old) => [...(old ?? []), newPost]);
    return { previous };
  },
  onError: (err, newPost, context) => {
    utils.posts.list.setData(undefined, context?.previous);
  },
  onSettled: () => {
    utils.posts.list.invalidate();
  },
});
```

## Zustand for Client State

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  sidebarOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "light",
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "ui-storage" }
  )
);

// Usage
function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  return sidebarOpen ? <SidebarContent /> : null;
}
```

## Zustand with Slices

```typescript
import { create, StateCreator } from "zustand";

interface UserSlice {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

const createUserSlice: StateCreator<UserSlice & CartSlice, [], [], UserSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
});

const createCartSlice: StateCreator<UserSlice & CartSlice, [], [], CartSlice> = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
});

export const useStore = create<UserSlice & CartSlice>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}));
```

## React Context for Theme/Auth

```typescript
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (user: User) => setUser(user);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

## URL State with nuqs

```typescript
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

export function ProductList() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [category, setCategory] = useQueryState("category");

  // URL: /products?page=2&q=shirt&category=clothing
  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <select value={category ?? ""} onChange={(e) => setCategory(e.target.value || null)}>
        <option value="">All</option>
        <option value="clothing">Clothing</option>
      </select>
      <Pagination page={page} onPageChange={setPage} />
    </div>
  );
}
```

## Combining State Sources

```typescript
export function Dashboard() {
  // Server state via tRPC
  const { data: stats } = api.dashboard.stats.useQuery();

  // Client UI state via Zustand
  const { sidebarOpen } = useUIStore();

  // URL state via nuqs
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("overview"));

  // Auth context
  const { user } = useAuth();

  return (
    <div className={sidebarOpen ? "with-sidebar" : ""}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsContent value="overview">
          <StatsCards stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```
