---
title: Pass Complex Parameters as JSON Body
impact: MEDIUM-HIGH
impactDescription: Send objects, arrays, and complex types as function parameters
tags: rpc, json, parameters, body, complex-types
---

## Pass Complex Parameters as JSON Body

Use POST with JSON body to pass complex parameters (objects, arrays, nested structures) to functions. Parameter names in JSON match function argument names.

**Incorrect (complex data in query string):**

```bash
# Arrays and objects are awkward in query strings
curl "http://localhost:3000/rpc/process_items?items=[1,2,3]"  # May not parse correctly
curl "http://localhost:3000/rpc/create_user?data={name:John}"  # JSON in URL is problematic
```

**Correct (JSON body for complex parameters):**

```bash
# Array parameter
curl "http://localhost:3000/rpc/sum_array" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"numbers": [1, 2, 3, 4, 5]}'

# Object parameter (JSONB in function)
curl "http://localhost:3000/rpc/create_user" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"user_data": {"name": "John", "email": "john@example.com", "settings": {"theme": "dark"}}}'

# Multiple parameters
curl "http://localhost:3000/rpc/transfer_funds" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"from_account": 123, "to_account": 456, "amount": 100.00, "metadata": {"note": "Payment"}}'
```

**supabase-js:**

```typescript
// Array parameter
const { data } = await supabase.rpc('sum_array', {
  numbers: [1, 2, 3, 4, 5]
})

// Object parameter
const { data } = await supabase.rpc('create_user', {
  user_data: {
    name: 'John',
    email: 'john@example.com',
    settings: { theme: 'dark' }
  }
})

// Multiple parameters
const { data } = await supabase.rpc('transfer_funds', {
  from_account: 123,
  to_account: 456,
  amount: 100.00,
  metadata: { note: 'Payment' }
})
```

**Function definitions:**

```sql
-- Array parameter
CREATE FUNCTION sum_array(numbers INTEGER[])
RETURNS INTEGER AS $$
  SELECT SUM(n)::INTEGER FROM UNNEST(numbers) AS n;
$$ LANGUAGE SQL IMMUTABLE;

-- JSONB parameter
CREATE FUNCTION create_user(user_data JSONB)
RETURNS users AS $$
  INSERT INTO users (name, email, settings)
  VALUES (
    user_data->>'name',
    user_data->>'email',
    user_data->'settings'
  )
  RETURNING *;
$$ LANGUAGE SQL;

-- Multiple parameters with JSONB
CREATE FUNCTION transfer_funds(
  from_account INTEGER,
  to_account INTEGER,
  amount NUMERIC,
  metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
  -- transfer logic
$$ LANGUAGE SQL;
```

**Nested arrays and objects:**

```bash
curl "http://localhost:3000/rpc/process_order" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 123,
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 2, "quantity": 1}
    ],
    "shipping": {
      "address": "123 Main St",
      "method": "express"
    }
  }'
```

Reference: [PostgREST RPC Parameters](https://postgrest.org/en/stable/references/api/functions.html#calling-functions)
