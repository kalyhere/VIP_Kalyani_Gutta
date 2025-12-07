# E2E Test Setup Requirements

## ⚠️ Important: Test User Setup

The AIMMS backend **does not allow public user registration**. User creation requires:
- Admin authentication, OR
- Invitation-based registration flow

This means E2E tests **cannot create users dynamically** without additional setup.

## Setup Options

### Option 1: Manual Test User Creation (Recommended for local testing)

Create test users directly in your database:

```sql
-- Connect to your PostgreSQL database
psql -U aimms_user -d aimms_web

-- Create test users (passwords are hashed with bcrypt)
INSERT INTO users (email, hashed_password, role, name, is_active)
VALUES
  ('test-student@test.com', '$2b$12$...', 'student', 'Test Student', true),
  ('test-faculty@test.com', '$2b$12$...', 'faculty', 'Test Faculty', true),
  ('test-admin@test.com', '$2b$12$...', 'admin', 'Test Admin', true);
```

**To generate hashed passwords:**
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("Test123!"))
```

### Option 2: Use Existing Test Users

If your database already has test users, update the E2E test fixtures:

```typescript
// e2e/fixtures/testData.ts
export const EXISTING_TEST_USERS = {
  student: {
    email: 'existing-student@test.com',
    password: 'YourPassword123!',
  },
  faculty: {
    email: 'existing-faculty@test.com',
    password: 'YourPassword123!',
  },
};
```

### Option 3: Admin-Authenticated User Creation

1. Create an admin user manually (see Option 1)
2. Update test fixtures to login as admin first
3. Use admin token to create other test users

### Option 4: Mock User Creation (Testing UI only)

If you only want to test UI without backend integration:

```typescript
// Skip user creation, just mock auth
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('access_token', 'mock-token-for-ui-testing');
  });
});
```

## Current Test Status

✅ **Playwright installed and configured**
✅ **API endpoints corrected**
✅ **AIMHEI mocking configured**
⚠️ **Test user creation blocked** - Requires manual setup

## Next Steps

1. Choose one of the setup options above
2. Create test users manually OR update fixtures to use existing users
3. Run tests: `npm run test:e2e`

## Quick Test with Existing User

If you have an existing user account:

```bash
# Set environment variables
export TEST_USER_EMAIL="your-email@example.com"
export TEST_USER_PASSWORD="your-password"

# Run specific test
npx playwright test e2e/tests/student/student-dashboard.spec.ts --headed
```

Then update the test to use these credentials instead of creating new users.
