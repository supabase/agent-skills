---
title: Use Limit and Offset for Simple Pagination
impact: MEDIUM-HIGH
impactDescription: Basic pagination with page-based navigation
tags: pagination, limit, offset, paging
---

## Use Limit and Offset for Simple Pagination

Use `limit` and `offset` query parameters for basic pagination. Simple to implement but less efficient for deep pages.

**Incorrect (fetching all records):**

```bash
# Fetches entire table - slow and memory intensive
curl "http://localhost:3000/products"
# Returns thousands of rows
```

**Correct (paginated requests):**

```bash
# First page (10 items)
curl "http://localhost:3000/products?limit=10"

# Second page
curl "http://localhost:3000/products?limit=10&offset=10"

# Third page
curl "http://localhost:3000/products?limit=10&offset=20"

# With ordering (important for consistent pagination)
curl "http://localhost:3000/products?order=created_at.desc&limit=10&offset=0"

# Combined with filters
curl "http://localhost:3000/products?category=eq.electronics&limit=10&offset=0"
```

**supabase-js:**

```typescript
// First page
const { data } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, 9)  // 0-indexed, inclusive (returns 10 items)

// Second page
const { data } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })
  .range(10, 19)

// Using limit/offset directly
const { data } = await supabase
  .from('products')
  .select('*')
  .limit(10)
  .offset(20)  // Page 3
```

**Calculating offset:**

```typescript
// Page-based calculation
const pageSize = 10
const page = 3  // 1-indexed
const offset = (page - 1) * pageSize  // 20

const { data } = await supabase
  .from('products')
  .select('*')
  .limit(pageSize)
  .offset(offset)
```

**Important: Always include ORDER BY:**

```bash
# Without order, results may be inconsistent between pages
curl "http://localhost:3000/products?limit=10&offset=10"  # Order may vary!

# With explicit order - consistent results
curl "http://localhost:3000/products?order=id&limit=10&offset=10"
```

**Performance note:**
- Offset scans and discards rows
- Deep pages (high offset) are slow: `offset=10000` scans 10000 rows
- For large datasets, use cursor-based pagination instead

**Limits:**
- PostgREST may have max rows limit (`db-max-rows`)
- Consider server memory for large limits

Reference: [PostgREST Pagination](https://postgrest.org/en/stable/references/api/pagination_count.html)
