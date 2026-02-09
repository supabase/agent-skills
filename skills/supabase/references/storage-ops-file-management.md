---
title: Manage Files Through the API
impact: MEDIUM
impactDescription: Prevents orphaned files and billing issues
tags: storage, delete, move, copy, list, operations
---

## Manage Files Through the API

Always use SDK methods for file operations. Never modify `storage.objects`
directly via SQL.

## Critical: Never Delete via SQL

**Incorrect - Creates orphaned files:**

```sql
-- NEVER do this! Deletes metadata but file remains on disk
-- The orphaned file continues to consume storage
DELETE FROM storage.objects WHERE name = 'file.jpg';
```

**Correct - Use SDK:**

```javascript
// Deletes both metadata and actual file
await supabase.storage.from('bucket').remove(['file.jpg']);
```

## Delete Files

```javascript
// Single or multiple files
await supabase.storage.from('bucket').remove([
  'folder/file1.jpg',
  'folder/file2.jpg'
]);
```

### Delete Folder Contents

```javascript
const { data: files } = await supabase.storage
  .from('bucket')
  .list('folder-to-delete');

if (files?.length) {
  await supabase.storage
    .from('bucket')
    .remove(files.map(f => `folder-to-delete/${f.name}`));
}
```

## Move Files

```javascript
await supabase.storage
  .from('bucket')
  .move('old/path/file.jpg', 'new/path/file.jpg');
```

Requires SELECT on source and INSERT on destination via RLS.

## Copy Files

```javascript
await supabase.storage
  .from('bucket')
  .copy('source/file.jpg', 'destination/file.jpg');
```

Requires SELECT on source and INSERT on destination via RLS.

## List Files

```javascript
const { data, error } = await supabase.storage
  .from('bucket')
  .list('folder', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
    search: 'report'  // Filter by name prefix
  });
```

### Paginate All Files

```javascript
async function listAllFiles(bucket, folder) {
  const files = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data } = await supabase.storage
      .from(bucket)
      .list(folder, { limit, offset });

    if (!data?.length) break;
    files.push(...data);
    offset += limit;
  }

  return files;
}
```

## File Info

```javascript
const { data, error } = await supabase.storage
  .from('bucket')
  .info('path/to/file.jpg');

// Returns: id, name, size, metadata, created_at, updated_at
```

## Related

- [access-control.md](access-control.md) - RLS for operations
- [Docs](https://supabase.com/docs/guides/storage/management/delete-objects)
