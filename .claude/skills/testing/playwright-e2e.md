# Playwright E2E Test Patterns

## Test Structure

```typescript
// e2e/tests/feature.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display feature correctly", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Feature" })).toBeVisible();
  });

  test("should handle user interaction", async ({ page }) => {
    await page.getByRole("button", { name: "Click me" }).click();
    await expect(page.getByText("Success")).toBeVisible();
  });
});
```

## Page Object Model

```typescript
// e2e/pages/login.page.ts
import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: "Sign in" });
    this.errorAlert = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL("/dashboard");
  }

  async expectError(message: string) {
    await expect(this.errorAlert).toContainText(message);
  }
}
```

## Auth Fixture

```typescript
// e2e/fixtures/auth.ts
import { test as base, Page } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

type AuthFixtures = {
  authenticatedPage: Page;
  loginPage: LoginPage;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");
    await loginPage.expectLoggedIn();
    await use(page);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

export { expect } from "@playwright/test";
```

## API Mocking

```typescript
test("handles API errors", async ({ page }) => {
  await page.route("**/api/data", (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Server error" }),
    });
  });

  await page.goto("/dashboard");
  await expect(page.getByText("Something went wrong")).toBeVisible();
});

test("mocks successful response", async ({ page }) => {
  await page.route("**/api/users", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ]),
    });
  });

  await page.goto("/users");
  await expect(page.getByText("John")).toBeVisible();
});
```

## Visual Regression

```typescript
test("matches screenshot", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveScreenshot("dashboard.png", {
    maxDiffPixelRatio: 0.01,
  });
});

test("component matches snapshot", async ({ page }) => {
  await page.goto("/components/button");

  const button = page.getByRole("button", { name: "Primary" });
  await expect(button).toHaveScreenshot("button-primary.png");
});
```

## Form Testing

```typescript
test("submits form with validation", async ({ page }) => {
  await page.goto("/contact");

  // Submit empty form
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Name is required")).toBeVisible();

  // Fill and submit
  await page.getByLabel("Name").fill("John Doe");
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Message").fill("Hello world");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("Message sent!")).toBeVisible();
});
```

## Accessibility Testing

```typescript
import AxeBuilder from "@axe-core/playwright";

test("has no accessibility violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## Mobile Testing

```typescript
import { devices } from "@playwright/test";

test.use({ ...devices["iPhone 13"] });

test("works on mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
});
```

## Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```
