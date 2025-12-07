import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

/**
 * Utility class for managing Patient Y physical examination folders in Google Cloud Storage
 */
class PhysicalExamFolderManager {
  constructor() {
    this.storage = new Storage({
      projectId: process.env.VITE_GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.VITE_GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.VITE_GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
      }
    });
    
    this.bucketName = process.env.VITE_GOOGLE_CLOUD_BUCKET_NAME;
    this.bucket = this.storage.bucket(this.bucketName);
    this.basePath = 'Patient Y';
  }

  /**
   * Get the full GCS path for a specific examination category
   * @param {string} category - Main category name
   * @param {string} subcategory - Subcategory name (optional)
   * @param {string} item - Specific examination item (optional)
   * @returns {string} - Full GCS path
   */
  getPathForExam(category, subcategory = null, item = null) {
    let path = `${this.basePath}/${this.sanitizeFolderName(category)}`;
    
    if (subcategory) {
      path += `/${this.sanitizeFolderName(subcategory)}`;
    }
    
    if (item) {
      path += `/${this.sanitizeFolderName(item)}`;
    }
    
    return path;
  }

  /**
   * Sanitize folder name for Google Cloud Storage
   * @param {string} name - Folder name to sanitize
   * @returns {string} - Sanitized folder name
   */
  sanitizeFolderName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '_').trim();
  }

  /**
   * Upload a media file to the appropriate examination folder
   * @param {string} category - Main category name
   * @param {string} subcategory - Subcategory name (optional)
   * @param {string} item - Specific examination item (optional)
   * @param {string} fileName - Name of the file to upload
   * @param {Buffer|string} fileContent - File content
   * @param {string} contentType - MIME type of the file
   * @returns {Promise<string>} - GCS path of uploaded file
   */
  async uploadMediaFile(category, subcategory, item, fileName, fileContent, contentType = 'application/octet-stream') {
    const folderPath = this.getPathForExam(category, subcategory, item);
    const filePath = `${folderPath}/${this.sanitizeFolderName(fileName)}`;
    
    try {
      const file = this.bucket.file(filePath);
      await file.save(fileContent, {
        metadata: {
          contentType,
          metadata: {
            category,
            subcategory,
            item,
            uploaded_by: 'PhysicalExamFolderManager',
            uploaded_at: new Date().toISOString()
          }
        }
      });
      
      console.log(`✅ Uploaded: ${filePath}`);
      return filePath;
      
    } catch (error) {
      console.error(`❌ Error uploading ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * List all files in a specific examination folder
   * @param {string} category - Main category name
   * @param {string} subcategory - Subcategory name (optional)
   * @param {string} item - Specific examination item (optional)
   * @returns {Promise<Array>} - Array of file objects
   */
  async listFilesInFolder(category, subcategory = null, item = null) {
    const folderPath = this.getPathForExam(category, subcategory, item);
    
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `${folderPath}/`,
        delimiter: '/'
      });
      
      // Filter out folder markers
      const mediaFiles = files.filter(file => !file.name.endsWith('.folder_marker'));
      
      return mediaFiles.map(file => ({
        name: file.name.split('/').pop(),
        path: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        created: file.metadata.timeCreated,
        updated: file.metadata.updated
      }));
      
    } catch (error) {
      console.error(`❌ Error listing files in ${folderPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get a public URL for a media file
   * @param {string} filePath - Full GCS path to the file
   * @returns {string} - Public URL
   */
  getPublicUrl(filePath) {
    return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
  }

  /**
   * Delete a media file
   * @param {string} filePath - Full GCS path to the file
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(filePath) {
    try {
      const file = this.bucket.file(filePath);
      await file.delete();
      console.log(`✅ Deleted: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Get folder statistics
   * @param {string} category - Main category name
   * @param {string} subcategory - Subcategory name (optional)
   * @param {string} item - Specific examination item (optional)
   * @returns {Promise<Object>} - Folder statistics
   */
  async getFolderStats(category, subcategory = null, item = null) {
    const folderPath = this.getPathForExam(category, subcategory, item);
    
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `${folderPath}/`
      });
      
      const mediaFiles = files.filter(file => !file.name.endsWith('.folder_marker'));
      
      const stats = {
        totalFiles: mediaFiles.length,
        totalSize: 0,
        fileTypes: {},
        oldestFile: null,
        newestFile: null
      };
      
      mediaFiles.forEach(file => {
        const size = parseInt(file.metadata.size || 0);
        stats.totalSize += size;
        
        const contentType = file.metadata.contentType || 'unknown';
        stats.fileTypes[contentType] = (stats.fileTypes[contentType] || 0) + 1;
        
        const created = new Date(file.metadata.timeCreated);
        if (!stats.oldestFile || created < stats.oldestFile) {
          stats.oldestFile = created;
        }
        if (!stats.newestFile || created > stats.newestFile) {
          stats.newestFile = created;
        }
      });
      
      return stats;
      
    } catch (error) {
      console.error(`❌ Error getting stats for ${folderPath}:`, error.message);
      throw error;
    }
  }

  /**
   * List all examination categories and their folder structures
   * @returns {Promise<Object>} - Complete folder structure
   */
  async listAllFolders() {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `${this.basePath}/`,
        delimiter: '/'
      });
      
      const folders = new Set();
      files.forEach(file => {
        const pathParts = file.name.split('/');
        if (pathParts.length > 1) {
          const folderPath = pathParts.slice(0, -1).join('/');
          if (folderPath.startsWith(this.basePath)) {
            folders.add(folderPath);
          }
        }
      });
      
      // Organize into hierarchical structure
      const structure = {};
      Array.from(folders).sort().forEach(folder => {
        const relativePath = folder.replace(`${this.basePath}/`, '');
        const pathParts = relativePath.split('/');
        
        let current = structure;
        pathParts.forEach((part, index) => {
          if (!current[part]) {
            current[part] = index === pathParts.length - 1 ? { _isLeaf: true } : {};
          }
          current = current[part];
        });
      });
      
      return structure;
      
    } catch (error) {
      console.error('❌ Error listing all folders:', error.message);
      throw error;
    }
  }
}

export default PhysicalExamFolderManager;
