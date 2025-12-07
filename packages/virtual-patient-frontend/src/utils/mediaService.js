// Media service for Google Cloud Storage integration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Fetch media file by tag from GCS
 * @param {string} tag - The tag to search for (e.g., 'xray', 'ecg', 'ultrasound')
 * @returns {Promise<Object>} - Media file data with signed URL
 */
export async function fetchMediaByTag(tag) {
  try {
    console.log(`Fetching media for tag: ${tag}`);
    const response = await fetch(`${API_BASE_URL}/api/media/${encodeURIComponent(tag)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`No test results found for: ${tag.replace(/([A-Z])/g, ' $1').trim()}`);
      }
      if (response.status === 500) {
        throw new Error('Server error - please try again later');
      }
      throw new Error(`Failed to fetch test results: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched media for tag: ${tag}`, data);
    return data.data.file;
  } catch (error) {
    console.error(`Error fetching media for tag '${tag}':`, error);
    throw error;
  }
}

/**
 * Get all available media files
 * @returns {Promise<Array>} - Array of all media files
 */
export async function fetchAllMedia() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/media`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all media: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.files;
  } catch (error) {
    console.error('Error fetching all media:', error);
    throw error;
  }
}

/**
 * Get all available tags
 * @returns {Promise<Array>} - Array of available tags
 */
export async function fetchAvailableTags() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/media/tags/available`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch available tags: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.tags;
  } catch (error) {
    console.error('Error fetching available tags:', error);
    throw error;
  }
}

/**
 * Get all files with a specific tag
 * @param {string} tag - The tag to search for
 * @returns {Promise<Array>} - Array of files with the specified tag
 */
export async function fetchFilesByTag(tag) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/media/tags/${encodeURIComponent(tag)}/files`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch files for tag '${tag}': ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.files;
  } catch (error) {
    console.error(`Error fetching files for tag '${tag}':`, error);
    throw error;
  }
}

/**
 * Determine media type from content type
 * @param {string} contentType - The content type of the file
 * @returns {string} - 'image', 'video', 'audio', or 'unknown'
 */
export function getMediaType(contentType) {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'unknown';
}

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - The file extension
 */
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
} 