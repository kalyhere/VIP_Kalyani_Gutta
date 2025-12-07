import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Actual field names from the UI
    this.emailInput = page.locator('input[name="ua-textfield-username"]');
    this.passwordInput = page.locator('input[name="ua-textfield-password"]');
    this.submitButton = page.locator('button', { hasText: 'Sign In' });
    this.errorMessage = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return this.errorMessage.textContent();
    }
    return null;
  }
}
