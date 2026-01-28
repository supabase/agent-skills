---
title: Cast Column Types in Response
impact: MEDIUM
impactDescription: Control output format with PostgreSQL type casting
tags: casting, types, select, format
---

## Cast Column Types in Response

Use `::type` syntax to cast columns to different types in the response. Useful for formatting numbers, dates, or converting between types.

**Incorrect (client-side type conversion):**

```bash
# Fetching raw types and converting in client
curl "http://localhost:3000/products?select=id,price"
# Returns: { "price": 29.99 } - might be numeric precision issues
```

**Correct (server-side casting):**

```bash
# Cast to text
curl "http://localhost:3000/products?select=id,price::text"
# Returns: { "id": 1, "price": "29.99" }

# Cast to integer
curl "http://localhost:3000/orders?select=id,total::int"
# Returns: { "id": 1, "total": 100 }

# Date formatting
curl "http://localhost:3000/events?select=id,date::date"
# Returns timestamp as date only

# Multiple casts
curl "http://localhost:3000/products?select=id,price::text,stock::text,active::text"
```

**supabase-js:**

```typescript
// Cast to text
const { data } = await supabase
  .from('products')
  .select('id, price::text')

// Cast to integer
const { data } = await supabase
  .from('orders')
  .select('id, total::int')

// Combined with alias
const { data } = await supabase
  .from('products')
  .select('id, priceStr:price::text')
```

**Common casting scenarios:**

| From | To | Syntax | Use case |
|------|----|--------|----------|
| `numeric` | `text` | `price::text` | Avoid floating point issues |
| `numeric` | `int` | `total::int` | Round to integer |
| `timestamp` | `date` | `created_at::date` | Date only, no time |
| `timestamp` | `text` | `created_at::text` | String format |
| `uuid` | `text` | `id::text` | String representation |
| `jsonb` | `text` | `metadata::text` | JSON as string |

**Casting with JSON extraction:**

```bash
# Cast extracted JSON value
curl "http://localhost:3000/products?select=id,quantity:metadata->>stock::int"
```

**Casting in aggregates:**

```bash
# Cast aggregate result
curl "http://localhost:3000/orders?select=total.sum()::int"
```

**Notes:**
- Invalid casts return PostgreSQL errors
- Casting happens server-side, reducing client processing
- Useful for consistent API contracts regardless of DB precision
- Works with computed columns and aggregates

Reference: [PostgREST Casting](https://postgrest.org/en/stable/references/api/tables_views.html#casting-columns)
