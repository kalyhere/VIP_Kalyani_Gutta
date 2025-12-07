import { createAPIClient, createUnauthenticatedAPIClient } from '../utils/api';
import { LoginCredentials } from '../utils/auth';

/**
 * Test data fixtures for E2E tests
 * Creates users, classes, cases, and assignments via API
 */

export interface TestUser {
  id?: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'faculty' | 'admin';
}

export interface TestClass {
  id?: number;
  name: string;
  description: string;
  faculty_id?: number;
}

export interface TestCase {
  id?: number;
  title: string;
  description: string;
  patient_info?: Record<string, any>;
}

/**
 * Generate unique test email to avoid conflicts
 */
export function generateTestEmail(role: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${role}-${timestamp}-${random}@test.com`;
}

/**
 * Existing test users in the database
 * These users should already exist - no need to create them
 */
export const TEST_USERS = {
  student: (): TestUser => ({
    email: 'student',
    password: 'password',
    first_name: 'Test',
    last_name: 'Student',
    role: 'student',
  }),
  faculty: (): TestUser => ({
    email: 'faculty',
    password: 'password',
    first_name: 'Test',
    last_name: 'Faculty',
    role: 'faculty',
  }),
  admin: (): TestUser => ({
    email: 'admin',
    password: 'password',
    first_name: 'Test',
    last_name: 'Admin',
    role: 'admin',
  }),
};

/**
 * Create a test user via API
 */
export async function createTestUser(
  user: TestUser,
  adminToken?: string
): Promise<TestUser> {
  const client = adminToken
    ? createAPIClient(adminToken)
    : createUnauthenticatedAPIClient();

  try {
    const response = await client.post('/users/register', user);
    return { ...user, id: response.data.id };
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

/**
 * Create a test class via API (requires faculty token)
 */
export async function createTestClass(
  classData: TestClass,
  facultyToken: string
): Promise<TestClass> {
  const client = createAPIClient(facultyToken);

  try {
    const response = await client.post('/students/classes', classData);
    return { ...classData, id: response.data.id };
  } catch (error) {
    console.error('Failed to create test class:', error);
    throw error;
  }
}

/**
 * Enroll students in a class via API
 */
export async function enrollStudents(
  classId: number,
  studentEmails: string[],
  facultyToken: string
): Promise<void> {
  const client = createAPIClient(facultyToken);

  try {
    await client.post(`/students/classes/${classId}/enroll`, {
      student_emails: studentEmails,
    });
  } catch (error) {
    console.error('Failed to enroll students:', error);
    throw error;
  }
}

/**
 * Create a test medical case via API (requires faculty/admin token)
 */
export async function createTestCase(
  caseData: TestCase,
  token: string
): Promise<TestCase> {
  const client = createAPIClient(token);

  try {
    const response = await client.post('/medical_cases/', caseData);
    return { ...caseData, id: response.data.id };
  } catch (error) {
    console.error('Failed to create test case:', error);
    throw error;
  }
}

/**
 * Assign a case to students in a class via API
 */
export async function assignCaseToClass(
  classId: number,
  caseId: number,
  facultyToken: string
): Promise<void> {
  const client = createAPIClient(facultyToken);

  try {
    await client.post('/medical_cases/assign', {
      class_id: classId,
      case_id: caseId,
    });
  } catch (error) {
    console.error('Failed to assign case:', error);
    throw error;
  }
}

/**
 * Clean up test data after tests
 * This is a placeholder - implement based on backend capabilities
 */
export async function cleanupTestData(adminToken: string): Promise<void> {
  // TODO: Implement cleanup logic
  // Options:
  // 1. Delete test users by email pattern (e.g., *@test.com)
  // 2. Delete classes/cases created during tests
  // 3. Rely on database transactions/rollback (preferred)
  console.log('Cleanup test data - implement as needed');
}
