---
title: Paginate Within Embedded Resources
impact: MEDIUM
impactDescription: Limit and order child collections independently
tags: pagination, embedding, nested, limit
---

## Paginate Within Embedded Resources

Apply pagination, ordering, and limits to embedded resources using dot-notation parameters.

**Incorrect (fetching all children):**

```bash
# Fetches ALL books for each author - could be thousands
curl "http://localhost:3000/authors?select=*,books(*)"
# Each author might have 500+ books!
```

**Correct (limit embedded resources):**

```bash
# Limit books per author
curl "http://localhost:3000/authors?select=*,books(*)&books.limit=5"

# Order and limit
curl "http://localhost:3000/authors?select=*,books(*)&books.order=published_date.desc&books.limit=5"
# Shows latest 5 books per author

# Offset within embedded (page 2 of books)
curl "http://localhost:3000/authors?select=*,books(*)&books.order=title&books.limit=10&books.offset=10"

# Combined with parent filters
curl "http://localhost:3000/authors?genre=eq.fiction&select=*,books(*)&books.limit=3"
```

**supabase-js:**

```typescript
// Limit embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .limit(5, { referencedTable: 'books' });

// Order and limit embedded
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .order('published_date', { referencedTable: 'books', ascending: false })
  .limit(5, { referencedTable: 'books' });

// Multiple embedded resources with different limits
const { data } = await supabase
  .from('users')
  .select('*, posts(*), comments(*)')
  .order('created_at', { referencedTable: 'posts', ascending: false })
  .limit(10, { referencedTable: 'posts' })
  .order('created_at', { referencedTable: 'comments', ascending: false })
  .limit(5, { referencedTable: 'comments' });
```

**Multiple embedded resources:**

```bash
# Different limits for different embeddings
curl "http://localhost:3000/users?select=*,posts(*),comments(*)&posts.limit=10&posts.order=created_at.desc&comments.limit=5&comments.order=created_at.desc"
```

**Nested embedded pagination:**

```bash
# Limit at multiple levels
curl "http://localhost:3000/authors?select=*,books(title,reviews(*))&books.limit=3&books.reviews.limit=5"
```

```typescript
const { data } = await supabase
  .from('authors')
  .select('*, books(title, reviews(*))')
  .limit(3, { referencedTable: 'books' })
  .limit(5, { referencedTable: 'books.reviews' });
```

**Common patterns:**

```bash
# Show preview data
# Users with latest 3 posts
curl "http://localhost:3000/users?select=*,posts(*)&posts.order=created_at.desc&posts.limit=3"

# Categories with top 5 products by rating
curl "http://localhost:3000/categories?select=*,products(*)&products.order=rating.desc&products.limit=5"

# Authors with upcoming books only
curl "http://localhost:3000/authors?select=*,books(*)&books.release_date=gt.2024-01-01&books.order=release_date&books.limit=2"
```

Reference: [PostgREST Embedded Filters](https://postgrest.org/en/stable/references/api/resource_embedding.html#embedded-filters)
