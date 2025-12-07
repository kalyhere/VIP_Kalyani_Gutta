import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for AIMHEI Dashboard/Upload page
 */
export class AIMHEIPage {
  readonly page: Page;
  readonly uploadSection: Locator;
  readonly fileInput: Locator;
  readonly hcpNameInput: Locator;
  readonly rubricSelect: Locator;
  readonly processButton: Locator;
  readonly reportsSection: Locator;
  readonly reportCards: Locator;

  constructor(page: Page) {
    this.page = page;
    // Simpler selectors - just check if elements exist rather than finding parent containers
    this.uploadSection = page.locator('text=Transcript Upload');
    this.fileInput = page.locator('input[type="file"]');
    // Actual field name from inspection
    this.hcpNameInput = page.locator('input[name="ua-textfield-healthcare-provider-name"]');
    // No select for rubric - might be a different UI element
    this.rubricSelect = page.locator('select[name="rubric"]');
    this.processButton = page.locator('button:has-text("Analyze Transcript")');
    // Reports section identified by heading
    this.reportsSection = page.locator('text=Standalone Analysis Reports');
    // No data-testid for report cards - look for "View Report" buttons
    this.reportCards = page.locator('button:has-text("View Report")');
  }

  async goto() {
    await this.page.goto('/aimhei');
  }

  async uploadTranscript(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async setHCPName(name: string) {
    await this.hcpNameInput.fill(name);
  }

  async selectRubric(rubricName: string) {
    await this.rubricSelect.selectOption({ label: rubricName });
  }

  async processTranscript() {
    await this.processButton.click();
  }

  async getReportCount(): Promise<number> {
    return this.reportCards.count();
  }

  async findReportByHCPName(hcpName: string): Promise<ReportCard | null> {
    const card = this.reportCards.filter({ hasText: hcpName }).first();
    if (await card.count() > 0) {
      return new ReportCard(card);
    }
    return null;
  }
}

/**
 * Helper class for interacting with AIMHEI report cards
 */
export class ReportCard {
  readonly locator: Locator;
  readonly hcpName: Locator;
  readonly score: Locator;
  readonly status: Locator;
  readonly viewButton: Locator;
  readonly exportButton: Locator;

  constructor(cardLocator: Locator) {
    this.locator = cardLocator;
    // No data-testid attributes exist - using text-based selectors
    // Report cards show titles like "Test Report 30 - Chest Pain"
    this.hcpName = cardLocator.locator('h6').first();
    this.score = cardLocator.locator('span, p').filter({ hasText: /\d+%?|\d+\.\d+/i });
    this.status = cardLocator.locator('span, p').filter({ hasText: /complete|pending|processing/i });
    this.viewButton = cardLocator.locator('button').filter({ hasText: /view report/i });
    this.exportButton = cardLocator.locator('button').filter({ hasText: /export/i });
  }

  async getHCPName(): Promise<string | null> {
    return this.hcpName.textContent();
  }

  async getScore(): Promise<number | null> {
    const text = await this.score.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  async getStatus(): Promise<string | null> {
    return this.status.textContent();
  }

  async view() {
    await this.viewButton.click();
  }

  async export() {
    await this.exportButton.click();
  }

  async isCompleted(): Promise<boolean> {
    const status = await this.getStatus();
    return status?.toLowerCase().includes('completed') ?? false;
  }
}
