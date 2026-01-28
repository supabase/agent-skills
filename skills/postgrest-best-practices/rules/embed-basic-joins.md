---
title: Embed Related Resources Using Foreign Keys
impact: CRITICAL
impactDescription: Join related tables in a single request using PostgREST's automatic relationship detection
tags: embedding, joins, relationships, foreign-key, select
---

## Embed Related Resources Using Foreign Keys

PostgREST automatically detects relationships via foreign keys. Include related tables in the `select` parameter using the syntax `related_table(columns)`.

**Incorrect (no embedding - requires multiple requests):**

```bash
# First request: get posts
curl "http://localhost:3000/posts?select=id,title,author_id"

# Second request: get author details separately
curl "http://localhost:3000/users?id=eq.123"
```

**Correct (embed related resources):**

```bash
# Single request with embedded author
curl "http://localhost:3000/posts?select=id,title,author:users(id,name,email)"

# Embed all columns from related table
curl "http://localhost:3000/posts?select=*,author:users(*)"

# Multiple embeddings
curl "http://localhost:3000/posts?select=*,author:users(name),category:categories(name)"

# Without alias (uses table name)
curl "http://localhost:3000/posts?select=*,users(name)"
```

**supabase-js:**

```typescript
// Embed with alias
const { data } = await supabase
  .from('posts')
  .select('id, title, author:users(id, name, email)')

// Embed all columns
const { data } = await supabase
  .from('posts')
  .select('*, author:users(*)')

// Multiple embeddings
const { data } = await supabase
  .from('posts')
  .select('*, author:users(name), category:categories(name)')
```

**Result structure:**

```json
[
  {
    "id": 1,
    "title": "My Post",
    "author": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

**How it works:**

1. PostgREST reads your database schema on startup
2. It detects foreign key relationships between tables
3. When you embed a table, it performs a JOIN automatically
4. The relationship name defaults to the table name but can be aliased

**Requirements:**
- Foreign key must exist between tables
- Both tables must be in the exposed schema
- User must have SELECT permission on both tables

Reference: [PostgREST Resource Embedding](https://postgrest.org/en/stable/references/api/resource_embedding.html)
