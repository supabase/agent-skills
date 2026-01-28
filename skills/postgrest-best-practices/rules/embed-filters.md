---
title: Filter and Order Within Embedded Resources
impact: HIGH
impactDescription: Apply filters, ordering, and limits to embedded collections
tags: embedding, filtering, ordering, limit, nested-filters
---

## Filter and Order Within Embedded Resources

Apply filters, ordering, and pagination to embedded resources using dot-notation on query parameters.

**Incorrect (filtering all at top level):**

```bash
# This filters top-level, not the embedded resource
curl "http://localhost:3000/authors?select=*,books(*)&status=eq.published"  # Wrong! Filters authors
```

**Correct (dot-notation for embedded resource filters):**

```bash
# Filter embedded books (not authors)
curl "http://localhost:3000/authors?select=*,books(*)&books.status=eq.published"

# Order embedded books by date
curl "http://localhost:3000/authors?select=*,books(*)&books.order=published_date.desc"

# Limit embedded books
curl "http://localhost:3000/authors?select=*,books(*)&books.limit=5"

# Combine filter, order, limit on embedded resource
curl "http://localhost:3000/authors?select=*,books(*)&books.status=eq.published&books.order=published_date.desc&books.limit=5"
```

**supabase-js:**

```typescript
// Filter embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .eq('books.status', 'published')

// Order embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .order('published_date', { referencedTable: 'books', ascending: false })

// Limit embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .limit(5, { referencedTable: 'books' })

// Combined
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .eq('books.status', 'published')
  .order('published_date', { referencedTable: 'books', ascending: false })
  .limit(5, { referencedTable: 'books' })
```

**Multiple embedded resources with different filters:**

```bash
# Different filters for different embeddings
curl "http://localhost:3000/users?select=*,posts(*),comments(*)&posts.status=eq.published&comments.order=created_at.desc&comments.limit=10"
```

```typescript
const { data } = await supabase
  .from('users')
  .select('*, posts(*), comments(*)')
  .eq('posts.status', 'published')
  .order('created_at', { referencedTable: 'comments', ascending: false })
  .limit(10, { referencedTable: 'comments' })
```

**Filtering nested embeddings:**

```bash
# Filter at nested level
curl "http://localhost:3000/categories?select=*,products(name,reviews(*))&products.reviews.rating=gte.4"
```

**Offset for pagination within embeddings:**

```bash
# Page 2 of books (5 per page)
curl "http://localhost:3000/authors?select=*,books(*)&books.limit=5&books.offset=5"
```

**Use cases:**
- Show "top 5 recent posts" per user
- Display "highest rated products" per category
- List "latest 10 comments" per article
- Show "active orders" per customer

Reference: [PostgREST Embedded Filters](https://postgrest.org/en/stable/references/api/resource_embedding.html#embedded-filters)
