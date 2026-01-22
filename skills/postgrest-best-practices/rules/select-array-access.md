---
title: Access Array Elements by Index
impact: MEDIUM
impactDescription: Extract specific array elements without fetching entire array
tags: arrays, index, select, elements
---

## Access Array Elements by Index

Use `->index` to access specific elements in PostgreSQL array columns. Supports positive (from start) and negative (from end) indices.

**Incorrect (fetching entire array client-side):**

```bash
# Fetches entire array when you only need first element
curl "http://localhost:3000/products?select=id,tags"
# Returns: { "id": 1, "tags": ["electronics", "sale", "featured", ...] }
# Client extracts tags[0]
```

**Correct (access specific index):**

```bash
# First element (index 0)
curl "http://localhost:3000/products?select=id,primaryTag:tags->0"
# Returns: { "id": 1, "primaryTag": "electronics" }

# Second element
curl "http://localhost:3000/products?select=id,tags->1"

# Last element (negative index)
curl "http://localhost:3000/products?select=id,lastTag:tags->-1"

# Multiple elements
curl "http://localhost:3000/products?select=id,first:tags->0,second:tags->1,last:tags->-1"
```

**supabase-js:**

```typescript
// First element
const { data } = await supabase
  .from('products')
  .select('id, primaryTag:tags->0')

// Last element
const { data } = await supabase
  .from('products')
  .select('id, lastTag:tags->-1')

// Multiple
const { data } = await supabase
  .from('products')
  .select('id, first:tags->0, second:tags->1, last:tags->-1')
```

**With JSONB arrays:**

```bash
# Access JSONB array element
curl "http://localhost:3000/products?select=id,firstImage:images->0"
# Returns JSON object at index 0

# Further navigation into array element
curl "http://localhost:3000/products?select=id,firstImageUrl:images->0->>url"
```

```typescript
// JSONB array access with nested extraction
const { data } = await supabase
  .from('products')
  .select('id, firstImageUrl:images->0->>url')
```

**Composite type arrays:**

```bash
# Access field from composite type in array
curl "http://localhost:3000/users?select=id,primaryPhone:phones->0->>number"
```

**Notes:**
- Index 0 is the first element
- Negative indices count from end (-1 is last)
- Out of bounds returns null
- Works with both native arrays and JSONB arrays
- Can be combined with casting: `tags->0::text`

**Filtering on array elements:**

```bash
# Filter by first tag value
curl "http://localhost:3000/products?select=*&tags->0=eq.featured"
```

Reference: [PostgREST Array Access](https://postgrest.org/en/stable/references/api/tables_views.html#composite-array-columns)
