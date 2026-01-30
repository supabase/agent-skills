---
title: Choose the Right Download Method
impact: MEDIUM
impactDescription: Ensures correct file access for public and private content
tags: storage, download, signed-url, public-url, getPublicUrl
---

## Choose the Right Download Method

Select the method based on bucket visibility and use case.

## Public URLs (Public Buckets)

**Incorrect:**

```javascript
// Using signed URL for public bucket wastes an API call
const { data, error } = await supabase.storage
  .from('public-bucket')
  .createSignedUrl('image.jpg', 3600);
```

**Correct:**

```javascript
// getPublicUrl is instant - no API call needed for public buckets
const { data } = supabase.storage
  .from('public-bucket')
  .getPublicUrl('folder/image.jpg');
```

**Note:** Returns URL even if file doesn't exist. Does not verify existence.

## Signed URLs (Private Buckets)

```javascript
// Time-limited access URL
const { data, error } = await supabase.storage
  .from('private-bucket')
  .createSignedUrl('document.pdf', 3600);  // Expires in 1 hour
```

### Multiple Signed URLs

```javascript
const { data, error } = await supabase.storage
  .from('bucket')
  .createSignedUrls(['file1.pdf', 'file2.pdf'], 3600);
```

## Download as Blob

```javascript
// Download file content directly
const { data, error } = await supabase.storage
  .from('bucket')
  .download('file.pdf');

// data is a Blob
const url = URL.createObjectURL(data);
```

## Force Download vs Render

```javascript
// Force browser download (not render in tab)
const { data } = supabase.storage
  .from('bucket')
  .getPublicUrl('file.pdf', { download: true });

// Custom download filename
const { data } = supabase.storage
  .from('bucket')
  .getPublicUrl('file.pdf', { download: 'report-2024.pdf' });
```

## With Image Transformations

```javascript
const { data } = supabase.storage
  .from('images')
  .getPublicUrl('photo.jpg', {
    transform: { width: 200, height: 200, resize: 'cover' }
  });
```

## Method Comparison

| Method | Auth Required | Best For |
|--------|---------------|----------|
| `getPublicUrl` | No (public buckets) | Static assets, avatars |
| `createSignedUrl` | Yes (to create) | Temporary access, private files |
| `download` | Per RLS | Server-side processing |

## Related

- [access-control.md](access-control.md) - Public vs private buckets
- [transform-images.md](transform-images.md) - Image transformations
- [Docs](https://supabase.com/docs/guides/storage/serving/downloads)
