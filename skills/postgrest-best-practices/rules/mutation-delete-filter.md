---
title: Always Filter DELETE Requests
impact: HIGH
impactDescription: Prevent accidental data loss with mandatory filters
tags: delete, filter, safety, mutation
---

## Always Filter DELETE Requests

Always include filters when using DELETE. Never delete without explicit conditions to prevent accidental data loss.

**Incorrect (no filter - catastrophic!):**

```bash
# This deletes ALL rows!
curl "http://localhost:3000/users" -X DELETE
# Entire table emptied - data loss!
```

**Correct (always include filters):**

```bash
# Delete specific row by ID
curl "http://localhost:3000/users?id=eq.123" \
  -X DELETE \
  -H "Prefer: return=representation"

# Delete multiple rows with filter
curl "http://localhost:3000/sessions?expires_at=lt.2024-01-01" \
  -X DELETE

# Delete with complex filter
curl "http://localhost:3000/orders?status=eq.cancelled&created_at=lt.2023-01-01" \
  -X DELETE \
  -H "Prefer: return=representation"
```

**supabase-js:**

```typescript
// Delete by ID
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', 123)
  .select()  // Returns deleted row

// Delete with filter
const { data, error } = await supabase
  .from('sessions')
  .delete()
  .lt('expires_at', '2024-01-01')

// Complex filter
const { data, error } = await supabase
  .from('orders')
  .delete()
  .eq('status', 'cancelled')
  .lt('created_at', '2023-01-01')
  .select()
```

**Return deleted rows:**

```bash
curl "http://localhost:3000/users?id=eq.123" \
  -X DELETE \
  -H "Prefer: return=representation"
# Returns: [{"id": 123, "name": "John", ...}]
```

**Limit affected rows:**

```bash
# Safety limit - error if too many would be deleted
curl "http://localhost:3000/old_logs?created_at=lt.2023-01-01" \
  -X DELETE \
  -H "Prefer: max-affected=1000"
# Errors if more than 1000 rows would be deleted
```

**Soft delete pattern:**

```bash
# Instead of DELETE, update a deleted_at column
curl "http://localhost:3000/users?id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"deleted_at": "2024-01-15T10:00:00Z"}'
```

```typescript
// Soft delete
const { data, error } = await supabase
  .from('users')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', 123)
```

**Safety measures:**
1. Always require filters (PostgREST default)
2. Use RLS policies to restrict deletions
3. Use `max-affected` header for safety limits
4. Consider soft deletes for critical data
5. Implement backup/audit trails

Reference: [PostgREST Delete](https://postgrest.org/en/stable/references/api/tables_views.html#delete)
