---
title: Control NULL Ordering with Nulls First/Last
impact: MEDIUM
impactDescription: Specify where NULL values appear in sorted results
tags: order, nulls, null-handling, sort
---

## Control NULL Ordering with Nulls First/Last

Use `.nullsfirst` or `.nullslast` modifiers to control where NULL values appear in sorted results.

**Incorrect (inconsistent NULL handling):**

```bash
# Default NULL ordering varies by database and direction
curl "http://localhost:3000/products?order=discount.desc"
# NULLs might appear first or last depending on PostgreSQL default
```

**Correct (explicit NULL ordering):**

```bash
# NULLs at the end (common for "missing data")
curl "http://localhost:3000/products?order=discount.desc.nullslast"

# NULLs at the beginning
curl "http://localhost:3000/products?order=priority.asc.nullsfirst"

# Combined with multiple columns
curl "http://localhost:3000/products?order=category.asc,discount.desc.nullslast"

# Each column can have its own null handling
curl "http://localhost:3000/tasks?order=due_date.asc.nullslast,priority.desc.nullsfirst"
```

**supabase-js:**

```typescript
// NULLs last
const { data } = await supabase
  .from('products')
  .select('*')
  .order('discount', { ascending: false, nullsFirst: false })

// NULLs first
const { data } = await supabase
  .from('products')
  .select('*')
  .order('priority', { ascending: true, nullsFirst: true })

// Multiple columns with null handling
const { data } = await supabase
  .from('tasks')
  .select('*')
  .order('due_date', { ascending: true, nullsFirst: false })
  .order('priority', { ascending: false, nullsFirst: true })
```

**Default behavior:**

| Direction | PostgreSQL Default |
|-----------|-------------------|
| ASC | NULLS LAST |
| DESC | NULLS FIRST |

**Common patterns:**

```bash
# Tasks by due date - no due date at end
curl "http://localhost:3000/tasks?order=due_date.asc.nullslast"
# Shows: Jan 1, Jan 5, Feb 1, NULL, NULL

# Products by discount - no discount last
curl "http://localhost:3000/products?order=discount.desc.nullslast"
# Shows: 50%, 30%, 10%, NULL, NULL

# Sort by optional field with nulls first
curl "http://localhost:3000/users?order=last_login.desc.nullsfirst"
# Shows: NULL (never logged in), Jan 15, Jan 10...
```

**Use cases:**
- Show items without due dates at the end
- Prioritize items with values over empty ones
- Show "unset" or "unknown" items first for review
- Consistent ordering regardless of NULL prevalence

Reference: [PostgREST Ordering](https://postgrest.org/en/stable/references/api/tables_views.html#ordering)
