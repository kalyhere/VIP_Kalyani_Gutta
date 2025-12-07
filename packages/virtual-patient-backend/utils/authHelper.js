import { Storage } from '@google-cloud/storage';

/**
 * Get authentication token for GCS access
 * This can be extended to support different auth methods
 */
export function getAuthToken() {
  // For now, return empty string since we're using signed URLs
  // This can be extended to support OAuth2, API keys, etc.
  return '';
}

/**
 * Check if GCS is properly configured
 */
export function isGCSConfigured() {
  return !!(process.env.GCS_BUCKET_NAME && process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

/**
 * Get GCS bucket name from environment
 */
export function getGCSBucketName() {
  return process.env.GCS_BUCKET_NAME || process.env.VITE_GOOGLE_CLOUD_BUCKET_NAME;
}

/**
 * Validate GCS configuration
 */
export function validateGCSConfig() {
  const bucketName = getGCSBucketName();
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  const issues = [];
  
  if (!bucketName) {
    issues.push('GCS_BUCKET_NAME environment variable not set');
  }
  
  if (!credentials) {
    issues.push('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    bucketName,
    hasCredentials: !!credentials
  };
} 