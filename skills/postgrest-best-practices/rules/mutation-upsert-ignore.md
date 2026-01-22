---
title: Skip Duplicates with Ignore Resolution
impact: MEDIUM
impactDescription: Insert new rows only, silently skip existing ones
tags: upsert, ignore, duplicates, insert, mutation
---

## Skip Duplicates with Ignore Resolution

Use `Prefer: resolution=ignore-duplicates` to insert new rows while silently skipping any that would violate unique constraints.

**Incorrect (checking existence before insert):**

```javascript
// Multiple requests, race condition prone
for (const item of items) {
  const existing = await fetch(`/products?sku=eq.${item.sku}`)
  if (existing.length === 0) {
    await fetch('/products', { method: 'POST', body: item })
  }
}
```

**Correct (ignore duplicates in bulk):**

```bash
# Insert new, skip existing (by PK)
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=ignore-duplicates, return=representation" \
  -d '[
    {"id": 1, "name": "Existing Product"},
    {"id": 999, "name": "New Product"}
  ]'
# Only returns newly inserted rows, silently skips id=1 if exists

# Skip by unique constraint
curl "http://localhost:3000/users?on_conflict=email" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=ignore-duplicates, return=representation" \
  -d '[
    {"email": "existing@example.com", "name": "Ignored"},
    {"email": "new@example.com", "name": "Inserted"}
  ]'
```

**supabase-js:**

```typescript
// Insert new, skip duplicates
const { data, error } = await supabase
  .from('products')
  .upsert(
    [
      { id: 1, name: 'Existing Product' },
      { id: 999, name: 'New Product' }
    ],
    { ignoreDuplicates: true }
  )
  .select()
// data contains only newly inserted rows

// With specific conflict column
const { data, error } = await supabase
  .from('users')
  .upsert(
    [
      { email: 'existing@example.com', name: 'Ignored' },
      { email: 'new@example.com', name: 'Inserted' }
    ],
    { onConflict: 'email', ignoreDuplicates: true }
  )
  .select()
```

**Use cases:**

1. **Idempotent imports** - Safe to re-run without duplicating data
```bash
# Daily import can be re-run safely
curl "http://localhost:3000/daily_metrics" \
  -X POST \
  -H "Prefer: resolution=ignore-duplicates" \
  -d @todays_metrics.json
```

2. **Sync operations** - Insert missing records only
```typescript
const { data } = await supabase
  .from('sync_items')
  .upsert(remoteItems, { ignoreDuplicates: true })
```

3. **Batch processing** - No errors on duplicates
```bash
# Process queue without duplicate errors
curl "http://localhost:3000/processed_items" \
  -X POST \
  -H "Prefer: resolution=ignore-duplicates" \
  -d @batch.json
```

**Comparison:**

| Resolution | Existing row | New row |
|------------|--------------|---------|
| `merge-duplicates` | Updated | Inserted |
| `ignore-duplicates` | Skipped (no change) | Inserted |

**Notes:**
- Skipped rows are not returned (even with `return=representation`)
- No error is raised for conflicts
- Count only includes actually inserted rows

Reference: [PostgREST Upsert](https://postgrest.org/en/stable/references/api/tables_views.html#on-conflict)
