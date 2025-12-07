# Google Cloud Storage Configuration

## Required Environment Variables

Add these to your `.env` file:

```bash
# Google Cloud Storage Configuration
GCS_BUCKET_NAME=your-virtual-patient-media-bucket
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
```

## Setup Instructions

### 1. Create a Google Cloud Storage Bucket
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new bucket or use an existing one
3. Note the bucket name for the `GCS_BUCKET_NAME` environment variable

### 2. Set Up Service Account Authentication
1. In Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Create a new service account or use an existing one
3. Download the JSON key file
4. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of this file

### 3. Configure Bucket Permissions
Ensure your service account has these permissions on the bucket:
- `storage.objects.get`
- `storage.objects.list`

### 4. Upload Media Files with Metadata
When uploading files to GCS, make sure to set metadata with a `tag` field:

```bash
# Example using gsutil
gsutil -h "x-goog-meta-tag:xray" cp image.jpg gs://your-bucket-name/

# Example using Google Cloud Console
# Upload file and set custom metadata: tag = "xray"
```

## API Endpoints

### Get Media by Tag
```
GET /api/media/:tag
```
Example: `GET /api/media/xray`

### Get All Media Files
```
GET /api/media
```

### Get Available Tags
```
GET /api/media/tags/available
```

### Get All Files with Specific Tag
```
GET /api/media/tags/:tag/files
```
Example: `GET /api/media/tags/xray/files`

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "tag": "xray",
    "file": {
      "name": "chest-xray-001.jpg",
      "contentType": "image/jpeg",
      "size": "1024000",
      "metadata": {
        "tag": "xray",
        "patient": "case-001"
      },
      "signedUrl": "https://storage.googleapis.com/...",
      "publicUrl": "https://storage.googleapis.com/bucket/chest-xray-001.jpg"
    }
  }
}
```

### Error Response
```json
{
  "error": "No media found",
  "message": "No media files found with tag 'xray'",
  "tag": "xray"
}
```

## Testing

You can test the endpoints using curl:

```bash
# Test getting an X-ray image
curl http://localhost:3000/api/media/xray

# Test getting all available tags
curl http://localhost:3000/api/media/tags/available

# Test getting all files
curl http://localhost:3000/api/media
``` 