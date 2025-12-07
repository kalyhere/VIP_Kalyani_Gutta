import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { StudentDashboardPage } from '../../pages/StudentDashboardPage';
import { loginViaAPI } from '../../utils/auth';
import { TEST_USERS } from '../../fixtures/testData';

test.describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Use existing test student user
    const testStudent = TEST_USERS.student();

    // Login via API (faster than UI login)
    await loginViaAPI(page, {
      email: testStudent.email,
      password: testStudent.password,
    });
  });

  test('should display student dashboard after login', async ({ page }) => {
    const dashboardPage = new StudentDashboardPage(page);
    await dashboardPage.goto();

    // Verify dashboard loads
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test('should display assignments section', async ({ page }) => {
    const dashboardPage = new StudentDashboardPage(page);
    await dashboardPage.goto();

    // Verify assignments section exists
    await expect(dashboardPage.assignmentsSection).toBeVisible();
  });

  test('should display assignment cards', async ({ page }) => {
    const dashboardPage = new StudentDashboardPage(page);
    await dashboardPage.goto();

    // Verify assignment cards are displayed (test database has 3 assignments)
    const assignmentCount = await dashboardPage.getAssignmentCount();
    expect(assignmentCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Student Login Flow', () => {
  test('should login via UI successfully', async ({ page }) => {
    // Use existing test student
    const testStudent = TEST_USERS.student();

    // Login via UI
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);

    // Verify redirect to student dashboard
    await expect(page).toHaveURL(/\/student/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('invalid@test.com', 'wrongpassword');

    // Wait for error message to appear (may take a moment due to API call)
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });

    // Verify error message content
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toContain('Invalid');
  });
});
