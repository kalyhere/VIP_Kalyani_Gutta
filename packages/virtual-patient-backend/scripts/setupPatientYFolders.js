import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Physical exam categories from PhysicalExamInterface.jsx
const examCategories = {
  "General": {
    "Appearance": []
  },
  "HEENT (Head, Eyes, Ears, Nose, Throat)": {
    "Head": [],
    "Eyes": [],
    "Ears": [],
    "Nose": [],
    "Throat/Mouth": []
  },
  "Neck": {
    "Inspection": [],
    "Palpation": [],
    "Auscultation": [],
    "Range of Motion": [],
    "Airway Assessment": []
  },
  "Breast": {
    "Inspection": [],
    "Palpation": [],
    "Education": []
  },
  "Cardiovascular": {
    "Inspection": [],
    "Palpation": [],
    "Auscultation": [],
    "Capillary Refill": []
  },
  "Respiratory": {
    "Inspection": [],
    "Palpation": [],
    "Percussion": [],
    "Auscultation": []
  },
  "Abdomen": {
    "Inspection": [],
    "Auscultation": [],
    "Percussion": [],
    "Palpation": [],
    "Special Tests": []
  },
  "Genitourinary": {
    "Male": [],
    "Female": []
  },
  "Rectal": {
    "Digital Rectal Exam (DRE)": [],
    "Male": [],
    "Female": []
  },
  "Peripheral Vascular": {
    "Arterial": [],
    "Venous": []
  },
  "Musculoskeletal": {
    "Inspection": [],
    "Palpation": [],
    "ROM Testing": [],
    "Strength Testing (0–5)": [],
    "Joint Specific Tests": []
  },
  "Neurological": {
    "Mental Status": [],
    "Cranial Nerves (I–XII)": [],
    "Motor Function": [],
    "Sensory Testing": [],
    "Reflexes": [],
    "Coordination": [],
    "Gait and Balance": [],
    "Meningeal Signs (if indicated)": []
  },
  "Skin / Hair / Nails": {
    "Inspection": [],
    "Palpation": [],
    "Nails": [],
    "Lesion Assessment": []
  },
  "Lymphatic": {
    "Head/Neck": [],
    "Axillary": [],
    "Epitrochlear": [],
    "Inguinal": []
  },
  "Endocrine": {
    "Thyroid": [],
    "Systemic Signs": []
  },
  "Back": {
    "Inspection": [],
    "Palpation": [],
    "Percussion": [],
    "Range of Motion": [],
    "Special Tests": []
  },
  "Thorax": {
    "Inspection": [],
    "Palpation": [],
    "Percussion": [],
    "Auscultation": []
  },
  "Genital (Male)": {
    "Inspection": [],
    "Palpation": [],
    "Hernia Examination": []
  }
};

