---
title: Use Query Parameters for Simple GET Requests
impact: MEDIUM
impactDescription: Call read-only functions with simple parameters via URL
tags: rpc, get, query-params, simple
---

## Use Query Parameters for Simple GET Requests

For STABLE/IMMUTABLE functions with simple scalar parameters, use GET with query string parameters. This enables caching and bookmarkable URLs.

**Incorrect (POST for simple read-only calls):**

```bash
# Unnecessary POST for simple lookups
curl "http://localhost:3000/rpc/get_user" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"id": 123}'
# Works but misses caching benefits
```

**Correct (GET with query parameters):**

```bash
# Simple parameters via query string
curl "http://localhost:3000/rpc/get_user?id=123"

# Multiple parameters
curl "http://localhost:3000/rpc/calculate_shipping?weight=5&distance=100&express=true"

# String parameters (URL encoded)
curl "http://localhost:3000/rpc/search_products?query=blue%20widget&category=electronics"

# With response filtering
curl "http://localhost:3000/rpc/get_user_orders?user_id=123&select=id,total&order=created_at.desc"
```

**supabase-js:**

```typescript
// supabase-js uses POST internally, but you can use fetch for GET
const { data } = await supabase.rpc('get_user', { id: 123 })

// For true GET requests, use fetch directly
const response = await fetch(
  `${supabaseUrl}/rest/v1/rpc/get_user?id=123`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
)
```

**Function definition:**

```sql
-- STABLE function - can use GET
CREATE FUNCTION get_user(id INTEGER)
RETURNS users AS $$
  SELECT * FROM users WHERE users.id = get_user.id;
$$ LANGUAGE SQL STABLE;

-- IMMUTABLE function - can use GET
CREATE FUNCTION calculate_shipping(
  weight NUMERIC,
  distance NUMERIC,
  express BOOLEAN DEFAULT FALSE
)
RETURNS NUMERIC AS $$
  SELECT CASE
    WHEN express THEN weight * distance * 0.15
    ELSE weight * distance * 0.10
  END;
$$ LANGUAGE SQL IMMUTABLE;
```

**Parameter type handling:**

| Parameter type | Query string format |
|----------------|---------------------|
| INTEGER | `?id=123` |
| TEXT | `?name=John` (URL encode special chars) |
| BOOLEAN | `?active=true` or `?active=false` |
| UUID | `?id=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` |
| ARRAY | `?ids={1,2,3}` or `?ids=1&ids=2&ids=3` |

**Benefits of GET:**
- Cacheable by CDN/browser
- Bookmarkable URLs
- Simpler for testing
- Proper HTTP semantics

**When to use POST instead:**
- VOLATILE functions
- Complex/nested parameters
- Large parameter values
- Binary data

Reference: [PostgREST RPC GET](https://postgrest.org/en/stable/references/api/functions.html#calling-functions-with-get)
