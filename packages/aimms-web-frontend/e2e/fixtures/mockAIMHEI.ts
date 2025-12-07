import { Page } from '@playwright/test';

/**
 * Mock AIMHEI processing responses to avoid hitting OpenAI API
 * IMPORTANT: This prevents costly API calls during E2E tests
 */

export interface MockAIMHEIReport {
  id: number;
  hcp_name: string;
  overall_score: number;
  percentile_rank: number;
  status: 'processing' | 'completed' | 'failed';
  rubric_detail?: Record<string, any>;
}

/**
 * Mock AIMHEI processing endpoint to return immediate success
 * This intercepts the POST /aimhei_reports/process request
 */
export async function mockAIMHEIProcessing(page: Page) {
  await page.route('**/aimhei_reports/process', async (route) => {
    const mockReport: MockAIMHEIReport = {
      id: Date.now(), // Use timestamp as mock ID
      hcp_name: 'Test HCP',
      overall_score: 85,
      percentile_rank: 75,
      status: 'completed',
      rubric_detail: {
        information_section: {
          score: 90,
          items: [
            { question: 'Patient name', asked: true },
            { question: 'Chief complaint', asked: true },
          ],
        },
        skill_section: {
          score: 80,
          items: [
            { skill: 'Medical terminology', score: 4 },
            { skill: 'Empathy', score: 5 },
          ],
        },
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockReport),
    });
  });
}

/**
 * Mock AIMHEI report polling endpoint to return completed status
 * This intercepts GET /aimhei_reports/:id requests
 */
export async function mockAIMHEIReportStatus(page: Page, reportId: number) {
  await page.route(`**/aimhei_reports/${reportId}`, async (route) => {
    const mockReport: MockAIMHEIReport = {
      id: reportId,
      hcp_name: 'Test HCP',
      overall_score: 85,
      percentile_rank: 75,
      status: 'completed',
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockReport),
    });
  });
}

/**
 * Mock all AIMHEI-related endpoints to avoid real processing
 */
export async function mockAllAIMHEIEndpoints(page: Page) {
  // Mock processing endpoint
  await mockAIMHEIProcessing(page);

  // Mock report listing
  await page.route('**/aimhei_reports', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock report export
  await page.route('**/aimhei_reports/*/export', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: 'HCP Name,Score,Percentile\nTest HCP,85,75',
    });
  });
}

/**
 * Disable AIMHEI mocking to test against real backend
 * Use this only when explicitly needed (e.g., integration testing)
 */
export async function disableAIMHEIMocking(page: Page) {
  await page.unroute('**/aimhei_reports/**');
}
