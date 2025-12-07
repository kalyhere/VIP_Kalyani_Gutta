import express from 'express';
import { getFileByTag, getAllFiles, getAvailableTags } from '../utils/gcsClient.js';

const router = express.Router();

/**
 * GET /api/media/:tag
 * Get the first media file matching a specific tag
 * Example: GET /api/media/xray
 */
router.get('/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    
    if (!tag) {
      return res.status(400).json({ 
        error: 'Tag parameter is required',
        message: 'Please provide a tag parameter (e.g., /api/media/xray)' 
      });
    }

    const file = await getFileByTag(tag);
    
    if (!file) {
      return res.status(404).json({ 
        error: 'No media found',
        message: `No media files found with tag '${tag}'`,
        tag: tag
      });
    }

    res.json({
      success: true,
      data: {
        tag: tag,
        file: {
          name: file.name,
          contentType: file.contentType,
          size: file.size,
          metadata: file.metadata,
          signedUrl: file.signedUrl,
          publicUrl: file.publicUrl
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/media/:tag:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * GET /api/media
 * Get all available media files and their metadata
 */
router.get('/', async (req, res) => {
  try {
    const files = await getAllFiles();
    
    res.json({
      success: true,
      data: {
        totalFiles: files.length,
        files: files
      }
    });

  } catch (error) {
    console.error('Error in GET /api/media:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * GET /api/media/tags/available
 * Get all available tags in the bucket
 */
router.get('/tags/available', async (req, res) => {
  try {
    const tags = await getAvailableTags();
    
    res.json({
      success: true,
      data: {
        totalTags: tags.length,
        tags: tags
      }
    });

  } catch (error) {
    console.error('Error in GET /api/media/tags/available:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * GET /api/media/tags/:tag/files
 * Get all files with a specific tag
 */
router.get('/tags/:tag/files', async (req, res) => {
  try {
    const { tag } = req.params;
    
    if (!tag) {
      return res.status(400).json({ 
        error: 'Tag parameter is required',
        message: 'Please provide a tag parameter' 
      });
    }

    const allFiles = await getAllFiles();
    const matchingFiles = allFiles.filter(file => {
      const fileMetadata = file.metadata;
      if (!fileMetadata) return false;
      
      const fileTag = fileMetadata.tag || fileMetadata.Tag || fileMetadata.TAG;
      return fileTag && fileTag.toLowerCase() === tag.toLowerCase();
    });

    res.json({
      success: true,
      data: {
        tag: tag,
        totalFiles: matchingFiles.length,
        files: matchingFiles
      }
    });

  } catch (error) {
    console.error('Error in GET /api/media/tags/:tag/files:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router; 