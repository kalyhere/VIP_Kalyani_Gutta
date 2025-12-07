import { execCommand } from './command.js';

/**
 * Check if ffmpeg is installed and working properly
 * @returns {Promise<{isInstalled: boolean, version: string}>}
 */
const checkFFmpeg = async () => {
  try {
    const { stdout } = await execCommand('/opt/homebrew/bin/ffmpeg', ['-version']);
    if (stdout.includes('ffmpeg version')) {
      const version = stdout.split('\n')[0];
      console.log('✅ ffmpeg is installed');
      console.log(`Version info: ${version}`);
      return { isInstalled: true, version };
    }
    throw new Error('Invalid ffmpeg installation');
  } catch (error) {
    console.error('❌ ffmpeg is not installed or not working properly.');
    console.error('Installation instructions:');
    console.error('macOS: brew install ffmpeg');
    console.error('Ubuntu/Debian: sudo apt-get install ffmpeg');
    console.error('Windows: Download from https://ffmpeg.org/download.html');
    return { isInstalled: false, version: null };
  }
};

/**
 * Check all required system dependencies
 * @returns {Promise<void>}
 * @throws {Error} if any required dependency is missing
 */
export const checkDependencies = async () => {
  const ffmpeg = await checkFFmpeg();
  
  if (!ffmpeg.isInstalled) {
    throw new Error('Required dependency ffmpeg is not installed');
  }
  
  // Add checks for other dependencies here if needed
  
  return true;
}; 