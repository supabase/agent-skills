---
title: Use Range Headers for HTTP-Standard Pagination
impact: MEDIUM
impactDescription: RFC 7233 compliant pagination with Content-Range response
tags: pagination, range, headers, rfc7233
---

## Use Range Headers for HTTP-Standard Pagination

Use the `Range` header instead of query parameters for RFC 7233 compliant pagination. Response includes `Content-Range` with total count.

**Incorrect (mixing pagination approaches):**

```bash
# Query params don't give you total count in headers
curl "http://localhost:3000/products?limit=10&offset=0"
# No Content-Range header in response
```

**Correct (Range header pagination):**

```bash
# Request items 0-9 (first 10)
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 0-9"

# Response includes:
# HTTP/1.1 206 Partial Content
# Content-Range: 0-9/1000

# Next page: items 10-19
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 10-19"

# Open-ended range (from 50 to end)
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 50-"
```

**supabase-js:**

```typescript
// supabase-js uses range() which translates to limit/offset
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })  // Request count
  .range(0, 9)

// count contains total number of rows
console.log(`Showing ${data.length} of ${count} items`)
```

**Response headers:**

```
HTTP/1.1 206 Partial Content
Content-Range: 0-9/1000
Content-Type: application/json
```

| Header | Meaning |
|--------|---------|
| `206 Partial Content` | Partial result returned |
| `Content-Range: 0-9/1000` | Items 0-9 of 1000 total |
| `Content-Range: 0-9/*` | Total unknown (no count) |

**Combine with Prefer: count:**

```bash
# Get exact count
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 0-9" \
  -H "Prefer: count=exact"
# Content-Range: 0-9/1000 (exact count)

# Get estimated count (faster for large tables)
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 0-9" \
  -H "Prefer: count=estimated"
```

**Benefits over query params:**
- HTTP standard compliance
- Total count in response headers
- Clear partial content semantics (206 vs 200)
- Client libraries often support Range natively

**Notes:**
- `Range-Unit: items` is required (PostgREST specific)
- Range is 0-indexed and inclusive
- Without Range header, all rows returned (up to max)

Reference: [PostgREST Range Headers](https://postgrest.org/en/stable/references/api/pagination_count.html#limits-and-pagination)
