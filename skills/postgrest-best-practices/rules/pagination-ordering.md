---
title: Order Results with the Order Parameter
impact: MEDIUM-HIGH
impactDescription: Sort results by any column with direction control
tags: order, sort, ascending, descending
---

## Order Results with the Order Parameter

Use the `order` parameter to sort results. Specify column name and optional direction (`.asc` or `.desc`). Essential for consistent pagination.

**Incorrect (relying on database default order):**

```bash
# No order specified - results may vary between requests
curl "http://localhost:3000/products?limit=10"
# Order is undefined, inconsistent for pagination
```

**Correct (explicit ordering):**

```bash
# Ascending (default)
curl "http://localhost:3000/products?order=name"
curl "http://localhost:3000/products?order=name.asc"

# Descending
curl "http://localhost:3000/products?order=created_at.desc"

# Multiple columns (comma-separated)
curl "http://localhost:3000/products?order=category.asc,price.desc"

# With other parameters
curl "http://localhost:3000/products?category=eq.electronics&order=price.desc&limit=20"
```

**supabase-js:**

```typescript
// Ascending (default)
const { data } = await supabase
  .from('products')
  .select('*')
  .order('name')

// Descending
const { data } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })

// Multiple columns
const { data } = await supabase
  .from('products')
  .select('*')
  .order('category')
  .order('price', { ascending: false })
```

**Order by JSON fields:**

```bash
# Order by JSONB field
curl "http://localhost:3000/products?order=metadata->>priority.desc"

# Order by nested JSON
curl "http://localhost:3000/products?order=metadata->dimensions->>weight.asc"
```

```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .order('metadata->priority', { ascending: false })
```

**Order embedded resources:**

```bash
# Order parent by embedded column (to-one only)
curl "http://localhost:3000/posts?select=*,author:users(name)&order=author(name)"

# Order within embedded resource
curl "http://localhost:3000/authors?select=*,books(*)&books.order=published_date.desc"
```

```typescript
// Order embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .order('published_date', { referencedTable: 'books', ascending: false })
```

**Important for pagination:**

```bash
# Always order when paginating for consistent results
curl "http://localhost:3000/products?order=id&limit=10&offset=10"

# For cursor pagination, include unique column
curl "http://localhost:3000/products?order=created_at.desc,id.desc&limit=10"
```

Reference: [PostgREST Ordering](https://postgrest.org/en/stable/references/api/tables_views.html#ordering)
