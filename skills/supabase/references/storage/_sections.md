# Section Definitions

Reference files are grouped by prefix. Claude loads specific files based on user
queries.

---

## 1. Access Control (access)

**Impact:** CRITICAL
**Description:** Bucket configuration (public vs private), Storage-specific RLS
policies on storage.objects, and helper functions (storage.filename,
storage.foldername, storage.extension).

## 2. Uploads (upload)

**Impact:** HIGH
**Description:** Standard uploads for small files, resumable/TUS protocol for
large files, S3 multipart uploads, signed upload URLs, and upsert behavior.

## 3. Downloads (download)

**Impact:** MEDIUM
**Description:** Public URLs via getPublicUrl, signed URLs for private content,
download method, and force-download vs inline rendering.

## 4. Image Transformations (transform)

**Impact:** MEDIUM
**Description:** Resize, crop, quality, format options. Limits (2500px, 25MB,
50MP). WebP auto-optimization and Next.js loader patterns.

## 5. CDN & Caching (cdn)

**Impact:** HIGH
**Description:** Smart CDN with auto-revalidation, cache-control headers, 60s
propagation delay, and stale content mitigation strategies.

## 6. File Operations (ops)

**Impact:** MEDIUM
**Description:** Move, copy, delete operations, listing with pagination, and
cross-bucket operations. Critical: never delete via SQL.
