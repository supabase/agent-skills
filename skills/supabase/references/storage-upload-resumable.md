---
title: Use Resumable Uploads for Large Files
impact: HIGH
impactDescription: Enables reliable upload of large files with progress and resume
tags: storage, upload, large-files, tus, resumable, multipart
---

## Use Resumable Uploads for Large Files

For files larger than 6MB, use TUS resumable uploads or S3 multipart uploads.
For optimal performance when uploading large files, use the direct storage
hostname (`https://<ref>.storage.supabase.co`) instead of `https://<ref>.supabase.co`.

## TUS Resumable Upload

```javascript
import * as tus from 'tus-js-client';

const { data: { session } } = await supabase.auth.getSession();

const upload = new tus.Upload(file, {
  endpoint: `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`,
  retryDelays: [0, 3000, 5000, 10000, 20000],
  headers: {
    authorization: `Bearer ${session.access_token}`,
    'x-upsert': 'true'  // Optional: overwrite existing
  },
  uploadDataDuringCreation: true,
  removeFingerprintOnSuccess: true,
  metadata: {
    bucketName: 'videos',
    objectName: 'folder/video.mp4',
    contentType: 'video/mp4',
    cacheControl: '3600'
  },
  chunkSize: 6 * 1024 * 1024,  // Must be 6MB for Supabase
  onError: (error) => console.error('Failed:', error),
  onProgress: (bytesUploaded, bytesTotal) => {
    console.log(`${((bytesUploaded / bytesTotal) * 100).toFixed(1)}%`);
  },
  onSuccess: () => console.log('Complete')
});

upload.start();
```

## Resume Interrupted Upload

```javascript
// Check for previous uploads
const previousUploads = await upload.findPreviousUploads();
if (previousUploads.length > 0) {
  upload.resumeFromPreviousUpload(previousUploads[0]);
}
upload.start();
```

## S3 Multipart Upload

For server-side uploads or S3-compatible tooling:

```javascript
import { S3Client, CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const s3 = new S3Client({
  region: '<your-project-region>',
  endpoint: `https://${projectRef}.storage.supabase.co/storage/v1/s3`,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY
  },
  forcePathStyle: true
});

const upload = new Upload({
  client: s3,
  params: {
    Bucket: 'bucket-name',
    Key: 'path/to/file.zip',
    Body: fileStream,
    ContentType: 'application/zip'
  }
});

upload.on('httpUploadProgress', (progress) => {
  console.log(`${progress.loaded}/${progress.total}`);
});

await upload.done();
```

## When to Use Each Method

| Method | Best For |
|--------|----------|
| Standard | < 6MB, simple uploads |
| TUS | > 6MB, browser uploads, unreliable networks |
| S3 Multipart | Server-side, very large files |

Max file sizes vary by plan. See
[Docs](https://supabase.com/docs/guides/storage/uploads/file-limits) for current
limits.

## TUS Configuration Notes

**Incorrect:**

```javascript
// Wrong chunk size - will fail
chunkSize: 10 * 1024 * 1024  // 10MB - not supported
```

**Correct:**

```javascript
// Supabase requires exactly 6MB chunks
chunkSize: 6 * 1024 * 1024  // 6MB - required
```

- Chunk size must be exactly 6MB for Supabase
- Upload URLs valid for 24 hours
- Use direct storage URL: `https://{ref}.storage.supabase.co/storage/v1/upload/resumable`

## Related

- [upload-standard.md](upload-standard.md) - Small file uploads
- [Docs](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
