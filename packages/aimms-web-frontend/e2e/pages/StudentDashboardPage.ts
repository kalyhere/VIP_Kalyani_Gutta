import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Student Dashboard
 */
export class StudentDashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly assignmentsSection: Locator;
  readonly assignmentCards: Locator;

  constructor(page: Page) {
    this.page = page;
    // Actual UI shows "Good afternoon,student" in an H6
    this.welcomeMessage = page.locator('h6').first();
    // No data-testid for assignments section exists - using generic selectors
    this.assignmentsSection = page.locator('main, [role="main"]').first();
    // Assignment cards don't have data-testid - would need to inspect actual card structure
    this.assignmentCards = page.locator('[role="button"]').filter({ hasText: /case|assignment/i });
  }

  async goto() {
    await this.page.goto('/student-dashboard');
  }

  async getAssignmentCount(): Promise<number> {
    return this.assignmentCards.count();
  }

  async getAssignmentByIndex(index: number): Promise<AssignmentCard> {
    const card = this.assignmentCards.nth(index);
    return new AssignmentCard(card);
  }

  async findAssignmentByTitle(title: string): Promise<AssignmentCard | null> {
    const card = this.assignmentCards.filter({ hasText: title }).first();
    if (await card.count() > 0) {
      return new AssignmentCard(card);
    }
    return null;
  }
}

/**
 * Helper class for interacting with assignment cards
 */
export class AssignmentCard {
  readonly locator: Locator;
  readonly title: Locator;
  readonly status: Locator;
  readonly launchButton: Locator;
  readonly viewButton: Locator;

  constructor(cardLocator: Locator) {
    this.locator = cardLocator;
    // No data-testid attributes exist - using text-based selectors
    this.title = cardLocator.locator('h5, h6').first();
    this.status = cardLocator.locator('span, p').filter({ hasText: /status|complete|pending/i });
    this.launchButton = cardLocator.locator('button').filter({ hasText: /launch|start|begin/i });
    this.viewButton = cardLocator.locator('button').filter({ hasText: /view|details/i });
  }

  async getTitle(): Promise<string | null> {
    return this.title.textContent();
  }

  async getStatus(): Promise<string | null> {
    return this.status.textContent();
  }

  async launch() {
    await this.launchButton.click();
  }

  async view() {
    await this.viewButton.click();
  }

  async isLaunchable(): Promise<boolean> {
    return this.launchButton.isVisible();
  }
}
