---
title: Configure Storage Access Control
impact: CRITICAL
impactDescription: Prevents unauthorized file access and upload failures
tags: storage, buckets, public, private, rls, policies, security
---

## Configure Storage Access Control

Storage access combines bucket visibility settings with RLS policies on
`storage.objects`. Understanding both is essential.

## Public vs Private Buckets

"Public" ONLY affects unauthenticated downloads. All other operations require
RLS policies.

| Operation | Public Bucket | Private Bucket |
|-----------|---------------|----------------|
| Download  | No auth needed | Signed URL or auth header |
| Upload    | RLS required  | RLS required |
| Update    | RLS required  | RLS required |
| Delete    | RLS required  | RLS required |

**Incorrect assumption:**

```javascript
// "Public bucket means anyone can upload" - WRONG
await supabase.storage.from('public-bucket').upload('file.txt', file);
// Error: new row violates row-level security policy
```

## Bucket Configuration

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
);
```

## Storage Helper Functions

Use these in RLS policy expressions:

```sql
storage.filename(name)     -- 'folder/file.jpg' -> 'file.jpg'
storage.foldername(name)   -- 'user/docs/f.pdf' -> ['user', 'docs']
storage.extension(name)    -- 'file.jpg' -> 'jpg'
```

## Common RLS Patterns

### User Folder Isolation

```sql
create policy "User folder access"
on storage.objects for all to authenticated
using (
  bucket_id = 'user-files' and
  (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'user-files' and
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Owner-Based Access

```sql
create policy "Owner access"
on storage.objects for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
```

### File Type Restriction

```sql
create policy "Images only"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'images' and
  storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);
```

### Public Read, Authenticated Write

```sql
create policy "Public read"
on storage.objects for select to public
using (bucket_id = 'public-assets');

create policy "Auth write"
on storage.objects for insert to authenticated
with check (bucket_id = 'public-assets');
```

## SDK Method to RLS Operation

| SDK Method | SQL Operation |
|------------|---------------|
| upload     | INSERT        |
| upload (upsert) | SELECT + INSERT + UPDATE |
| download   | SELECT        |
| list       | SELECT        |
| remove     | SELECT + DELETE |
| move       | SELECT + UPDATE |
| copy       | SELECT + INSERT |

## Related

- [db/rls-common-mistakes.md](../db/rls-common-mistakes.md) - General RLS pitfalls
- [db/rls-policy-types.md](../db/rls-policy-types.md) - PERMISSIVE vs RESTRICTIVE
- [Docs](https://supabase.com/docs/guides/storage/security/access-control)
