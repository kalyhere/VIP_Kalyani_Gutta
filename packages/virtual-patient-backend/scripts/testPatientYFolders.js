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

class PatientYFolderTester {
  constructor() {
    this.basePath = 'Patient Y';
    this.foldersToCreate = [];
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
   * Generate folder structure recursively (dry run)
   * @param {Object} categories - Categories object
   * @param {string} currentPath - Current path in the bucket
   */
  generateFolderStructure(categories, currentPath = '') {
    for (const [categoryName, subcategories] of Object.entries(categories)) {
      const sanitizedCategoryName = this.sanitizeFolderName(categoryName);
      const folderPath = currentPath ? `${currentPath}/${sanitizedCategoryName}` : sanitizedCategoryName;
      
      this.foldersToCreate.push({
        path: folderPath,
        originalName: categoryName,
        sanitizedName: sanitizedCategoryName,
        level: currentPath.split('/').length
      });
      
      // If subcategories is an object, recurse
      if (typeof subcategories === 'object' && !Array.isArray(subcategories)) {
        this.generateFolderStructure(subcategories, folderPath);
      }
      // If subcategories is an array, create individual folders for each item
      else if (Array.isArray(subcategories)) {
        for (const item of subcategories) {
          const sanitizedItemName = this.sanitizeFolderName(item);
          const itemPath = `${folderPath}/${sanitizedItemName}`;
          
          this.foldersToCreate.push({
            path: itemPath,
            originalName: item,
            sanitizedName: sanitizedItemName,
            level: folderPath.split('/').length
          });
        }
      }
    }
  }

  /**
   * Test Google Cloud Storage connection
   */
  async testGCSConnection() {
    console.log('🔍 Testing Google Cloud Storage connection...');
    
    try {
      // Initialize Google Cloud Storage client
      const storage = new Storage({
        projectId: process.env.VITE_GOOGLE_CLOUD_PROJECT_ID,
        credentials: {
          client_email: process.env.VITE_GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.VITE_GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
        }
      });
      
      const bucketName = process.env.VITE_GOOGLE_CLOUD_BUCKET_NAME;
      const bucket = storage.bucket(bucketName);
      
      // Test bucket access
      const [exists] = await bucket.exists();
      if (!exists) {
        throw new Error(`Bucket '${bucketName}' does not exist or is not accessible`);
      }
      
      console.log(`✅ Successfully connected to bucket: ${bucketName}`);
      
      // Test write permissions
      const testFile = bucket.file(`${this.basePath}/.connection_test`);
      await testFile.save('Connection test successful', {
        metadata: {
          contentType: 'text/plain'
        }
      });
      
      // Clean up test file
      await testFile.delete();
      
      console.log('✅ Write permissions verified');
      
      return true;
      
    } catch (error) {
      console.error('❌ GCS Connection failed:', error.message);
      return false;
    }
  }

  /**
   * Run the complete test
   */
  async runTest() {
    console.log('🧪 Patient Y Folder Structure Test');
    console.log('='.repeat(50));
    
    // Check environment variables
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
      return false;
    }
    
    console.log('✅ Environment variables verified');
    console.log(`📦 Bucket: ${process.env.VITE_GOOGLE_CLOUD_BUCKET_NAME}`);
    console.log(`🏥 Project: ${process.env.VITE_GOOGLE_CLOUD_PROJECT_ID}`);
    console.log('');
    
    // Test GCS connection
    const connectionOk = await this.testGCSConnection();
    if (!connectionOk) {
      return false;
    }
    
    console.log('');
    
    // Generate folder structure
    console.log('📁 Generating folder structure...');
    this.generateFolderStructure(examCategories, this.basePath);
    
    console.log(`✅ Generated ${this.foldersToCreate.length} folders to create`);
    console.log('');
    
    // Display folder structure
    console.log('📋 Folder Structure Preview:');
    console.log('='.repeat(50));
    
    const groupedFolders = this.foldersToCreate.reduce((acc, folder) => {
      const level = folder.level;
      if (!acc[level]) acc[level] = [];
      acc[level].push(folder);
      return acc;
    }, {});
    
    Object.keys(groupedFolders).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
      groupedFolders[level].forEach(folder => {
        const indent = '  '.repeat(folder.level);
        const nameChange = folder.originalName !== folder.sanitizedName ? 
          ` (${folder.originalName} → ${folder.sanitizedName})` : '';
        console.log(`${indent}📁 ${folder.sanitizedName}${nameChange}`);
      });
    });
    
    console.log('');
    console.log('🎉 Test completed successfully!');
    console.log('');
    console.log('📝 Summary:');
    console.log(`  - Total folders to create: ${this.foldersToCreate.length}`);
    console.log(`  - Base path: ${this.basePath}`);
    console.log(`  - GCS connection: ✅ Working`);
    console.log(`  - Environment: ✅ Valid`);
    console.log('');
    console.log('🚀 Ready to run the actual setup script!');
    console.log('   Run: npm run setup-patient-folders');
    
    return true;
  }
}

// Main execution
async function main() {
  const tester = new PatientYFolderTester();
  const success = await tester.runTest();
  
  if (!success) {
    console.error('❌ Test failed. Please fix the issues above before running the setup script.');
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);

export default PatientYFolderTester;
