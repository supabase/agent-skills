---
title: Use Views for Complex Queries
impact: LOW-MEDIUM
impactDescription: Encapsulate complex logic that exceeds PostgREST's query grammar
tags: views, complex, performance, encapsulation
---

## Use Views for Complex Queries

Create PostgreSQL views to expose complex queries that go beyond PostgREST's URL-based query capabilities. Views appear as tables and support all PostgREST features.

**Incorrect (complex client-side data assembly):**

```javascript
// Multiple requests + client-side processing
const orders = await fetch('/orders?status=eq.completed')
const items = await fetch('/order_items?order_id=in.(1,2,3)')
const products = await fetch('/products?id=in.(10,20,30)')

// Client combines and calculates totals
const result = orders.map(o => ({
  ...o,
  items: items.filter(i => i.order_id === o.id),
  total: items.filter(i => i.order_id === o.id).reduce(...)
}))
```

**Correct (create a view):**

```sql
-- View with aggregations and joins
CREATE VIEW order_summaries AS
SELECT
  o.id,
  o.created_at,
  o.status,
  c.name as customer_name,
  c.email as customer_email,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity * oi.price) as total,
  array_agg(p.name) as product_names
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
GROUP BY o.id, o.created_at, o.status, c.name, c.email;

-- Grant access
GRANT SELECT ON order_summaries TO authenticated;
```

```bash
# Query the view like a table
curl "http://localhost:3000/order_summaries?status=eq.completed&order=created_at.desc"
# Returns pre-aggregated data
```

**supabase-js:**

```typescript
// Query view like any table
const { data } = await supabase
  .from('order_summaries')
  .select('*')
  .eq('status', 'completed')
  .order('created_at', { ascending: false });
```

**Use cases for views:**

1. **Aggregations:**

```sql
CREATE VIEW product_stats AS
SELECT
  p.id,
  p.name,
  COUNT(r.id) as review_count,
  AVG(r.rating)::numeric(3,2) as avg_rating
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id, p.name;
```

2. **Complex joins:**

```sql
CREATE VIEW user_activity AS
SELECT
  u.id,
  u.name,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT c.id) as comment_count,
  MAX(p.created_at) as last_post
FROM users u
LEFT JOIN posts p ON p.author_id = u.id
LEFT JOIN comments c ON c.author_id = u.id
GROUP BY u.id, u.name;
```

3. **Security filtering:**

```sql
CREATE VIEW public_posts AS
SELECT id, title, content, author_id
FROM posts
WHERE is_published = true AND deleted_at IS NULL;
```

**Updatable views:**

```sql
-- Simple views can be updated through
CREATE VIEW active_users AS
SELECT * FROM users WHERE status = 'active';

-- INSERT/UPDATE/DELETE work if view is simple enough
curl "http://localhost:3000/active_users" -X PATCH -d '{"name": "New"}'
```

**With RLS:**

```sql
-- IMPORTANT: By default, views run with OWNER privileges (security definer).
-- RLS on underlying tables will NOT apply unless you use security_invoker.
-- PostgreSQL 15+ supports security_invoker = true:
CREATE VIEW my_orders WITH (security_invoker = true) AS
SELECT * FROM orders;
-- Now RLS policies on 'orders' table will apply to view queries
```

Reference: [PostgreSQL Views](https://www.postgresql.org/docs/current/sql-createview.html)
