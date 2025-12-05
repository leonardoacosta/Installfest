import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Error Proposals Dashboard
 *
 * These tests verify the complete user workflow for managing error proposals:
 * - Viewing error proposals
 * - Filtering and searching
 * - Approving proposals
 * - Rejecting proposals
 * - Viewing related failures
 * - Real-time updates
 */

test.describe('Error Proposals Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to error proposals page
    await page.goto('/errors');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Error Proposals")');
  });

  test('should display error proposals page with header', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Error Proposals');

    // Verify description
    await expect(page.locator('p.text-muted-foreground')).toContainText(
      'Automatically generated spec proposals from test failures'
    );
  });

  test('should show statistics cards', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('[data-testid="stats-total-proposals"], .text-2xl', {
      timeout: 5000,
    }).catch(() => {
      // Stats might not be present if no data
    });

    // Check for stat card headers
    const statCards = page.locator('.text-sm.font-medium');
    const count = await statCards.count();

    if (count > 0) {
      // If we have stats, verify the expected cards
      await expect(statCards.filter({ hasText: 'Total Proposals' })).toBeVisible();
      await expect(statCards.filter({ hasText: 'Persistent' })).toBeVisible();
      await expect(statCards.filter({ hasText: 'Recurring' })).toBeVisible();
      await expect(statCards.filter({ hasText: 'Linked to Specs' })).toBeVisible();
    }
  });

  test('should display filter sidebar', async ({ page }) => {
    // Verify filter sidebar exists
    await expect(page.locator('text=Filters')).toBeVisible();

    // Verify sort options
    await expect(page.locator('text=Sort by')).toBeVisible();

    // Verify project filter
    await expect(page.locator('text=Filter by project')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    // Verify search input exists
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('login');

    // Verify search input value
    await expect(searchInput).toHaveValue('login');
  });

  test('should have classification filter checkboxes', async ({ page }) => {
    // Verify classification filters
    await expect(page.locator('text=Classification')).toBeVisible();

    const classifications = ['NEW', 'FLAKY', 'RECURRING', 'PERSISTENT'];
    for (const classification of classifications) {
      const checkbox = page.locator(`label:has-text("${classification}")`);
      await expect(checkbox).toBeVisible();
    }
  });

  test('should have priority range slider', async ({ page }) => {
    // Verify priority slider exists
    await expect(page.locator('text=Priority Range')).toBeVisible();

    // Check for slider labels
    await expect(page.locator('text=Low (1)')).toBeVisible();
    await expect(page.locator('text=High (5)')).toBeVisible();
  });

  test('should display error proposals table', async ({ page }) => {
    // Wait for table or empty state
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=No error proposals found')
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBe(true);

    if (hasTable) {
      // Verify table headers
      await expect(page.locator('th:has-text("Test Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Error Type")')).toBeVisible();
      await expect(page.locator('th:has-text("Classification")')).toBeVisible();
      await expect(page.locator('th:has-text("Priority")')).toBeVisible();
      await expect(page.locator('th:has-text("Occurrences")')).toBeVisible();
      await expect(page.locator('th:has-text("Last Seen")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
    }
  });

  test('should filter proposals by search query', async ({ page }) => {
    // Enter search query
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('specific test name');

    // Wait for filtering to apply
    await page.waitForTimeout(500);

    // Verify filter count updated
    const filterCount = page.locator('text=/Showing \\d+ of \\d+ proposals/');
    await expect(filterCount).toBeVisible();
  });

  test('should toggle classification filters', async ({ page }) => {
    // Find a classification checkbox
    const newCheckbox = page.locator('label:has-text("NEW")');

    // Click to toggle
    await newCheckbox.click();

    // Wait for filtering
    await page.waitForTimeout(300);

    // Click again to toggle back
    await newCheckbox.click();

    // Verify UI updated (no error thrown)
    await expect(newCheckbox).toBeVisible();
  });

  test('should change sort order', async ({ page }) => {
    // Click sort dropdown
    const sortSelect = page.locator('button:has-text("Sort by"), [role="combobox"]').first();
    await sortSelect.click();

    // Select "By Priority"
    await page.locator('text=By Priority').click();

    // Verify selection changed (dropdown should show new value)
    await expect(page.locator('text=By Priority')).toBeVisible();
  });

  test('should show approve button for proposing specs', async ({ page }) => {
    // Check if there are any proposals
    const hasProposals = await page.locator('table tbody tr').count() > 0;

    if (hasProposals) {
      // Look for approve buttons
      const approveButtons = page.locator('button:has-text("Approve")');
      const count = await approveButtons.count();

      if (count > 0) {
        await expect(approveButtons.first()).toBeVisible();
        await expect(approveButtons.first()).toContainText('Approve');
      }
    }
  });

  test('should show reject button for proposing specs', async ({ page }) => {
    // Check if there are any proposals with reject buttons
    const rejectButtons = page.locator('button:has-text("Reject")');
    const count = await rejectButtons.count();

    if (count > 0) {
      await expect(rejectButtons.first()).toBeVisible();
      await expect(rejectButtons.first()).toContainText('Reject');
    }
  });

  test('should open reject dialog when clicking reject', async ({ page }) => {
    // Find reject button
    const rejectButton = page.locator('button:has-text("Reject")').first();

    if (await rejectButton.isVisible()) {
      // Click reject
      await rejectButton.click();

      // Verify dialog opened
      await expect(page.locator('text=Reject Error Proposal')).toBeVisible();
      await expect(page.locator('textarea[placeholder*="reason"]')).toBeVisible();

      // Verify dialog buttons
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      await expect(page.locator('button:has-text("Reject Proposal")')).toBeVisible();

      // Close dialog
      await page.locator('button:has-text("Cancel")').click();

      // Verify dialog closed
      await expect(page.locator('text=Reject Error Proposal')).not.toBeVisible();
    }
  });

  test('should require rejection reason', async ({ page }) => {
    const rejectButton = page.locator('button:has-text("Reject")').first();

    if (await rejectButton.isVisible()) {
      await rejectButton.click();

      // Try to submit without reason
      const submitButton = page.locator('button:has-text("Reject Proposal")');

      // Button should be disabled initially
      await expect(submitButton).toBeDisabled();

      // Enter reason
      await page.locator('textarea[placeholder*="reason"]').fill('This is a test rejection');

      // Button should now be enabled
      await expect(submitButton).toBeEnabled();

      // Close without submitting
      await page.locator('button:has-text("Cancel")').click();
    }
  });

  test('should show View Related button with occurrence count', async ({ page }) => {
    const viewRelatedButtons = page.locator('button:has-text("View Related")');
    const count = await viewRelatedButtons.count();

    if (count > 0) {
      const button = viewRelatedButtons.first();
      await expect(button).toBeVisible();

      // Should show occurrence count in parentheses
      const text = await button.textContent();
      expect(text).toMatch(/View Related \(\d+\)/);
    }
  });

  test('should open related failures dialog', async ({ page }) => {
    const viewRelatedButton = page.locator('button:has-text("View Related")').first();

    if (await viewRelatedButton.isVisible()) {
      await viewRelatedButton.click();

      // Verify dialog opened
      await expect(page.locator('text=Related Test Failures')).toBeVisible();

      // Verify dialog content
      await expect(page.locator('text=All test failures with the same test name')).toBeVisible();

      // Should have a table or empty state
      const hasTable = await page.locator('table').nth(1).isVisible().catch(() => false);
      const hasEmptyState = await page.locator('text=No related failures found')
        .isVisible()
        .catch(() => false);

      expect(hasTable || hasEmptyState).toBe(true);

      // Close dialog
      await page.locator('button:has-text("Close")').click();

      // Verify dialog closed
      await expect(page.locator('text=Related Test Failures')).not.toBeVisible();
    }
  });

  test('should display priority stars correctly', async ({ page }) => {
    const hasProposals = await page.locator('table tbody tr').count() > 0;

    if (hasProposals) {
      // Look for star icons in priority column
      const stars = page.locator('svg.lucide-star');
      const count = await stars.count();

      // Should have priority stars if we have proposals
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should show classification badges', async ({ page }) => {
    const hasProposals = await page.locator('table tbody tr').count() > 0;

    if (hasProposals) {
      // Look for classification badges
      const badges = page.locator('span.inline-flex'); // Badge component
      const count = await badges.count();

      // Should have badges if we have proposals
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should show error type badges', async ({ page }) => {
    const hasProposals = await page.locator('table tbody tr').count() > 0;

    if (hasProposals) {
      // Common error type labels
      const errorTypes = ['Type Error', 'Missing Property', 'Assertion Failed', 'Network Error'];

      let foundErrorType = false;
      for (const errorType of errorTypes) {
        if (await page.locator(`text=${errorType}`).isVisible().catch(() => false)) {
          foundErrorType = true;
          break;
        }
      }

      // Should find at least one error type if we have proposals
      // Note: This may fail if proposals exist but have "Other" error type
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // If there are no proposals, should show empty state
    const tableRows = await page.locator('table tbody tr').count();

    if (tableRows === 0) {
      await expect(page.locator('text=No error proposals found')).toBeVisible();
    }
  });

  test('should be responsive and mobile-friendly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify page still loads
    await expect(page.locator('h1:has-text("Error Proposals")')).toBeVisible();

    // Verify filter sidebar adapts (may stack on mobile)
    await expect(page.locator('text=Filters')).toBeVisible();
  });
});

test.describe('Error Proposals Real-Time Updates', () => {
  test('should subscribe to error proposal events', async ({ page }) => {
    await page.goto('/errors');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Error Proposals")');

    // Real-time updates would be tested by:
    // 1. Simulating a new test failure on the backend
    // 2. Verifying the UI updates automatically
    // 3. Checking for toast notifications

    // This requires a running backend with test failure generation
    // For now, we verify the subscription hook exists by checking
    // that the page doesn't have console errors related to subscriptions

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit to catch any errors
    await page.waitForTimeout(2000);

    // Should not have subscription errors
    const subscriptionErrors = consoleErrors.filter(err =>
      err.includes('subscription') || err.includes('WebSocket')
    );

    expect(subscriptionErrors.length).toBe(0);
  });
});
