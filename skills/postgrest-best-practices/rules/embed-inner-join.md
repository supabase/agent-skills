---
title: Filter Parent by Child Using Inner Join Embedding
impact: HIGH
impactDescription: Filter top-level results based on embedded resource conditions
tags: inner-join, filtering, embedding, exists
---

## Filter Parent by Child Using Inner Join Embedding

Use `!inner` to convert an embedding to an INNER JOIN, filtering out parent rows that have no matching children or don't match child filters.

**Incorrect (filtering doesn't affect parent results):**

```bash
# This returns ALL authors, with filtered books array (may be empty)
curl "http://localhost:3000/authors?select=*,books(*)&books.genre=eq.fiction"
# Returns authors with empty books arrays too!
```

**Correct (use !inner to filter parents):**

```bash
# Only authors who have fiction books
curl "http://localhost:3000/authors?select=*,books!inner(*)&books.genre=eq.fiction"

# Only orders with items over $100
curl "http://localhost:3000/orders?select=*,items!inner(*)&items.price=gt.100"

# Only users with verified email (via profile)
curl "http://localhost:3000/users?select=*,profile!inner(*)&profile.email_verified=is.true"
```

**supabase-js:**

```typescript
// Only authors with fiction books
const { data } = await supabase
  .from('authors')
  .select('*, books!inner(*)')
  .eq('books.genre', 'fiction')

// Only orders with expensive items
const { data } = await supabase
  .from('orders')
  .select('*, items!inner(*)')
  .gt('items.price', 100)
```

**Comparison - with vs without !inner:**

```bash
# WITHOUT !inner - all authors, some with empty books
curl "http://localhost:3000/authors?select=*,books(*)&books.year=gt.2020"
# Result: [
#   { "name": "Author A", "books": [{ "title": "New Book" }] },
#   { "name": "Author B", "books": [] },  <- included but empty
#   { "name": "Author C", "books": [] }   <- included but empty
# ]

# WITH !inner - only authors with matching books
curl "http://localhost:3000/authors?select=*,books!inner(*)&books.year=gt.2020"
# Result: [
#   { "name": "Author A", "books": [{ "title": "New Book" }] }
# ]  <- Only authors with books published after 2020
```

**Use cases:**

```bash
# Products that are in stock (have inventory records)
curl "http://localhost:3000/products?select=*,inventory!inner(*)"

# Users who have made at least one order
curl "http://localhost:3000/users?select=*,orders!inner(id)"

# Categories with published posts
curl "http://localhost:3000/categories?select=*,posts!inner(*)&posts.status=eq.published"
```

**Behavior:**
- `!inner` performs an INNER JOIN instead of LEFT JOIN
- Parent rows without matching children are excluded
- Combined with filters on embedded resource, filters both parent and child
- Works with all relationship types (M2O, O2M, M2M)

Reference: [PostgREST Inner Join Embedding](https://postgrest.org/en/stable/references/api/resource_embedding.html#inner-joins)
