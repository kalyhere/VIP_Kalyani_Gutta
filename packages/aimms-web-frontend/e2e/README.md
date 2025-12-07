# E2E Tests

End-to-end tests for AIMMS Web Platform using Playwright.

## ✅ Status: All Tests Passing

**15 passing tests**, 2 skipped (require test fixtures)

- ✅ Playwright configured (see `playwright.config.ts`)
- ✅ All Page Object Models use correct UI selectors
- ✅ Tests use existing database users (student/faculty/admin)
- ✅ AIMHEI mocking prevents OpenAI API costs
- ✅ Test results isolated to `e2e/` directory

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Interactive UI mode (recommended for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View latest test report
npm run test:e2e:report

# Run with traces/videos for all tests (not just failures)
npm run test:e2e:trace
```

## Directory Structure

```
e2e/
├── playwright.config.ts    # Playwright configuration
├── playwright-report/      # HTML test reports (gitignored)
├── test-results/           # Test artifacts (gitignored)
├── auth.json               # Playwright storage state
├── fixtures/               # Test data and mocks
│   ├── testData.ts         # Test user credentials
│   └── mockAIMHEI.ts       # AIMHEI API mocks
├── pages/                  # Page Object Models
│   ├── LoginPage.ts
│   ├── StudentDashboardPage.ts
│   ├── FacultyDashboardPage.ts
│   └── AIMHEIPage.ts
├── tests/                  # Test specs
│   ├── smoke.spec.ts       # Basic auth tests
│   ├── student/            # Student workflow tests
│   ├── faculty/            # Faculty workflow tests
│   └── aimhei/             # AIMHEI tests (admin-only)
└── utils/                  # Helper functions
    └── auth.ts             # Authentication utilities
```

## Test Suites

### Smoke Tests (`tests/smoke.spec.ts`)
Basic authentication and navigation tests:
- Homepage loads
- Student/faculty/admin can login
- Unauthenticated users redirected to login

### Student Tests (`tests/student/`)
- Dashboard displays correctly
- Assignment cards visible
- UI login flow
- Error handling for invalid credentials

### Faculty Tests (`tests/faculty/`)
- Dashboard displays correctly
- Class cards visible

### AIMHEI Tests (`tests/aimhei/`)
- Upload interface displays
- Report viewing
- Report export
- ⚠️ Uses admin user (AIMHEI is admin-only)
- ⚠️ All API calls are mocked (prevents OpenAI costs)

## Test Users

The following test users exist in the database:

| Username | Password | Role    |
|----------|----------|---------|
| student  | password | Student |
| faculty  | password | Faculty |
| admin    | password | Admin   |

These are configured in `fixtures/testData.ts`.

## Writing Tests

### Use Page Object Models

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginViaAPI } from '../utils/auth';
import { TEST_USERS } from '../fixtures/testData';

test('my test', async ({ page }) => {
  // Login via API (faster than UI)
  const student = TEST_USERS.student();
  await loginViaAPI(page, {
    email: student.email,
    password: student.password,
  });

  // Navigate and interact
  await page.goto('/student-dashboard');

  // Make assertions
  await expect(page).toHaveURL(/student-dashboard/);
});
```

### Important Notes

1. **Use existing test users** - Don't create new users (requires admin auth)
2. **Mock AIMHEI calls** - Import `mockAllAIMHEIEndpoints()` to prevent API costs
3. **Use API login when possible** - Faster than UI login
4. **Wait for dynamic content** - Add `waitForTimeout` for async-loaded content
5. **Use correct selectors** - Page Object Models match actual UI field names

## Configuration

### Playwright Config (`playwright.config.ts`)

Key settings:
- **Base URL**: `http://localhost:3000` (Docker frontend)
- **Test directory**: `./` (relative to config file)
- **Output**: `./test-results`, `./playwright-report`
- **Trace/Video**: Only on failure (use `test:e2e:trace` for all tests)
- **Timeouts**: 30s test, 5s assertion, 10s action

### Environment Variables

```bash
# Use different base URL
PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run test:e2e

# Keep traces/videos for all tests
PLAYWRIGHT_TRACE=on PLAYWRIGHT_VIDEO=on npm run test:e2e
```

## Troubleshooting

### Tests Fail with "Browser not found"
```bash
npx playwright install chromium
```

### Tests Fail with 401 Unauthorized
- Check that Docker backend is running (`npm run dev` in root)
- Verify test users exist in database
- Check localStorage key is `auth_token` (not `access_token`)

### Tests Fail with "Element not found"
- Page Object Model selectors may be outdated
- Use `npm run test:e2e:ui` to inspect the actual DOM
- Update selectors in `pages/` directory

### Tests Fail with "Access Denied" on AIMHEI
- AIMHEI pages require admin role
- Check test is using `TEST_USERS.admin()`, not faculty/student

## CI/CD Integration

Playwright tests are configured for CI:
- Retries: 2 attempts on CI (0 locally)
- Workers: 1 on CI (parallel locally)
- Fails build if `test.only` is found

## Related Documentation

- [Playwright Docs](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
