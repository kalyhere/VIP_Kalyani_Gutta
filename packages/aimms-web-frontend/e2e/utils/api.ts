import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';

/**
 * Create an authenticated API client for making backend requests
 */
export function createAPIClient(accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an unauthenticated API client
 */
export function createUnauthenticatedAPIClient(): AxiosInstance {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Wait for API response by polling endpoint
 * Useful for waiting for async tasks like AIMHEI processing
 */
export async function waitForAPICondition<T>(
  apiCall: () => Promise<T>,
  condition: (data: T) => boolean,
  options: {
    timeout?: number;
    interval?: number;
  } = {}
): Promise<T> {
  const { timeout = 30000, interval = 1000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const data = await apiCall();
      if (condition(data)) {
        return data;
      }
    } catch (error) {
      // Continue polling even if request fails
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(
    `API condition not met within ${timeout}ms timeout`
  );
}
