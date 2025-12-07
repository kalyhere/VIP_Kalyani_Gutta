import { promises as fs } from 'fs';
import path from 'path';
import sanitizeFilename from 'sanitize-filename';
import { MAX_FILE_SIZE, PATHS } from '../config/constants.js';

// Get the absolute path to the project root
const PROJECT_ROOT = path.resolve(process.cwd());

export const secureFileOps = {
  async writeFile(filePath, data) {
    // Create absolute paths
    const audioDir = path.join(PROJECT_ROOT, PATHS.AUDIO_DIR);
    const safePath = path.join(audioDir, sanitizeFilename(path.basename(filePath)));
    
    // Ensure directory exists
    await fs.mkdir(audioDir, { recursive: true });
    
    // Check if file already exists
    try {
      await fs.access(safePath);
      // Generate unique name if file exists
      const ext = path.extname(safePath);
      const base = path.basename(safePath, ext);
      const newPath = path.join(path.dirname(safePath), `${base}_${Date.now()}${ext}`);
      return await this._writeFileWithChecks(newPath, data);
    } catch (err) {
      // File doesn't exist, we can proceed
      return await this._writeFileWithChecks(safePath, data);
    }
  },
  
  async _writeFileWithChecks(safePath, data) {
    // Validate file size before writing
    if (data.length > MAX_FILE_SIZE) {
      throw new Error('File size exceeds maximum allowed size');
    }
    
    await fs.writeFile(safePath, data);
    return safePath;
  },
  
  async readFile(filePath) {
    const audioDir = path.join(PROJECT_ROOT, PATHS.AUDIO_DIR);
    const safePath = path.join(audioDir, sanitizeFilename(path.basename(filePath)));
    
    // Verify file exists and check size
    const stats = await fs.stat(safePath);
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds maximum allowed size');
    }
    
    return await fs.readFile(safePath);
  },
  
  async deleteFile(filePath) {
    const audioDir = path.join(PROJECT_ROOT, PATHS.AUDIO_DIR);
    const safePath = path.join(audioDir, sanitizeFilename(path.basename(filePath)));
    try {
      await fs.unlink(safePath);
    } catch (err) {
      if (err.code !== 'ENOENT') { // Ignore if file doesn't exist
        throw err;
      }
    }
  }
};

export const cleanupTempFiles = async () => {
  try {
    const audioDir = path.join(PROJECT_ROOT, PATHS.AUDIO_DIR);
    const files = await fs.readdir(audioDir);
    
    await Promise.all(files.map(file => 
      secureFileOps.deleteFile(file).catch(err => 
        console.error(`Failed to delete ${file}:`, err)
      )
    ));
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}; 