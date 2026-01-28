---
title: Use GET for Read-Only Functions, POST for Others
impact: MEDIUM-HIGH
impactDescription: Proper HTTP method based on function volatility
tags: rpc, get, post, volatility, immutable, stable
---

## Use GET for Read-Only Functions, POST for Others

PostgREST allows GET requests only for STABLE or IMMUTABLE functions. VOLATILE functions require POST. Match HTTP semantics to function behavior.

**Incorrect (GET for volatile function):**

```bash
# VOLATILE function cannot use GET
curl "http://localhost:3000/rpc/create_order?product_id=1"
# Error: function is not STABLE or IMMUTABLE

# POST required for functions with side effects
```

**Correct (match method to volatility):**

```bash
# IMMUTABLE/STABLE functions - GET allowed
curl "http://localhost:3000/rpc/calculate_tax?amount=100"
curl "http://localhost:3000/rpc/get_user_profile?user_id=123"

# VOLATILE functions - POST required
curl "http://localhost:3000/rpc/create_order" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}'

curl "http://localhost:3000/rpc/send_notification" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123, "message": "Hello"}'
```

**supabase-js:**

```typescript
// supabase-js uses POST by default, but can use GET
// POST (default)
const { data } = await supabase.rpc('create_order', {
  product_id: 1,
  quantity: 2
})

// GET for read-only (use head: true or direct fetch)
// supabase-js always uses POST internally
```

**Function volatility:**

```sql
-- IMMUTABLE: Same inputs always return same output, no side effects
CREATE FUNCTION calculate_tax(amount NUMERIC)
RETURNS NUMERIC AS $$
  SELECT amount * 0.1;
$$ LANGUAGE SQL IMMUTABLE;

-- STABLE: May return different results for same input (reads DB), no side effects
CREATE FUNCTION get_user_profile(user_id UUID)
RETURNS users AS $$
  SELECT * FROM users WHERE id = user_id;
$$ LANGUAGE SQL STABLE;

-- VOLATILE (default): May have side effects, may return different results
CREATE FUNCTION create_order(product_id INT, quantity INT)
RETURNS orders AS $$
  INSERT INTO orders (product_id, quantity)
  VALUES (product_id, quantity)
  RETURNING *;
$$ LANGUAGE SQL VOLATILE;
```

**Volatility reference:**

| Volatility | GET allowed | Side effects | Examples |
|------------|-------------|--------------|----------|
| IMMUTABLE | Yes | No | Math, string manipulation |
| STABLE | Yes | No | Read-only queries |
| VOLATILE | No (POST only) | Yes | INSERT, UPDATE, DELETE |

**Benefits of correct volatility:**
- GET requests are cacheable
- IMMUTABLE/STABLE can be inlined by Postgres
- Proper HTTP semantics for clients
- Safe to retry GET requests

Reference: [PostgREST Function Volatility](https://postgrest.org/en/stable/references/api/functions.html#function-volatility)
