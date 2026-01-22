---
title: Select Only Required Columns for Better Performance
impact: HIGH
impactDescription: Reduces data transfer, improves query performance
tags: select, columns, performance, vertical-filtering
---

## Select Only Required Columns for Better Performance

Use the `select` parameter to request only the columns you need instead of `*`. This reduces network transfer and can improve query performance.

**Incorrect (selecting all columns):**

```bash
# Selecting all columns when you only need a few
curl "http://localhost:3000/users"
# Returns all columns including large text fields, timestamps, etc.

curl "http://localhost:3000/users?select=*"
# Explicitly requesting all - same issue
```

**Correct (select specific columns):**

```bash
# Select only needed columns
curl "http://localhost:3000/users?select=id,name,email"

# For list displays, minimal columns
curl "http://localhost:3000/products?select=id,name,price,thumbnail_url"

# When embedding, select specific columns from both
curl "http://localhost:3000/orders?select=id,total,customer:customers(name)"
```

**supabase-js:**

```typescript
// Select specific columns
const { data } = await supabase
  .from('users')
  .select('id, name, email')

// Minimal for list view
const { data } = await supabase
  .from('products')
  .select('id, name, price, thumbnail_url')

// Combined with embedding
const { data } = await supabase
  .from('orders')
  .select('id, total, customer:customers(name)')
```

**Performance impact:**

| Query | Data transferred |
|-------|------------------|
| `select=*` (20 columns) | ~2KB per row |
| `select=id,name,email` | ~100 bytes per row |

For 1000 rows: 2MB vs 100KB - **20x difference**

**When to use `*`:**
- Detail views where you need most columns
- Admin interfaces with full data access
- Prototyping/development
- When column list changes frequently

**When to select specific columns:**
- List/table views
- Mobile apps (bandwidth matters)
- High-traffic endpoints
- Tables with large text/binary columns

**Empty select returns empty objects:**

```bash
# Empty select is valid - returns {} for each row
curl "http://localhost:3000/users?select="
# Useful for existence checks or counting
```

Reference: [PostgREST Vertical Filtering](https://postgrest.org/en/stable/references/api/tables_views.html#vertical-filtering)
