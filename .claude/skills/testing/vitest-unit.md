# Vitest Unit Test Patterns

## Basic Test Structure

```typescript
// utils.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatDate, calculateTotal } from "./utils";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("January 15, 2024");
  });

  it("handles invalid date", () => {
    expect(formatDate(null)).toBe("Invalid date");
  });
});

describe("calculateTotal", () => {
  it("sums items correctly", () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];
    expect(calculateTotal(items)).toBe(35);
  });

  it("returns 0 for empty array", () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

## Mocking

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock module
vi.mock("./api", () => ({
  fetchUser: vi.fn(),
}));

import { fetchUser } from "./api";
import { getUserName } from "./user-service";

describe("getUserName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user name", async () => {
    vi.mocked(fetchUser).mockResolvedValue({ id: 1, name: "John" });

    const name = await getUserName(1);
    expect(name).toBe("John");
    expect(fetchUser).toHaveBeenCalledWith(1);
  });

  it("handles errors", async () => {
    vi.mocked(fetchUser).mockRejectedValue(new Error("Not found"));

    await expect(getUserName(1)).rejects.toThrow("Not found");
  });
});
```

## Spy Functions

```typescript
import { vi, describe, it, expect } from "vitest";

describe("event handler", () => {
  it("calls callback on event", () => {
    const callback = vi.fn();
    const handler = createEventHandler(callback);

    handler.trigger("click");

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ type: "click" });
  });
});
```

## Timer Mocking

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces function calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

## Testing React Components

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when loading", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

## Testing Hooks

```typescript
// useCounter.test.ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("starts with initial value", () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it("increments count", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("decrements count", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

## Snapshot Testing

```typescript
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <Card title="Test" description="A test card" />
    );
    expect(container).toMatchSnapshot();
  });
});
```

## Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "**/*.test.{ts,tsx}"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

## Setup File

```typescript
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

## Testing Async Functions

```typescript
import { describe, it, expect } from "vitest";

describe("async operations", () => {
  it("resolves with data", async () => {
    const data = await fetchData();
    expect(data).toEqual({ id: 1, name: "Test" });
  });

  it("rejects with error", async () => {
    await expect(fetchInvalidData()).rejects.toThrow("Invalid ID");
  });
});
```
