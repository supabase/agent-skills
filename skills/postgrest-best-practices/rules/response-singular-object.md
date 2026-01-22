---
title: Request Single Object Instead of Array
impact: MEDIUM
impactDescription: Get unwrapped object for single-row queries
tags: singular, object, single, response, vnd.pgrst
---

## Request Single Object Instead of Array

Use `Accept: application/vnd.pgrst.object+json` to get a single object instead of an array when expecting one row.

**Incorrect (array wrapping single result):**

```bash
curl "http://localhost:3000/users?id=eq.123"
# Returns: [{"id": 123, "name": "John"}]  <- Array with one item

# Client must unwrap:
# const user = data[0]
```

**Correct (request singular object):**

```bash
# Single object response
curl "http://localhost:3000/users?id=eq.123" \
  -H "Accept: application/vnd.pgrst.object+json"
# Returns: {"id": 123, "name": "John"}  <- Direct object

# Works with any single-row query
curl "http://localhost:3000/profiles?user_id=eq.123" \
  -H "Accept: application/vnd.pgrst.object+json"
```

**supabase-js:**

```typescript
// Use .single() for singular response
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', 123)
  .single()

// data is the object directly, not an array
console.log(data.name)  // "John"

// Error if not exactly one row
// - No rows: error.code = 'PGRST116'
// - Multiple rows: error.code = 'PGRST116'
```

**Error handling:**

```bash
# No matching rows - 406 Not Acceptable
curl "http://localhost:3000/users?id=eq.999" \
  -H "Accept: application/vnd.pgrst.object+json"
# Error: "JSON object requested, multiple (or no) rows returned"

# Multiple rows - 406 Not Acceptable
curl "http://localhost:3000/users?status=eq.active" \
  -H "Accept: application/vnd.pgrst.object+json"
# Error: multiple rows returned
```

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', 123)
  .single()

if (error) {
  if (error.code === 'PGRST116') {
    // No rows or multiple rows
    console.log('User not found or query ambiguous')
  }
}
```

**Use cases:**

```typescript
// Fetch single record by ID
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// Get authenticated user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', session.user.id)
  .single()

// Lookup by unique field
const { data: product } = await supabase
  .from('products')
  .select('*')
  .eq('sku', 'WIDGET-001')
  .single()
```

**maybeSingle() for optional results:**

```typescript
// Won't error if no rows found
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', 123)
  .maybeSingle()

// data is null if no rows, object if one row
// Still errors if multiple rows
```

Reference: [PostgREST Singular Response](https://postgrest.org/en/stable/references/api/tables_views.html#singular-or-plural)
