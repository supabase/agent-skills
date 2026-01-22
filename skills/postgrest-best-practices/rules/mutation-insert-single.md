---
title: Insert Single Rows with POST
impact: HIGH
impactDescription: Create new records using POST with JSON body
tags: insert, post, create, mutation
---

## Insert Single Rows with POST

Use POST request with a JSON object body to insert a single row. Use `Prefer: return=representation` to get the inserted row back.

**Incorrect (GET with body or wrong content type):**

```bash
# GET cannot create records
curl "http://localhost:3000/users" -d '{"name": "John"}'  # Wrong!

# Missing content-type header
curl "http://localhost:3000/users" -X POST -d '{"name": "John"}'  # May fail
```

**Correct (POST with JSON):**

```bash
# Basic insert
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# With return=representation to get inserted row
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
# Returns: [{"id": 1, "name": "John Doe", "email": "john@example.com", "created_at": "..."}]

# Select specific columns in response
curl "http://localhost:3000/users?select=id,name" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
# Returns: [{"id": 1, "name": "John Doe"}]
```

**supabase-js:**

```typescript
// Basic insert
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John Doe', email: 'john@example.com' })

// With select (returns inserted row)
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John Doe', email: 'john@example.com' })
  .select()

// Select specific columns
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John Doe', email: 'john@example.com' })
  .select('id, name')
```

**Response codes:**

| Prefer header | Success code | Response body |
|---------------|--------------|---------------|
| `return=minimal` (default) | 201 | Empty |
| `return=representation` | 201 | Inserted row(s) |
| `return=headers-only` | 201 | Empty, Location header |

**With default values:**

```bash
# Omit columns that have defaults
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"title": "My Post", "content": "..."}'
# created_at, updated_at, etc. use database defaults
```

Reference: [PostgREST Insert](https://postgrest.org/en/stable/references/api/tables_views.html#insert)
