---
title: Bulk Insert with JSON Arrays
impact: HIGH
impactDescription: Insert multiple rows in single request for better performance
tags: bulk, batch, insert, array, mutation
---

## Bulk Insert with JSON Arrays

POST a JSON array to insert multiple rows in a single request. More efficient than multiple individual inserts.

**Incorrect (multiple individual inserts):**

```bash
# N requests for N records - slow!
curl "http://localhost:3000/products" -X POST -H "Content-Type: application/json" -d '{"name": "A"}'
curl "http://localhost:3000/products" -X POST -H "Content-Type: application/json" -d '{"name": "B"}'
curl "http://localhost:3000/products" -X POST -H "Content-Type: application/json" -d '{"name": "C"}'
# 3 HTTP requests, 3 transactions
```

**Correct (single bulk insert):**

```bash
# Single request for all records
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {"name": "Product A", "price": 10.99},
    {"name": "Product B", "price": 20.99},
    {"name": "Product C", "price": 30.99}
  ]'
# 1 HTTP request, 1 transaction, 3 rows inserted
```

**supabase-js:**

```typescript
// Bulk insert with array
const { data, error } = await supabase
  .from('products')
  .insert([
    { name: 'Product A', price: 10.99 },
    { name: 'Product B', price: 20.99 },
    { name: 'Product C', price: 30.99 }
  ])
  .select()

// Returns all inserted rows
```

**Handling partial data (different columns per row):**

```bash
# Each object can have different columns
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {"name": "A", "price": 10},
    {"name": "B", "description": "New product"},
    {"name": "C", "price": 30, "category_id": 5}
  ]'
# Missing columns use database defaults or NULL
```

**Use `missing=default` for explicit defaults:**

```bash
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation, missing=default" \
  -d '[{"name": "A"}, {"name": "B"}]'
# Uses column DEFAULT values instead of NULL
```

**Performance benefits:**
- Single HTTP round-trip
- Single database transaction
- PostgreSQL batches the INSERT
- Typically 10-100x faster for many rows

**Limits:**
- Request body size (check server config)
- Transaction timeout
- Memory for large batches

**Recommendation:**
- For 100s-1000s of rows: single bulk insert
- For 10000+ rows: batch into chunks of 1000

Reference: [PostgREST Bulk Insert](https://postgrest.org/en/stable/references/api/tables_views.html#bulk-insert)
