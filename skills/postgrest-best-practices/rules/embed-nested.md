---
title: Nest Embeddings for Multi-Level Relationships
impact: HIGH
impactDescription: Traverse multiple relationship levels in single request
tags: nested, deep, multi-level, embedding, relationships
---

## Nest Embeddings for Multi-Level Relationships

Embed resources within embedded resources to traverse multiple levels of relationships in a single request.

**Incorrect (multiple requests for each level):**

```bash
# Get post
curl "http://localhost:3000/posts?id=eq.1"

# Get author
curl "http://localhost:3000/users?id=eq.{author_id}"

# Get author's company
curl "http://localhost:3000/companies?id=eq.{company_id}"
```

**Correct (nested embedding in single request):**

```bash
# Posts with author and author's company
curl "http://localhost:3000/posts?select=title,author:users(name,company:companies(name,logo_url))"

# Three levels deep
curl "http://localhost:3000/orders?select=*,customer:customers(name,address:addresses(city,country:countries(name)))"

# Nested with multiple branches
curl "http://localhost:3000/posts?select=*,author:users(name,profile:profiles(bio)),comments(text,user:users(name))"
```

**supabase-js:**

```typescript
// Nested embedding
const { data } = await supabase
  .from('posts')
  .select(`
    title,
    author:users(
      name,
      company:companies(
        name,
        logo_url
      )
    )
  `)

// Multiple nested branches
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    author:users(
      name,
      profile:profiles(bio)
    ),
    comments(
      text,
      user:users(name)
    )
  `)
```

**Result structure:**

```json
{
  "title": "My Post",
  "author": {
    "name": "John Doe",
    "company": {
      "name": "Acme Inc",
      "logo_url": "https://..."
    }
  }
}
```

**Complex example - e-commerce order:**

```bash
curl "http://localhost:3000/orders?select=id,total,created_at,customer:customers(name,email),items:order_items(quantity,product:products(name,price,category:categories(name))),shipping:shipping_info(address,carrier:carriers(name,tracking_url))&id=eq.1"
```

```typescript
const { data } = await supabase
  .from('orders')
  .select(`
    id,
    total,
    created_at,
    customer:customers(name, email),
    items:order_items(
      quantity,
      product:products(
        name,
        price,
        category:categories(name)
      )
    ),
    shipping:shipping_info(
      address,
      carrier:carriers(name, tracking_url)
    )
  `)
  .eq('id', 1)
  .single()
```

**Filtering at nested levels:**

```bash
# Filter at any level
curl "http://localhost:3000/posts?select=*,author:users(name,posts(title))&author.posts.status=eq.published"
```

**Performance note:**
- Each embedding level adds a JOIN
- Deep nesting can impact performance
- Consider using views for very complex queries
- Monitor query plans for heavily nested queries

Reference: [PostgREST Resource Embedding](https://postgrest.org/en/stable/references/api/resource_embedding.html)
