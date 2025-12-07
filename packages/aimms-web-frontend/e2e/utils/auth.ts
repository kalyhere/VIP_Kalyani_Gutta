import { Page } from '@playwright/test';
import axios from 'axios';

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

/**
 * Authenticate via API and store JWT token in browser storage
 * More reliable and faster than UI-based login
 */
export async function loginViaAPI(
  page: Page,
  credentials: LoginCredentials
): Promise<AuthTokens> {
  // Make API call to login endpoint
  const response = await axios.post<AuthTokens>(
    `${API_BASE_URL}/auth/login`,
    new URLSearchParams({
      username: credentials.email,
      password: credentials.password,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const tokens = response.data;

  // Store token in localStorage (matches frontend auth implementation - uses 'auth_token')
  await page.goto('/');
  await page.evaluate((token) => {
    localStorage.setItem('auth_token', token);
  }, tokens.access_token);

  return tokens;
}

/**
 * Login as a student user via UI
 * Use this when you need to test the login flow itself
 */
export async function loginAsStudentViaUI(
  page: Page,
  credentials: LoginCredentials
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/student/);
}

/**
 * Login as a faculty user via UI
 */
export async function loginAsFacultyViaUI(
  page: Page,
  credentials: LoginCredentials
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/faculty/);
}

/**
 * Login as an admin user via UI
 */
export async function loginAsAdminViaUI(
  page: Page,
  credentials: LoginCredentials
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to admin dashboard
  await page.waitForURL(/\/admin/);
}

/**
 * Logout by clearing localStorage and cookies
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/**
 * Check if user is authenticated by looking for token in localStorage
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  return token !== null;
}

/**
 * Get stored auth token from localStorage
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('auth_token'));
}
