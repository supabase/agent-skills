---
title: Filter and Embed Results from Table Functions
impact: HIGH
impactDescription: Apply PostgREST query features to function results
tags: rpc, setof, table, filtering, embedding
---

## Filter and Embed Results from Table Functions

Functions that return `SETOF` or `TABLE` can be filtered, ordered, and embedded just like regular tables. This enables powerful server-side processing with PostgREST query features.

**Incorrect (fetching all results and filtering client-side):**

```javascript
// Gets all results, filters in JS - wasteful
const allResults = await supabase.rpc('search_products', { query: 'widget' })
const filtered = allResults.filter(p => p.price < 100)
const sorted = filtered.sort((a, b) => b.rating - a.rating)
```

**Correct (filter and order in the request):**

```bash
# Filter function results
curl "http://localhost:3000/rpc/search_products?query=widget&price=lt.100"

# Order function results
curl "http://localhost:3000/rpc/search_products?query=widget&order=rating.desc"

# Pagination on function results
curl "http://localhost:3000/rpc/search_products?query=widget&limit=10&offset=20"

# Select specific columns
curl "http://localhost:3000/rpc/search_products?query=widget&select=id,name,price"

# Embed related resources
curl "http://localhost:3000/rpc/get_user_orders?user_id=123&select=*,items:order_items(product:products(name))"
```

**supabase-js:**

```typescript
// Filter function results
const { data } = await supabase
  .rpc('search_products', { query: 'widget' })
  .lt('price', 100)
  .order('rating', { ascending: false })
  .limit(10)

// Select specific columns
const { data } = await supabase
  .rpc('search_products', { query: 'widget' })
  .select('id, name, price')

// With embedding (if function returns table type with FKs)
const { data } = await supabase
  .rpc('get_user_orders', { user_id: 123 })
  .select('*, items:order_items(product:products(name))')
```

**Function definitions:**

```sql
-- Returns SETOF existing table (inherits relationships)
CREATE FUNCTION search_products(query TEXT)
RETURNS SETOF products AS $$
  SELECT * FROM products
  WHERE name ILIKE '%' || query || '%'
     OR description ILIKE '%' || query || '%';
$$ LANGUAGE SQL STABLE;

-- Returns TABLE (custom columns)
CREATE FUNCTION get_sales_report(start_date DATE, end_date DATE)
RETURNS TABLE(
  product_id INTEGER,
  product_name TEXT,
  total_sold INTEGER,
  revenue NUMERIC
) AS $$
  SELECT
    p.id,
    p.name,
    SUM(oi.quantity)::INTEGER,
    SUM(oi.quantity * oi.price)
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at BETWEEN start_date AND end_date
  GROUP BY p.id, p.name;
$$ LANGUAGE SQL STABLE;
```

**Embedding requirements:**
- Function must return `SETOF table_name` (not custom TABLE)
- The table must have foreign keys
- Relationships are detected from the returned table type

**Complex example:**

```bash
# Sales report with filters, ordering, and pagination
curl "http://localhost:3000/rpc/get_sales_report?start_date=2024-01-01&end_date=2024-12-31&revenue=gt.1000&order=revenue.desc&limit=20"
```

```typescript
const { data } = await supabase
  .rpc('get_sales_report', {
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  })
  .gt('revenue', 1000)
  .order('revenue', { ascending: false })
  .limit(20)
```

Reference: [PostgREST Table Functions](https://postgrest.org/en/stable/references/api/functions.html#table-valued-functions)
