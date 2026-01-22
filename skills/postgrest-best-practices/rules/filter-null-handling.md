---
title: Filter NULL Values with IS Operator
impact: HIGH
impactDescription: Correctly handles NULL comparisons that eq/neq cannot
tags: null, is, filtering, empty
---

## Filter NULL Values with IS Operator

Use `is.null` and `is.not_null` to filter NULL values. The `eq` operator cannot match NULL because NULL is not equal to anything, including itself.

**Incorrect (eq.null doesn't work as expected):**

```bash
# This does NOT work - eq cannot match NULL
curl "http://localhost:3000/users?deleted_at=eq.null"    # Wrong!
curl "http://localhost:3000/users?deleted_at=neq.null"   # Wrong!

# Empty string is not NULL
curl "http://localhost:3000/users?deleted_at=eq."        # Matches empty string, not NULL
```

**Correct (use is.null and is.not_null):**

```bash
# Find rows where column IS NULL
curl "http://localhost:3000/users?deleted_at=is.null"

# Find rows where column IS NOT NULL
curl "http://localhost:3000/users?deleted_at=is.not_null"

# Combine with other filters
curl "http://localhost:3000/users?deleted_at=is.null&status=eq.active"

# Multiple nullable columns
curl "http://localhost:3000/profiles?avatar_url=is.null&bio=is.not_null"
```

**supabase-js:**

```typescript
// IS NULL
const { data } = await supabase
  .from('users')
  .select('*')
  .is('deleted_at', null)

// IS NOT NULL
const { data } = await supabase
  .from('users')
  .select('*')
  .not('deleted_at', 'is', null)

// Combined with other filters
const { data } = await supabase
  .from('users')
  .select('*')
  .is('deleted_at', null)
  .eq('status', 'active')
```

**Common use cases:**

```bash
# Find active (non-deleted) records
curl "http://localhost:3000/posts?deleted_at=is.null"

# Find records missing required data
curl "http://localhost:3000/profiles?email=is.null"

# Find completed tasks (has completion date)
curl "http://localhost:3000/tasks?completed_at=is.not_null"
```

Reference: [PostgREST Operators](https://postgrest.org/en/stable/references/api/tables_views.html#operators)
