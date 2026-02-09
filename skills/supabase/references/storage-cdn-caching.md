---
title: Understand CDN Caching and Stale Content
impact: HIGH
impactDescription: Prevents serving outdated files after updates
tags: storage, cdn, caching, cache-control, stale-content, smart-cdn
---

## Understand CDN Caching and Stale Content

All plans include CDN caching. Smart CDN (Pro+) automatically invalidates the
CDN cache when files change (up to 60s propagation). Without Smart CDN, the CDN
evicts based on regional request activity only.

`cacheControl` controls **browser** cache, not CDN cache.

## Smart CDN Behavior (Pro+)

- Automatically invalidates cache when files change
- Propagation delay: up to 60 seconds
- No manual cache purging available

## Setting Cache Control

```javascript
await supabase.storage
  .from('assets')
  .upload('logo.png', file, {
    cacheControl: '3600'  // 1 hour in seconds
  });
```

## Stale Content Problem

**Incorrect - Overwriting files:**

```javascript
// With Smart CDN: stale for up to 60s. Without: stale until CDN evicts.
await supabase.storage
  .from('avatars')
  .upload('avatar.jpg', newFile, { upsert: true });
```

**Correct - Upload to unique paths:**

```javascript
const filename = `avatar-${Date.now()}.jpg`;

await supabase.storage
  .from('avatars')
  .upload(`user123/${filename}`, newFile);

// Update database reference
await supabase
  .from('profiles')
  .update({ avatar_path: `user123/${filename}` })
  .eq('id', 'user123');

// Delete old file
await supabase.storage.from('avatars').remove([oldPath]);
```

## Cache-Control Guidelines

| Asset Type | Duration | Reasoning |
|------------|----------|-----------|
| User avatars | 3600 (1h) | Changes occasionally |
| Static assets | 31536000 (1y) | Use versioned filenames |
| Documents | 0 | Always fresh |
| Public images | 86400 (1d) | Balance freshness/performance |

## Debugging Cache

Check response headers:

```bash
curl -I "https://<ref>.supabase.co/storage/v1/object/public/bucket/file.jpg"
```

- `Cache-Control`: Configured TTL
- `Age`: Seconds since cached
- `cf-cache-status`: HIT or MISS

## Related

- [upload-standard.md](upload-standard.md) - Upload options
- [Docs](https://supabase.com/docs/guides/storage/cdn/smart-cdn)
