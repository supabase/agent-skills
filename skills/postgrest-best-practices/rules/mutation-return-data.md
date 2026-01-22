---
title: Return Affected Rows with Prefer Header
impact: MEDIUM
impactDescription: Get inserted/updated/deleted data without additional query
tags: prefer, return, representation, mutation, response
---

## Return Affected Rows with Prefer Header

Use `Prefer: return=representation` to get the affected rows back in the response, avoiding an additional query.

**Incorrect (mutation then separate query):**

```javascript
// Two requests when one would suffice
await fetch('/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' })
})
// Need ID? Make another request
const user = await fetch('/users?name=eq.John&order=created_at.desc&limit=1')
```

**Correct (return=representation):**

```bash
# INSERT - get inserted row(s)
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John Doe"}'
# Returns: [{"id": 123, "name": "John Doe", "created_at": "..."}]

# UPDATE - get updated row(s)
curl "http://localhost:3000/users?id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"email": "new@example.com"}'

# DELETE - get deleted row(s)
curl "http://localhost:3000/users?id=eq.123" \
  -X DELETE \
  -H "Prefer: return=representation"
```

**supabase-js:**

```typescript
// Insert with select returns data
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John Doe' })
  .select()  // Equivalent to return=representation

// Update with select
const { data, error } = await supabase
  .from('users')
  .update({ email: 'new@example.com' })
  .eq('id', 123)
  .select()

// Delete with select
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', 123)
  .select()
```

**Return options:**

| Prefer value | Response | Use case |
|--------------|----------|----------|
| `return=minimal` | Empty (201/204) | Fire and forget |
| `return=representation` | Affected rows as JSON | Need the data |
| `return=headers-only` | Empty with Location header | Need URL only |

**Select specific columns:**

```bash
# Only return id and name
curl "http://localhost:3000/users?select=id,name" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John", "email": "john@example.com"}'
# Returns: [{"id": 123, "name": "John"}]
```

```typescript
// Select specific columns
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John', email: 'john@example.com' })
  .select('id, name')
// data: [{ id: 123, name: 'John' }]
```

**With embedded resources:**

```bash
# Return with embedded data
curl "http://localhost:3000/posts?select=id,title,author:users(name)" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"title": "New Post", "author_id": 123}'
```

Reference: [PostgREST Prefer Header](https://postgrest.org/en/stable/references/api/preferences.html#prefer)
