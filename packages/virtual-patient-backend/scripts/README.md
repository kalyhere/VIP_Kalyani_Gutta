# Patient Y Folder Structure Setup Script

This script creates a comprehensive folder structure in Google Cloud Storage for Patient Y's physical examination categories, based on the structure defined in `PhysicalExamInterface.jsx`.

## Overview

The script creates a hierarchical folder structure in the `aidset-magic-kingdom-test-bucket` bucket under the `Patient Y` directory, organizing all physical examination categories and subcategories for easy media file organization.

## Folder Structure Created

The script creates the following main categories:

- **General** - General appearance and assessment
- **HEENT (Head, Eyes, Ears, Nose, Throat)** - Head and neck examinations
- **Neck** - Neck-specific examinations
- **Breast** - Breast examination procedures
- **Cardiovascular** - Heart and vascular examinations
- **Respiratory** - Lung and breathing assessments
- **Abdomen** - Abdominal examinations
- **Genitourinary** - Genital and urinary examinations
- **Rectal** - Rectal examination procedures
- **Peripheral Vascular** - Blood vessel assessments
- **Musculoskeletal** - Joint and muscle examinations
- **Neurological** - Nervous system assessments
- **Skin / Hair / Nails** - Dermatological examinations
- **Lymphatic** - Lymph node examinations
- **Endocrine** - Hormonal system assessments
- **Back** - Back and spine examinations
- **Thorax** - Chest examinations
- **Genital (Male)** - Male-specific genital examinations

Each main category contains relevant subcategories and examination procedures.

## Prerequisites

1. **Environment Variables**: Ensure your `.env` file in the project root contains:
   ```env
   VITE_GOOGLE_CLOUD_PROJECT_ID=medical-scenario-creator
   VITE_GOOGLE_CLOUD_CLIENT_EMAIL=aidset-magic-kingdom-test-buck@medical-scenario-creator.iam.gserviceaccount.com
   VITE_GOOGLE_CLOUD_PRIVATE_KEY=your_private_key_here
   VITE_GOOGLE_CLOUD_BUCKET_NAME=aidset-magic-kingdom-test-bucket
   ```

2. **Google Cloud Storage Access**: The service account must have appropriate permissions to read/write to the bucket.

3. **Dependencies**: All required dependencies should be installed via `npm install`.

## Available Scripts

This directory contains several scripts for managing Patient Y's folder structure:

1. **`setupPatientYFolders.js`** - Creates the complete folder structure
2. **`testPatientYFolders.js`** - Tests connection and previews folder structure (dry run)
3. **`physicalExamFolderManager.js`** - Utility class for managing media files in folders

## Usage

### Test First (Recommended)

Before creating the actual folders, test your setup:

```bash
npm run test-patient-folders
```

This will:
- Verify environment variables
- Test Google Cloud Storage connection
- Preview the folder structure that will be created
- Check write permissions

### Create Folder Structure

Once the test passes, create the actual folders:

```bash
npm run setup-patient-folders
```

### Direct Execution

You can also run the scripts directly:

```bash
# Test only
node scripts/testPatientYFolders.js

# Create folders
node scripts/setupPatientYFolders.js
```

### From Project Root

```bash
cd packages/virtual-patient-backend
npm run test-patient-folders
npm run setup-patient-folders
```

## What the Script Does

1. **Validates Environment**: Checks that all required environment variables are present
2. **Creates Base Folder**: Creates the main `Patient Y` folder in the bucket
3. **Builds Hierarchy**: Recursively creates all category and subcategory folders
4. **Folder Markers**: Creates `.folder_marker` files to ensure folders exist (GCS doesn't have true folders)
5. **Lists Structure**: Displays the created folder hierarchy for verification
6. **Error Handling**: Provides clear error messages and handles failures gracefully

## Output Example

```
🚀 Patient Y Folder Structure Setup
📦 Bucket: aidset-magic-kingdom-test-bucket
🏥 Project: medical-scenario-creator

Starting to create Patient Y folder structure in bucket: aidset-magic-kingdom-test-bucket
============================================================
✓ Created base folder: Patient Y
Creating folder: Patient Y/General
✓ Created folder: Patient Y/General
Creating folder: Patient Y/General/Appearance
✓ Created folder: Patient Y/General/Appearance
...
============================================================
✅ Patient Y folder structure created successfully!

📁 Created folder structure:
============================================================
📁 General
  📁 Appearance
📁 HEENT (Head, Eyes, Ears, Nose, Throat)
  📁 Head
  📁 Eyes
  📁 Ears
  📁 Nose
  📁 Throat_Mouth
...
```

## Folder Markers

The script creates `.folder_marker` files in each folder to ensure the folder structure exists in Google Cloud Storage. These markers:

- Are invisible placeholder files
- Contain metadata about the folder's purpose
- Can be safely deleted after folder creation if desired
- Help maintain the folder structure even when empty

## Troubleshooting

### Missing Environment Variables
If you see an error about missing environment variables:
1. Ensure your `.env` file is in the project root directory
2. Check that all required variables are present and correctly formatted
3. Verify the private key doesn't have formatting issues (should include `\n` characters)

### Permission Errors
If you get permission errors:
1. Verify the service account has Storage Object Admin permissions
2. Check that the bucket name is correct
3. Ensure the service account email matches your `.env` file

### Network Issues
If the script fails due to network issues:
1. Check your internet connection
2. Verify Google Cloud Storage API is accessible
3. Try running the script again

## Customization

To modify the folder structure:

1. Edit the `examCategories` object in `setupPatientYFolders.js`
2. Add or remove categories as needed
3. Run the script again to create the updated structure

## Cleanup

If you need to remove the folder markers after creation, uncomment the cleanup line in the main function:

```javascript
// Optionally clean up folder markers after creation
await folderManager.cleanupFolderMarkers();
```

## Using the PhysicalExamFolderManager Utility

The `PhysicalExamFolderManager` class provides convenient methods for working with the created folder structure:

```javascript
import PhysicalExamFolderManager from './scripts/physicalExamFolderManager.js';

const manager = new PhysicalExamFolderManager();

// Get path for a specific examination
const path = manager.getPathForExam('Cardiovascular', 'Auscultation', 'Heart Sounds');
// Returns: "Patient Y/Cardiovascular/Auscultation/Heart Sounds"

// Upload a media file
await manager.uploadMediaFile(
  'Cardiovascular', 
  'Auscultation', 
  'Heart Sounds',
  'normal_heartbeat.mp3',
  fileBuffer,
  'audio/mpeg'
);

// List files in a folder
const files = await manager.listFilesInFolder('Cardiovascular', 'Auscultation');

// Get folder statistics
const stats = await manager.getFolderStats('Cardiovascular');
console.log(`Total files: ${stats.totalFiles}, Size: ${stats.totalSize} bytes`);

// Get public URL for a file
const url = manager.getPublicUrl('Patient Y/Cardiovascular/Auscultation/normal_heartbeat.mp3');
```

## Integration with PhysicalExamInterface

This folder structure is designed to work seamlessly with the `PhysicalExamInterface.jsx` component, allowing you to:

1. Upload media files to the appropriate category folders
2. Reference them in the interface using the same category structure
3. Maintain consistency between the UI and storage organization
4. Use the utility class for programmatic file management

## Support

For issues or questions about this script, please refer to the project documentation or contact the development team.
