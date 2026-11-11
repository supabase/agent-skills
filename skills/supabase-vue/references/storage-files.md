---
title: Validate Browser Uploads and Respect Storage Policies
impact: HIGH
impactDescription: Reduces unsafe file handling and prevents private objects from being exposed as public URLs
tags: storage, upload, signed-url, vue, security
---

## Treat browser file checks as UX, not authorization

Use a private bucket by default for user-specific files. Validate user-selected files in the browser for useful feedback, but enforce limits and allowed content types in bucket configuration/policies and trusted processing where appropriate. Never trust the filename, extension, MIME type, size, path, or client-supplied owner ID alone.

```ts
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const uploadError = ref<string | null>(null)
const uploading = ref(false)

async function uploadAvatar(file: File | undefined, userId: string) {
  uploadError.value = null
  if (!file) return
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
  if (!allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Choose a PNG, JPEG, or WebP image smaller than 5 MB.'
    return
  }

  uploading.value = true
  try {
    // userId-derived paths are organization, not authorization; Storage RLS must enforce ownership.
    const path = `${userId}/avatar-${crypto.randomUUID()}`
    const { data, error } = await supabase.storage
      .from('private-avatars')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw error
    return data.path
  } catch (cause) {
    uploadError.value = cause instanceof Error ? cause.message : 'Unable to upload file.'
  } finally {
    uploading.value = false
  }
}
```

Check `error` for upload, download, list, delete, and signed-URL creation. For private files, use `download()` or generate a short-lived `createSignedUrl()` after the signed-in user is authorized by the Storage policy. Do not persist or render private URLs as if URL secrecy were protection. `getPublicUrl()` constructs a URL; it does not verify that a bucket is public.

An upload of a new object generally needs INSERT access to `storage.objects`; `upsert: true` additionally needs SELECT and UPDATE. Avoid upsert unless required. Define user/folder and bucket restrictions in RLS policies, keep permissions least-privileged, and configure allowed MIME types and size limits at the bucket. Never use a service-role key in a browser to bypass Storage policies.

References: [Storage quickstart](https://supabase.com/docs/guides/storage/quickstart), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [JavaScript upload](https://supabase.com/docs/reference/javascript/file-buckets-upload), [signed URLs](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl).
