---
title: Call Variadic Functions with Arrays or Repeated Parameters
impact: LOW-MEDIUM
impactDescription: Pass variable number of arguments to PostgreSQL variadic functions
tags: rpc, variadic, arrays, multiple-args
---

## Call Variadic Functions with Arrays or Repeated Parameters

Variadic PostgreSQL functions accept variable numbers of arguments. Call them via POST with an array or GET with repeated query parameters.

**Incorrect (passing array as single value):**

```bash
# This might not work as expected
curl "http://localhost:3000/rpc/sum_values?values=1,2,3,4"  # Parsed as string
```

**Correct (proper variadic calling):**

```bash
# POST with array in JSON body
curl "http://localhost:3000/rpc/sum_values" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"values": [1, 2, 3, 4, 5]}'

# GET with repeated parameters
curl "http://localhost:3000/rpc/sum_values?values=1&values=2&values=3&values=4&values=5"

# GET with array syntax
curl "http://localhost:3000/rpc/sum_values?values={1,2,3,4,5}"
```

**supabase-js:**

```typescript
// Pass array for variadic parameter
const { data } = await supabase.rpc('sum_values', {
  values: [1, 2, 3, 4, 5]
})

// Concatenate strings
const { data } = await supabase.rpc('concat_all', {
  strings: ['Hello', ' ', 'World', '!']
})
```

**Function definitions:**

```sql
-- Variadic integer function
CREATE FUNCTION sum_values(VARIADIC values INTEGER[])
RETURNS INTEGER AS $$
  SELECT SUM(v)::INTEGER FROM UNNEST(values) AS v;
$$ LANGUAGE SQL IMMUTABLE;

-- Variadic text function
CREATE FUNCTION concat_all(VARIADIC strings TEXT[])
RETURNS TEXT AS $$
  SELECT string_agg(s, '') FROM UNNEST(strings) AS s;
$$ LANGUAGE SQL IMMUTABLE;

-- Mixed parameters with variadic
CREATE FUNCTION format_list(prefix TEXT, VARIADIC items TEXT[])
RETURNS TEXT AS $$
  SELECT prefix || ': ' || array_to_string(items, ', ');
$$ LANGUAGE SQL IMMUTABLE;
```

**Mixed parameters:**

```bash
# Non-variadic + variadic parameters
curl "http://localhost:3000/rpc/format_list" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"prefix": "Items", "items": ["apple", "banana", "cherry"]}'
# Returns: "Items: apple, banana, cherry"

# GET version
curl "http://localhost:3000/rpc/format_list?prefix=Items&items=apple&items=banana&items=cherry"
```

```typescript
const { data } = await supabase.rpc('format_list', {
  prefix: 'Items',
  items: ['apple', 'banana', 'cherry']
})
```

**Notes:**
- Variadic parameter must be last
- In POST, always pass as array
- In GET, repeat parameter or use `{a,b,c}` syntax
- Empty variadic: `{"values": []}` or omit in GET

**Use cases:**
- Mathematical operations on variable inputs
- String concatenation/formatting
- Bulk operations
- Flexible aggregations

Reference: [PostgREST Variadic Functions](https://postgrest.org/en/stable/references/api/functions.html#variadic-functions)
