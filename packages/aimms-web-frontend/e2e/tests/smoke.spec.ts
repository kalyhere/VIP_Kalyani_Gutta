import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../utils/auth';
import { TEST_USERS } from '../fixtures/testData';

/**
 * Smoke tests - Basic validation that core functionality works
 * These tests use minimal selectors to be resilient to UI changes
 */

test.describe('Smoke Tests', () => {
  test('homepage should load', async ({ page }) => {
    await page.goto('/');

    // Should see login or redirect to dashboard
    await expect(page).toHaveURL(/login|student|faculty|admin/);
  });

  test('student can login', async ({ page }) => {
    const student = TEST_USERS.student();

    await loginViaAPI(page, {
      email: student.email,
      password: student.password,
    });

    // Navigate to a page
    await page.goto('/');

    // Should be authenticated (not redirected to login)
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/login/);
  });

  test('faculty can login', async ({ page }) => {
    const faculty = TEST_USERS.faculty();

    await loginViaAPI(page, {
      email: faculty.email,
      password: faculty.password,
    });

    await page.goto('/');
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/login/);
  });

  test('admin can login', async ({ page }) => {
    const admin = TEST_USERS.admin();

    await loginViaAPI(page, {
      email: admin.email,
      password: admin.password,
    });

    await page.goto('/');
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/login/);
  });

  test('unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });
});
