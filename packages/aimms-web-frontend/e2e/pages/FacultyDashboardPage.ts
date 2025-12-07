import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Faculty Dashboard
 */
export class FacultyDashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly classesTab: Locator;
  readonly studentsTab: Locator;
  readonly reportsTab: Locator;
  readonly createClassButton: Locator;
  readonly classCards: Locator;

  constructor(page: Page) {
    this.page = page;
    // Actual UI shows "Good afternoon,faculty" in an H6
    this.welcomeMessage = page.locator('h6').first();
    // No tabs visible in inspection - these may not exist or use different selectors
    this.classesTab = page.locator('[role="tab"]').filter({ hasText: /classes/i });
    this.studentsTab = page.locator('[role="tab"]').filter({ hasText: /students/i });
    this.reportsTab = page.locator('[role="tab"]').filter({ hasText: /reports/i });
    this.createClassButton = page.locator('button').filter({ hasText: /create class|new class|add class/i });
    // Class cards are [role="button"] elements containing "student" text (singular or plural)
    // This excludes the "Pending" and "New Assignment" buttons
    this.classCards = page.locator('[role="button"]').filter({ hasText: /student/ });
  }

  async goto() {
    await this.page.goto('/faculty-dashboard');
  }

  async switchToClassesTab() {
    await this.classesTab.click();
  }

  async switchToStudentsTab() {
    await this.studentsTab.click();
  }

  async switchToReportsTab() {
    await this.reportsTab.click();
  }

  async createClass() {
    await this.createClassButton.click();
  }

  async getClassCount(): Promise<number> {
    return this.classCards.count();
  }

  async findClassByName(name: string): Promise<ClassCard | null> {
    const card = this.classCards.filter({ hasText: name }).first();
    if (await card.count() > 0) {
      return new ClassCard(card);
    }
    return null;
  }
}

/**
 * Helper class for interacting with class cards
 */
export class ClassCard {
  readonly locator: Locator;
  readonly name: Locator;
  readonly studentCount: Locator;
  readonly viewButton: Locator;
  readonly assignCaseButton: Locator;

  constructor(cardLocator: Locator) {
    this.locator = cardLocator;
    // No data-testid attributes exist - using text-based selectors
    this.name = cardLocator.locator('h5, h6, p').first();
    this.studentCount = cardLocator.locator('span, p').filter({ hasText: /\d+\s*(student|learner)/i });
    this.viewButton = cardLocator.locator('button').filter({ hasText: /view|details/i });
    this.assignCaseButton = cardLocator.locator('button').filter({ hasText: /assign|add case/i });
  }

  async getName(): Promise<string | null> {
    return this.name.textContent();
  }

  async getStudentCount(): Promise<number> {
    const text = await this.studentCount.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async view() {
    await this.viewButton.click();
  }

  async assignCase() {
    await this.assignCaseButton.click();
  }
}