class PatientYFolderManager {
  constructor() {
    // Initialize Google Cloud Storage client
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
   * Sanitize folder name for Google Cloud Storage
   * @param {string} name - Folder name to sanitize
   * @returns {string} - Sanitized folder name
   */
  sanitizeFolderName(name) {
    // Replace problematic characters with underscores
    return name.replace(/[<>:"/\\|?*]/g, '_').trim();
  }

  /**
   * Create folder structure recursively
   * @param {Object} categories - Categories object
   * @param {string} currentPath - Current path in the bucket
   */
  async createFolderStructure(categories, currentPath = '') {
    for (const [categoryName, subcategories] of Object.entries(categories)) {
      const sanitizedCategoryName = this.sanitizeFolderName(categoryName);
      const folderPath = currentPath ? `${currentPath}/${sanitizedCategoryName}` : sanitizedCategoryName;
      
      console.log(`Creating folder: ${folderPath}`);
      
      try {
        // Create a placeholder file to ensure the folder exists
        const folderMarker = `${folderPath}/.folder_marker`;
        const file = this.bucket.file(folderMarker);
        
        await file.save('', {
          metadata: {
            contentType: 'text/plain',
            metadata: {
              purpose: 'folder_marker',
              category: categoryName,
              created_by: 'PatientYFolderManager'
            }
          }
        });
        
        console.log(`✓ Created folder: ${folderPath}`);
        
        // If subcategories is an object, recurse
        if (typeof subcategories === 'object' && !Array.isArray(subcategories)) {
          await this.createFolderStructure(subcategories, folderPath);
        }
        // If subcategories is an array, create individual folders for each item
        else if (Array.isArray(subcategories)) {
          for (const item of subcategories) {
            const sanitizedItemName = this.sanitizeFolderName(item);
            const itemPath = `${folderPath}/${sanitizedItemName}`;
            
            console.log(`  Creating subfolder: ${itemPath}`);
            
            const itemMarker = `${itemPath}/.folder_marker`;
            const itemFile = this.bucket.file(itemMarker);
            
            await itemFile.save('', {
              metadata: {
                contentType: 'text/plain',
                metadata: {
                  purpose: 'folder_marker',
                  item: item,
                  created_by: 'PatientYFolderManager'
                }
              }
            });
            
            console.log(`  ✓ Created subfolder: ${itemPath}`);
          }
        }
        
      } catch (error) {
        console.error(`✗ Error creating folder ${folderPath}:`, error.message);
      }
    }
  }

  /**
   * Create the complete Patient Y folder structure
   */
  async createPatientYStructure() {
    console.log(`Starting to create Patient Y folder structure in bucket: ${this.bucketName}`);
    console.log('='.repeat(60));
    
    try {
      // Create the base Patient Y folder
      const baseMarker = `${this.basePath}/.folder_marker`;
      const baseFile = this.bucket.file(baseMarker);
      
      await baseFile.save('', {
        metadata: {
          contentType: 'text/plain',
          metadata: {
            purpose: 'folder_marker',
            description: 'Patient Y Physical Examination Folders',
            created_by: 'PatientYFolderManager'
          }
        }
      });
      
      console.log(`✓ Created base folder: ${this.basePath}`);
      
      // Create all exam category folders
      await this.createFolderStructure(examCategories, this.basePath);
      
      console.log('='.repeat(60));
      console.log('✅ Patient Y folder structure created successfully!');
      
      // List the created structure
      await this.listFolderStructure();
      
    } catch (error) {
      console.error('❌ Error creating Patient Y folder structure:', error);
      throw error;
    }
  }

  /**
   * List the created folder structure
   */
  async listFolderStructure() {
    console.log('\n📁 Created folder structure:');
    console.log('='.repeat(60));
    
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `${this.basePath}/`,
        delimiter: '/'
      });
      
      const folders = new Set();
      files.forEach(file => {
        const pathParts = file.name.split('/');
        if (pathParts.length > 1) {
          // Get folder path (everything except the filename)
          const folderPath = pathParts.slice(0, -1).join('/');
          if (folderPath.startsWith(this.basePath)) {
            folders.add(folderPath);
          }
        }
      });
      
      // Sort folders for better display
      const sortedFolders = Array.from(folders).sort();
      
      sortedFolders.forEach(folder => {
        const relativePath = folder.replace(`${this.basePath}/`, '');
        const depth = relativePath.split('/').length;
        const indent = '  '.repeat(depth);
        console.log(`${indent}📁 ${relativePath.split('/').pop()}`);
      });
      
    } catch (error) {
      console.error('Error listing folder structure:', error);
    }
  }

  /**
   * Clean up folder markers (optional)
   */
  async cleanupFolderMarkers() {
    console.log('\n🧹 Cleaning up folder markers...');
    
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `${this.basePath}/`
      });
      
      const markerFiles = files.filter(file => file.name.endsWith('.folder_marker'));
      
      for (const file of markerFiles) {
        await file.delete();
        console.log(`✓ Deleted marker: ${file.name}`);
      }
      
      console.log('✅ Folder markers cleaned up successfully!');
      
    } catch (error) {
      console.error('❌ Error cleaning up folder markers:', error);
    }
  }
}

// Main execution
async function main() {
  // Check if required environment variables are present
  const requiredEnvVars = [
    'VITE_GOOGLE_CLOUD_PROJECT_ID',
    'VITE_GOOGLE_CLOUD_CLIENT_EMAIL',
    'VITE_GOOGLE_CLOUD_PRIVATE_KEY',
    'VITE_GOOGLE_CLOUD_BUCKET_NAME'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error('\nPlease ensure your .env file is in the project root and contains all required variables.');
    process.exit(1);
  }
  
  console.log('🚀 Patient Y Folder Structure Setup');
  console.log(`📦 Bucket: ${process.env.VITE_GOOGLE_CLOUD_BUCKET_NAME}`);
  console.log(`🏥 Project: ${process.env.VITE_GOOGLE_CLOUD_PROJECT_ID}`);
  console.log('');
  
  const folderManager = new PatientYFolderManager();
  
  try {
    await folderManager.createPatientYStructure();
    
    // Optionally clean up folder markers after creation
    // await folderManager.cleanupFolderMarkers();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);

export default PatientYFolderManager;