---
title: Control Response Behavior with Prefer Header
impact: MEDIUM
impactDescription: Customize return format, counting, and handling behavior
tags: prefer, headers, return, count, handling
---

## Control Response Behavior with Prefer Header

Use the `Prefer` header (RFC 7240) to control various response behaviors including return format, counting, and error handling.

**Incorrect (not using Prefer options):**

```bash
# Mutation returns nothing by default
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
# Response: empty, status 201
# Need another request to get the created row
```

**Correct (use Prefer header):**

```bash
# Return created/updated rows
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John"}'
# Returns: [{"id": 1, "name": "John", ...}]

# Get row count
curl "http://localhost:3000/products?category=eq.electronics" \
  -H "Prefer: count=exact"
# Content-Range: 0-9/150

# Multiple preferences
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation, count=exact" \
  -d '{"name": "John"}'
```

**supabase-js equivalents:**

```typescript
// return=representation -> .select()
const { data } = await supabase
  .from('users')
  .insert({ name: 'John' })
  .select()

// count=exact -> { count: 'exact' }
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .eq('category', 'electronics')
```

**Common Prefer options:**

| Preference | Values | Description |
|------------|--------|-------------|
| `return` | `minimal`, `representation`, `headers-only` | What to return after mutation |
| `count` | `exact`, `planned`, `estimated` | How to count rows |
| `handling` | `strict`, `lenient` | How to handle invalid preferences |
| `timezone` | `America/New_York` | Response timezone |
| `missing` | `default`, `null` | Handle missing columns |
| `resolution` | `merge-duplicates`, `ignore-duplicates` | Upsert behavior |
| `tx` | `commit`, `rollback` | Transaction behavior |
| `max-affected` | number | Limit affected rows |

**Strict handling:**

```bash
# Strict mode - error on invalid preferences
curl "http://localhost:3000/users" \
  -H "Prefer: handling=strict, invalid-option=xyz"
# Error: invalid preference

# Lenient mode (default) - ignore invalid preferences
curl "http://localhost:3000/users" \
  -H "Prefer: handling=lenient, invalid-option=xyz"
# Ignores unknown preference, continues
```

**Response includes applied preferences:**

```
HTTP/1.1 200 OK
Preference-Applied: return=representation, count=exact
```

Reference: [PostgREST Preferences](https://postgrest.org/en/stable/references/api/preferences.html)
