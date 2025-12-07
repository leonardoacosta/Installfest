# React + TanStack Query Patterns

## Query Client Setup

```typescript
// lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// App.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## API Client

```typescript
// lib/api.ts
const API_BASE = process.env.REACT_APP_API_URL || "/api";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "API error");
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, { method: "DELETE" }),
};
```

## Query Hook

```typescript
// hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  price: number;
}

interface ProductsParams {
  page?: number;
  pageSize?: number;
  category?: string;
}

// Query keys factory
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductsParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", params.page.toString());
      if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
      if (params.category) searchParams.set("category", params.category);

      return api.get<Product[]>(`/products?${searchParams}`);
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => api.get<Product>(`/products/${id}`),
    enabled: !!id,
  });
}
```

## Mutation Hook

```typescript
// hooks/use-product-mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { productKeys } from "./use-products";

interface CreateProductInput {
  name: string;
  price: number;
  categoryId: number;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductInput) =>
      api.post<Product>("/products", data),
    onSuccess: () => {
      // Invalidate all product lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<CreateProductInput>) =>
      api.put<Product>(`/products/${id}`, data),
    onSuccess: (data, variables) => {
      // Update cache directly
      queryClient.setQueryData(productKeys.detail(variables.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

## Component Usage

```typescript
// components/ProductList.tsx
import { useProducts, useDeleteProduct } from "@/hooks/use-products";

export function ProductList() {
  const [page, setPage] = useState(1);
  const { data: products, isLoading, error } = useProducts({ page, pageSize: 10 });
  const deleteProduct = useDeleteProduct();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <ul>
        {products?.map((product) => (
          <li key={product.id}>
            {product.name} - ${product.price}
            <button
              onClick={() => deleteProduct.mutate(product.id)}
              disabled={deleteProduct.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <Pagination page={page} onPageChange={setPage} />
    </div>
  );
}
```

## Optimistic Updates

```typescript
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProductInput) =>
      api.put<Product>(`/products/${id}`, data),

    onMutate: async (newData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: productKeys.detail(newData.id) });

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData<Product>(
        productKeys.detail(newData.id)
      );

      // Optimistically update
      queryClient.setQueryData(productKeys.detail(newData.id), (old: Product) => ({
        ...old,
        ...newData,
      }));

      return { previousProduct };
    },

    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(
        productKeys.detail(newData.id),
        context?.previousProduct
      );
    },

    onSettled: (data, error, variables) => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}
```

## Infinite Query

```typescript
export function useInfiniteProducts(category?: string) {
  return useInfiniteQuery({
    queryKey: ["products", "infinite", category],
    queryFn: ({ pageParam = 1 }) =>
      api.get<{ items: Product[]; nextPage: number | null }>(
        `/products?page=${pageParam}&category=${category || ""}`
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}

// Usage
function ProductInfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Fragment>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? "Loading..." : hasNextPage ? "Load More" : "No more"}
      </button>
    </div>
  );
}
```
