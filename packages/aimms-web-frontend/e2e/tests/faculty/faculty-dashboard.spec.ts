import { test, expect } from '@playwright/test';
import { FacultyDashboardPage } from '../../pages/FacultyDashboardPage';
import { loginViaAPI } from '../../utils/auth';
import { TEST_USERS } from '../../fixtures/testData';

test.describe('Faculty Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Use existing test faculty user
    const testFaculty = TEST_USERS.faculty();

    // Login via API
    await loginViaAPI(page, {
      email: testFaculty.email,
      password: testFaculty.password,
    });
  });

  test('should display faculty dashboard after login', async ({ page }) => {
    const dashboardPage = new FacultyDashboardPage(page);
    await dashboardPage.goto();

    // Verify dashboard loads
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test('should display class cards', async ({ page }) => {
    const dashboardPage = new FacultyDashboardPage(page);
    await dashboardPage.goto();

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Verify class cards are displayed (test database has 3 classes)
    const classCount = await dashboardPage.getClassCount();
    expect(classCount).toBeGreaterThanOrEqual(3);
  });
});
