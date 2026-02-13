---
title: Transform Images On-the-Fly
impact: MEDIUM
impactDescription: Reduces bandwidth with server-side image transformations
tags: storage, images, transform, resize, webp, optimization
---

## Transform Images On-the-Fly

Supabase transforms images at request time. Results are cached at the CDN.
Available on Pro plan and above.

## Basic Transformation

```javascript
const { data } = supabase.storage
  .from('images')
  .getPublicUrl('photo.jpg', {
    transform: {
      width: 400,
      height: 300,
      resize: 'cover',
      quality: 80
    }
  });
```

## Resize Modes

| Mode | Behavior |
|------|----------|
| `cover` | Crop to fill dimensions (default) |
| `contain` | Fit within dimensions, keep aspect ratio |
| `fill` | Stretch to fill dimensions |

## Transformation Limits

| Limit | Value |
|-------|-------|
| Max dimension | 2500px |
| Max file size | 25MB |
| Max resolution | 50 megapixels |

**Incorrect:**

```javascript
// Exceeds 2500px limit - will not apply transformation
transform: { width: 3000, height: 3000 }
```

**Correct:**

```javascript
// Within limits - transformation applied
transform: { width: 2500, height: 2500 }
```

## WebP Auto-Optimization

Without explicit format, Supabase serves WebP to supporting browsers:

```javascript
// Browser receives WebP if supported
transform: { width: 400 }  // No format = auto WebP
```

To keep original format:

```javascript
transform: { width: 400, format: 'origin' }
```

## Direct URL Parameters

```
https://xxx.supabase.co/storage/v1/render/image/public/bucket/image.jpg
  ?width=400&height=300&resize=cover&quality=80
```

## Next.js Image Loader

```javascript
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './supabase-loader.js',
  },
};

// supabase-loader.js
export default function supabaseLoader({ src, width, quality }) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/${src}?width=${width}&quality=${quality || 75}`;
}
```

```jsx
<Image src="bucket/photo.jpg" width={400} height={300} alt="Photo" />
```

## Responsive Images

```javascript
const sizes = [320, 640, 1280];
const srcset = sizes.map(w => {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl('photo.jpg', { transform: { width: w } });
  return `${data.publicUrl} ${w}w`;
}).join(', ');
```

## Related

- [download-urls.md](download-urls.md) - URL generation methods
- [cdn-caching.md](cdn-caching.md) - Transformation caching
- [Docs](https://supabase.com/docs/guides/storage/serving/image-transformations)
