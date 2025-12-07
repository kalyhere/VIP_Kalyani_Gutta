import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || process.env.VITE_GOOGLE_CLOUD_BUCKET_NAME;


if (!bucketName) {
  console.warn('⚠️  GCS_BUCKET_NAME environment variable not set. GCS functionality will be disabled.');
}

const bucket = bucketName ? storage.bucket(bucketName) : null;

/**
 * Get the first file matching a specific metadata tag or filename pattern
 */
export async function getFileByTag(tag) {
  if (!bucket) {
    throw new Error('GCS bucket not configured. Please set GCS_BUCKET_NAME environment variable.');
  }

  const tagFields = ['tag', 'modality', 'image_type', 'anatomical_region'];
  const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  try {
    const [files] = await bucket.getFiles();

    // First try to find by metadata tags
    let matchingFile = files.find(file => {
      const metadata = file.metadata?.metadata;
      if (!metadata) return false;

      return tagFields.some(field =>
        metadata[field] &&
        normalize(metadata[field]).includes(normalize(tag))
      );
    });

          // If no match by metadata, try to find by filename pattern
      if (!matchingFile) {
        const searchPatterns = {
          'head': ['head.jpeg', 'head.jpg', 'head.png', 'Head.jpeg', 'Head.jpg', 'Head.png'],
          'left eye': ['lefteye', 'left_eye', 'left eye', 'lefteye'],
          'right eye': ['righteye', 'right_eye', 'right eye', 'righteye', 'lefteye'], // Use left eye as fallback for right eye
          'face': ['face'],
          'chest': ['chest'],
          'abdomen': ['abdomen']
        };

        const patterns = searchPatterns[tag] || [tag];
        
        matchingFile = files.find(file => {
          const fileName = file.name.toLowerCase();
          // Only look for actual files (not directories) and image files
          const isImageFile = file.metadata.contentType && file.metadata.contentType.startsWith('image/');
          const isNotDirectory = !fileName.endsWith('/');
          
          return isImageFile && isNotDirectory && patterns.some(pattern => 
            fileName.includes(pattern.toLowerCase())
          );
        });
      }

    if (!matchingFile) return null;

    const [signedUrl] = await matchingFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    return {
      name: matchingFile.name,
      contentType: matchingFile.metadata.contentType,
      size: matchingFile.metadata.size,
      metadata: matchingFile.metadata.metadata,
      signedUrl,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${matchingFile.name}`
    };
  } catch (error) {
    console.error('Error fetching file from GCS:', error);
    throw new Error(`Failed to fetch file with tag '${tag}': ${error.message}`);
  }
}

/**
 * Get all files with their metadata
 */
export async function getAllFiles() {
  if (!bucket) {
    throw new Error('GCS bucket not configured. Please set GCS_BUCKET_NAME environment variable.');
  }

  try {
    const [files] = await bucket.getFiles();

    return files.map(file => ({
      name: file.name,
      contentType: file.metadata.contentType,
      size: file.metadata.size,
      metadata: file.metadata.metadata,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${file.name}`
    }));
  } catch (error) {
    console.error('Error fetching all files from GCS:', error);
    throw new Error(`Failed to fetch files: ${error.message}`);
  }
}

/**
 * Get all unique tags from metadata
 */
export async function getAvailableTags() {
  if (!bucket) {
    throw new Error('GCS bucket not configured. Please set GCS_BUCKET_NAME environment variable.');
  }

  try {
    const [files] = await bucket.getFiles();
    const tags = new Set();

    files.forEach(file => {
      const metadata = file.metadata?.metadata;
      if (metadata) {
        const tag = metadata.tag || metadata.Tag || metadata.TAG;
        if (tag) {
          tags.add(tag.toLowerCase());
        }
      }
    });

    return Array.from(tags);
  } catch (error) {
    console.error('Error fetching tags from GCS:', error);
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }
}

export { storage, bucket };
