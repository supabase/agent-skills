---
title: Use Column Defaults for Missing Values
impact: MEDIUM
impactDescription: Apply database DEFAULT values instead of NULL for omitted columns
tags: prefer, missing, default, insert, columns
---

## Use Column Defaults for Missing Values

Use `Prefer: missing=default` to apply column DEFAULT values for fields not included in the request body, instead of inserting NULL.

**Incorrect (missing columns become NULL):**

```bash
# Without preference, missing columns are NULL
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"title": "My Post"}'
# status=NULL, created_at=NULL (if no DB default trigger)
```

**Correct (use column defaults):**

```bash
# Missing columns use DEFAULT from schema
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: missing=default, return=representation" \
  -d '{"title": "My Post"}'
# Returns: {"id": 1, "title": "My Post", "status": "draft", "created_at": "2024-01-15T..."}
# status got DEFAULT 'draft', created_at got DEFAULT now()

# Bulk insert with defaults
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: missing=default, return=representation" \
  -d '[{"title": "Post 1"}, {"title": "Post 2"}]'
```

**supabase-js:**

```typescript
// supabase-js uses missing=default by default for insert
const { data } = await supabase
  .from('posts')
  .insert({ title: 'My Post' })
  .select()

// Columns with DEFAULT in schema will use those values
// data: [{ id: 1, title: 'My Post', status: 'draft', created_at: '...' }]
```

**Schema with defaults:**

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Comparison:**

| Prefer | Missing column | Result |
|--------|----------------|--------|
| (none) | Not in payload | NULL |
| `missing=default` | Not in payload | Column DEFAULT |
| - | `"col": null` | NULL (explicit) |

**Partial updates (PATCH):**

```bash
# missing=default doesn't apply to PATCH by default
# Only provided columns are updated
curl "http://localhost:3000/posts?id=eq.1" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
# Only title changes, other columns unchanged
```

**Use cases:**
- Simplified client payloads (omit optional fields)
- Consistent behavior with database defaults
- Bulk imports with minimal data
- Version-tolerant APIs (new columns with defaults)

Reference: [PostgREST Missing Preference](https://postgrest.org/en/stable/references/api/preferences.html#missing)
