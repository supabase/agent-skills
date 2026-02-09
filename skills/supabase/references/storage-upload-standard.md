---
title: Use Standard Uploads for Small Files
impact: HIGH
impactDescription: Ensures reliable uploads for files under 6MB
tags: storage, upload, small-files, upsert, signed-upload
---

## Use Standard Uploads for Small Files

Standard upload works best for files up to 6MB. For larger files, use resumable
uploads.

## Basic Upload

```javascript
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('folder/file.jpg', file, {
    cacheControl: '3600',
    upsert: false  // Fail if exists (default)
  });
```

## Upsert Behavior

```javascript
// Replace existing file
await supabase.storage
  .from('bucket-name')
  .upload('folder/file.jpg', file, { upsert: true });
```

**Warning:** Upsert with CDN caching can serve stale content for up to 60
seconds. Consider unique paths instead.

## Concurrent Upload Conflicts

Without `upsert: true`, first client to complete wins. Others get
`400 Asset Already Exists`.

**Incorrect:**

```javascript
// Same filename causes conflicts in concurrent uploads
await supabase.storage.from('uploads').upload('avatar.jpg', file);
// Error: Asset Already Exists (if another upload completed first)
```

**Correct:**

```javascript
// Unique filenames prevent conflicts
const filename = `${Date.now()}-${crypto.randomUUID()}.jpg`;
await supabase.storage.from('uploads').upload(filename, file);
```

## Upload with Metadata

```javascript
await supabase.storage
  .from('documents')
  .upload('report.pdf', file, {
    contentType: 'application/pdf',
    cacheControl: '86400',
    metadata: { uploadedBy: user.id, version: '1.0' }
  });
```

## Signed Upload URLs

Allow direct client uploads without exposing credentials:

```javascript
// Server: Generate signed URL
const { data, error } = await supabase.storage
  .from('uploads')
  .createSignedUploadUrl('folder/file.jpg');

// Client: Upload directly using token
await supabase.storage
  .from('uploads')
  .uploadToSignedUrl('folder/file.jpg', data.token, file);
```

## Size Limits

File size limits vary by plan. See
[Docs](https://supabase.com/docs/guides/storage/uploads/file-limits) for current
limits. Use resumable uploads for files > 6MB. For optimal performance when
uploading large files, use the direct storage hostname
(`https://<ref>.storage.supabase.co`).

## Related

- [upload-resumable.md](upload-resumable.md) - Large file uploads
- [cdn-caching.md](cdn-caching.md) - Cache invalidation
- [Docs](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
