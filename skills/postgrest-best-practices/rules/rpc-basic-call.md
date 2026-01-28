---
title: Call Stored Functions via RPC Endpoint
impact: MEDIUM-HIGH
impactDescription: Execute PostgreSQL functions through REST API
tags: rpc, functions, stored-procedures, call
---

## Call Stored Functions via RPC Endpoint

Call PostgreSQL functions using the `/rpc/function_name` endpoint. Use POST for functions with parameters or side effects, GET for read-only functions.

**Incorrect (trying to call function via table endpoint):**

```bash
# Functions are not accessible as tables
curl "http://localhost:3000/my_function"  # 404 Not Found
curl "http://localhost:3000/rpc?name=my_function"  # Wrong
```

**Correct (use /rpc/ endpoint):**

```bash
# POST with JSON parameters
curl "http://localhost:3000/rpc/add_numbers" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"a": 5, "b": 3}'
# Returns: 8

# GET for read-only functions (STABLE/IMMUTABLE)
curl "http://localhost:3000/rpc/get_current_time"
# Returns: "2024-01-15T10:30:00Z"

# GET with query parameters
curl "http://localhost:3000/rpc/add_numbers?a=5&b=3"
```

**supabase-js:**

```typescript
// Call function with parameters
const { data, error } = await supabase
  .rpc('add_numbers', { a: 5, b: 3 })
// data: 8

// Call without parameters
const { data, error } = await supabase
  .rpc('get_current_time')

// With type safety (if using generated types)
const { data } = await supabase
  .rpc('calculate_total', { order_id: 123 })
```

**Function definition example:**

```sql
CREATE FUNCTION add_numbers(a INTEGER, b INTEGER)
RETURNS INTEGER AS $$
  SELECT a + b;
$$ LANGUAGE SQL IMMUTABLE;

CREATE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE(post_count INTEGER, comment_count INTEGER) AS $$
  SELECT
    (SELECT COUNT(*) FROM posts WHERE author_id = user_id)::INTEGER,
    (SELECT COUNT(*) FROM comments WHERE author_id = user_id)::INTEGER;
$$ LANGUAGE SQL STABLE;
```

**Return types:**

| Function returns | Response format |
|------------------|-----------------|
| Scalar (int, text) | Single value: `8` |
| Single row (record) | Object: `{"id": 1, "name": "..."}` |
| SETOF / TABLE | Array: `[{...}, {...}]` |
| VOID | Empty, 204 status |

**Notes:**
- Function must be in exposed schema
- User needs EXECUTE permission
- Function name is case-sensitive in URL
- Overloaded functions supported (matched by parameter names)

Reference: [PostgREST RPC](https://postgrest.org/en/stable/references/api/functions.html)
