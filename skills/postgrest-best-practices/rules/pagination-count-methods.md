---
title: Choose the Right Count Method for Performance
impact: MEDIUM-HIGH
impactDescription: Balance accuracy vs performance when counting rows
tags: count, pagination, exact, estimated, planned
---

## Choose the Right Count Method for Performance

PostgREST offers three count methods: `exact`, `planned`, and `estimated`. Choose based on your accuracy needs and table size.

**Incorrect (always using exact count):**

```bash
# Exact count on huge table - slow!
curl "http://localhost:3000/logs?limit=10" \
  -H "Prefer: count=exact"
# Scans entire table to count - takes seconds on millions of rows
```

**Correct (choose appropriate count method):**

```bash
# exact - Accurate but slow on large tables
curl "http://localhost:3000/products?limit=10" \
  -H "Prefer: count=exact"
# Content-Range: 0-9/1523 (exact count)

# planned - Fast, uses PostgreSQL statistics (may be stale)
curl "http://localhost:3000/logs?limit=10" \
  -H "Prefer: count=planned"
# Content-Range: 0-9/1000000 (estimated from pg_class.reltuples)

# estimated - Exact for small tables, planned for large
curl "http://localhost:3000/products?limit=10" \
  -H "Prefer: count=estimated"
# Uses exact if total < db-max-rows, else planned
```

**supabase-js:**

```typescript
// Exact count
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .limit(10)

// Planned count (estimated)
const { data, count } = await supabase
  .from('logs')
  .select('*', { count: 'planned' })
  .limit(10)

// Estimated (auto-chooses)
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'estimated' })
  .limit(10)
```

**Comparison:**

| Method | Speed | Accuracy | Use when |
|--------|-------|----------|----------|
| `exact` | Slow | 100% | Small tables, exact count required |
| `planned` | Fast | ~90%* | Large tables, approximate OK |
| `estimated` | Auto | Variable | General purpose |

*Planned accuracy depends on ANALYZE frequency

**When to use each:**

```typescript
// Small lookup table - use exact
const { count } = await supabase
  .from('categories')  // < 1000 rows
  .select('*', { count: 'exact' })

// Huge log table - use planned
const { count } = await supabase
  .from('request_logs')  // millions of rows
  .select('*', { count: 'planned' })

// User-facing pagination - use estimated
const { count } = await supabase
  .from('products')  // unknown size
  .select('*', { count: 'estimated' })
```

**No count (fastest):**

```bash
# Don't request count if not needed
curl "http://localhost:3000/products?limit=10"
# No Content-Range total, fastest query
```

```typescript
// No count - fastest
const { data } = await supabase
  .from('products')
  .select('*')  // No count option
  .limit(10)
```

**Improve planned accuracy:**

```sql
-- Keep statistics fresh for accurate planned counts
ANALYZE products;
```

Reference: [PostgREST Counting](https://postgrest.org/en/stable/references/api/pagination_count.html#exact-count)
