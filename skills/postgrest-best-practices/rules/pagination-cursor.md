---
title: Implement Cursor-Based Pagination for Large Datasets
impact: HIGH
impactDescription: Efficient pagination that doesn't degrade on deep pages
tags: pagination, cursor, keyset, performance
---

## Implement Cursor-Based Pagination for Large Datasets

Use cursor-based (keyset) pagination instead of offset for large datasets. Performance stays constant regardless of page depth.

**Incorrect (offset degrades on deep pages):**

```bash
# Page 1000 with offset - scans and discards 9990 rows!
curl "http://localhost:3000/products?order=id&limit=10&offset=9990"
# Gets slower as offset increases
```

**Correct (cursor-based pagination):**

```bash
# First page - order by a unique column
curl "http://localhost:3000/products?order=id&limit=10"
# Returns: [..., {"id": 10, "name": "Product 10"}]

# Next page - filter by last seen id
curl "http://localhost:3000/products?order=id&limit=10&id=gt.10"
# Returns: [{"id": 11, ...}, ..., {"id": 20, ...}]

# Next page
curl "http://localhost:3000/products?order=id&limit=10&id=gt.20"

# Descending order (newer first)
curl "http://localhost:3000/products?order=created_at.desc,id.desc&limit=10"
# Next page: use last item's values
curl "http://localhost:3000/products?order=created_at.desc,id.desc&limit=10&or=(created_at.lt.2024-01-15,and(created_at.eq.2024-01-15,id.lt.100))"
```

**supabase-js:**

```typescript
// First page
const { data: firstPage } = await supabase
  .from('products')
  .select('*')
  .order('id')
  .limit(10)

// Get cursor from last item
const lastId = firstPage[firstPage.length - 1].id

// Next page using cursor
const { data: nextPage } = await supabase
  .from('products')
  .select('*')
  .order('id')
  .gt('id', lastId)
  .limit(10)

// Helper function
async function fetchPage(cursor?: number) {
  let query = supabase
    .from('products')
    .select('*')
    .order('id')
    .limit(10)

  if (cursor) {
    query = query.gt('id', cursor)
  }

  const { data } = await query
  const nextCursor = data?.length ? data[data.length - 1].id : null

  return { data, nextCursor }
}
```

**Compound cursor (non-unique sort column):**

```typescript
// When sorting by non-unique column, include tie-breaker
async function fetchByDate(cursor?: { date: string; id: number }) {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(10)

  if (cursor) {
    // Items before cursor (descending)
    query = query.or(
      `created_at.lt.${cursor.date},and(created_at.eq.${cursor.date},id.lt.${cursor.id})`
    )
  }

  const { data } = await query
  const lastItem = data?.[data.length - 1]
  const nextCursor = lastItem
    ? { date: lastItem.created_at, id: lastItem.id }
    : null

  return { data, nextCursor }
}
```

**Performance comparison:**

| Page | Offset time | Cursor time |
|------|-------------|-------------|
| 1 | 10ms | 10ms |
| 100 | 50ms | 10ms |
| 10000 | 500ms | 10ms |

**Requirements:**
- Must have a unique cursor column (or combination)
- Results must be consistently ordered
- Can't jump to arbitrary page (sequential only)

**Use cases:**
- Infinite scroll
- "Load more" buttons
- Feed/timeline pagination
- Real-time lists

Reference: [Keyset Pagination](https://use-the-index-luke.com/no-offset)
