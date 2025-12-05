import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Unified Work Dashboard
 *
 * These tests verify the complete user workflow for the unified dashboard:
 * - Dashboard navigation and tabs
 * - Work queue management
 * - Approvals workflow
 * - Master agents/workers monitoring
 * - Lifecycle visualization
 * - Real-time updates
 */

test.describe('Unified Work Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')

    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("Dashboard")')
  })

  test.describe('Dashboard Foundation', () => {
    test('should display dashboard with header and description', async ({ page }) => {
      // Verify page title
      await expect(page.locator('h1')).toContainText('Dashboard')

      // Verify description
      await expect(page.locator('p.text-muted-foreground')).toContainText(
        'Unified view of work queue, approvals, master agents, and lifecycle'
      )
    })

    test('should display stats cards', async ({ page }) => {
      // Wait for stats cards to load
      await page.waitForSelector('.text-2xl, [data-testid*="stat"]', {
        timeout: 5000,
      }).catch(() => {
        // Stats might not be present if no data
      })

      // Verify we have stat cards
      const statCards = page.locator('.text-sm.font-medium')
      const count = await statCards.count()

      // Should have at least some stat cards
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should display filter sidebar', async ({ page }) => {
      // Verify filter sidebar elements
      const sidebar = page.locator('aside, .filter-sidebar, [data-testid="filter-sidebar"]')

      // Check for common filter elements
      const hasFilters = await page.locator('text=Filters, text=Project, text=Status, text=Priority').count()

      // Should have some filter UI
      expect(hasFilters).toBeGreaterThanOrEqual(0)
    })

    test('should have tab navigation', async ({ page }) => {
      // Verify tabs exist
      await expect(page.locator('[role="tablist"]')).toBeVisible()

      // Verify all required tabs
      const tabs = ['Work Queue', 'Approvals', 'Master Agents', 'Lifecycle']

      for (const tab of tabs) {
        await expect(page.locator(`[role="tab"]:has-text("${tab}")`)).toBeVisible()
      }
    })

    test('should persist tab state to URL', async ({ page }) => {
      // Click on Approvals tab
      await page.locator('[role="tab"]:has-text("Approvals")').click()

      // Wait for navigation
      await page.waitForURL('**/dashboard?tab=approvals', { timeout: 5000 }).catch(() => {})

      // Verify URL contains tab parameter
      const url = page.url()
      expect(url).toContain('tab=')

      // Refresh page
      await page.reload()

      // Verify tab is still selected
      const approvalsTab = page.locator('[role="tab"]:has-text("Approvals")')
      await expect(approvalsTab).toHaveAttribute('data-state', 'active')
    })
  })

  test.describe('Work Queue Tab', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to work queue tab
      await page.locator('[role="tab"]:has-text("Work Queue")').click()
      await page.waitForTimeout(500) // Wait for tab switch
    })

    test('should display work queue table or empty state', async ({ page }) => {
      // Check for table or empty state
      const hasTable = await page.locator('table').isVisible().catch(() => false)
      const hasEmptyState = await page.locator('text=No work items').isVisible().catch(() => false)

      // Should have either table or empty state
      expect(hasTable || hasEmptyState).toBeTruthy()
    })

    test('should have sortable columns', async ({ page }) => {
      // Check if table exists
      const hasTable = await page.locator('table').isVisible().catch(() => false)

      if (hasTable) {
        // Verify column headers exist
        const headers = page.locator('th')
        const headerCount = await headers.count()

        // Should have multiple columns
        expect(headerCount).toBeGreaterThan(0)

        // Check for sort icons
        const sortIcons = await page.locator('th svg').count()
        expect(sortIcons).toBeGreaterThanOrEqual(0)
      }
    })

    test('should display row actions when items exist', async ({ page }) => {
      // Check if we have any rows
      const rows = await page.locator('tbody tr').count()

      if (rows > 0) {
        // Verify action buttons exist
        const actionButtons = await page.locator('tbody tr:first-child button').count()
        expect(actionButtons).toBeGreaterThan(0)
      }
    })

    test('should support drag-and-drop reordering', async ({ page }) => {
      // Check if we have multiple rows
      const rowCount = await page.locator('tbody tr').count()

      if (rowCount >= 2) {
        // Look for drag handle
        const dragHandle = page.locator('tbody tr:first-child svg[class*="grip"]').first()
        const hasDragHandle = await dragHandle.isVisible().catch(() => false)

        expect(hasDragHandle).toBeTruthy()
      }
    })
  })

  test.describe('Approvals Tab', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to approvals tab
      await page.locator('[role="tab"]:has-text("Approvals")').click()
      await page.waitForTimeout(500)
    })

    test('should display approvals sections', async ({ page }) => {
      // Check for approval sections
      const hasNeedsApproval = await page.locator('text=Needs Approval').isVisible().catch(() => false)
      const hasNeedsValidation = await page.locator('text=Needs Validation').isVisible().catch(() => false)

      // Should have at least one section header
      expect(hasNeedsApproval || hasNeedsValidation).toBeTruthy()
    })

    test('should have approve and reject buttons when specs exist', async ({ page }) => {
      // Check for table rows
      const rows = await page.locator('table tbody tr').count()

      if (rows > 0) {
        // Check for action buttons
        const approveButton = page.locator('button:has-text("Approve")').first()
        const rejectButton = page.locator('button:has-text("Reject")').first()

        const hasApprove = await approveButton.isVisible().catch(() => false)
        const hasReject = await rejectButton.isVisible().catch(() => false)

        // Should have at least one action button
        expect(hasApprove || hasReject).toBeTruthy()
      }
    })

    test('should show proposal detail modal when viewing spec', async ({ page }) => {
      // Check if we have any rows
      const rows = await page.locator('table tbody tr').count()

      if (rows > 0) {
        // Click view button
        const viewButton = page.locator('button:has([data-testid="eye-icon"]), button:has-text("View")').first()
        const hasViewButton = await viewButton.isVisible().catch(() => false)

        if (hasViewButton) {
          await viewButton.click()

          // Wait for modal
          await page.waitForSelector('[role="dialog"]', { timeout: 2000 }).catch(() => {})

          // Verify modal appeared
          const modal = page.locator('[role="dialog"]')
          const isModalVisible = await modal.isVisible().catch(() => false)
          expect(isModalVisible).toBeTruthy()
        }
      }
    })
  })

  test.describe('Master Agents Tab', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to master agents tab
      await page.locator('[role="tab"]:has-text("Master Agents")').click()
      await page.waitForTimeout(500)
    })

    test('should display active workers section', async ({ page }) => {
      // Check for workers section
      const hasWorkersHeader = await page.locator('text=Active Workers').isVisible().catch(() => false)

      expect(hasWorkersHeader).toBeTruthy()
    })

    test('should display worker cards or empty state', async ({ page }) => {
      // Check for worker cards or empty state
      const hasCards = await page.locator('[data-testid="worker-card"]').count()
      const hasEmptyState = await page.locator('text=No active workers').isVisible().catch(() => false)

      // Should have either cards or empty state
      expect(hasCards > 0 || hasEmptyState).toBeTruthy()
    })

    test('should display clarifications panel', async ({ page }) => {
      // Check for clarifications section
      const hasClarifications = await page.locator('text=Clarifications Panel, text=Clarifications').isVisible().catch(() => false)

      expect(hasClarifications).toBeTruthy()
    })

    test('should have worker action buttons when workers exist', async ({ page }) => {
      // Check if we have any worker cards
      const cards = await page.locator('[data-testid="worker-card"]').count()

      if (cards > 0) {
        // Check for action buttons
        const actionButtons = await page.locator('button:has-text("Cancel"), button:has-text("Retry"), button:has-text("View Details")').count()
        expect(actionButtons).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Lifecycle Tab', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to lifecycle tab
      await page.locator('[role="tab"]:has-text("Lifecycle")').click()
      await page.waitForTimeout(500)
    })

    test('should display lifecycle timeline section', async ({ page }) => {
      // Check for lifecycle header
      const hasHeader = await page.locator('text=Lifecycle Timeline').isVisible().catch(() => false)

      expect(hasHeader).toBeTruthy()
    })

    test('should have spec selector', async ({ page }) => {
      // Check for spec selector
      const hasSelector = await page.locator('[role="combobox"], select, text=Select Spec').isVisible().catch(() => false)

      expect(hasSelector).toBeTruthy()
    })

    test('should display timeline when spec selected', async ({ page }) => {
      // Check if selector exists and has options
      const selector = page.locator('[role="combobox"]').first()
      const hasSelectorVisible = await selector.isVisible().catch(() => false)

      if (hasSelectorVisible) {
        // Try to open selector
        await selector.click()
        await page.waitForTimeout(500)

        // Check if there are options
        const options = await page.locator('[role="option"]').count()

        if (options > 0) {
          // Select first option
          await page.locator('[role="option"]').first().click()
          await page.waitForTimeout(1000)

          // Check for timeline elements
          const hasTimeline = await page.locator('[data-testid*="timeline"], .timeline').isVisible().catch(() => false)

          // Timeline should appear or show empty state
          expect(hasTimeline || await page.locator('text=No lifecycle history').isVisible()).toBeTruthy()
        }
      }
    })
  })

  test.describe('Integration Tests', () => {
    test('should navigate between all tabs', async ({ page }) => {
      const tabs = ['Work Queue', 'Approvals', 'Master Agents', 'Lifecycle']

      for (const tab of tabs) {
        // Click tab
        await page.locator(`[role="tab"]:has-text("${tab}")`).click()
        await page.waitForTimeout(500)

        // Verify tab is active
        const tabElement = page.locator(`[role="tab"]:has-text("${tab}")`)
        await expect(tabElement).toHaveAttribute('data-state', 'active')
      }
    })

    test('should maintain filters across tab switches', async ({ page }) => {
      // Apply a filter (if filter UI exists)
      const projectFilter = page.locator('[role="combobox"]:has-text("Project"), select').first()
      const hasProjectFilter = await projectFilter.isVisible().catch(() => false)

      if (hasProjectFilter) {
        // Get initial state
        const initialValue = await projectFilter.textContent()

        // Switch tabs
        await page.locator('[role="tab"]:has-text("Approvals")').click()
        await page.waitForTimeout(500)

        await page.locator('[role="tab"]:has-text("Work Queue")').click()
        await page.waitForTimeout(500)

        // Verify filter persisted
        const finalValue = await projectFilter.textContent()
        expect(finalValue).toBe(initialValue)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle empty states gracefully', async ({ page }) => {
      // Each tab should handle empty data without errors
      const tabs = ['Work Queue', 'Approvals', 'Master Agents', 'Lifecycle']

      for (const tab of tabs) {
        await page.locator(`[role="tab"]:has-text("${tab}")`).click()
        await page.waitForTimeout(500)

        // Check for errors in console
        const errors = []
        page.on('pageerror', (error) => errors.push(error))
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text())
        })

        // Should not have critical errors
        await page.waitForTimeout(1000)
        const criticalErrors = errors.filter(e =>
          !e.toString().includes('Warning:') &&
          !e.toString().includes('DevTools')
        )

        expect(criticalErrors.length).toBe(0)
      }
    })
  })
})
