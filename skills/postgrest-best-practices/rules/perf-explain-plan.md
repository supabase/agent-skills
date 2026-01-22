---
title: Debug Queries with EXPLAIN Plan Header
impact: LOW-MEDIUM
impactDescription: See PostgreSQL query plan to diagnose slow queries
tags: explain, debug, performance, query-plan
---

## Debug Queries with EXPLAIN Plan Header

Use the `Accept: application/vnd.pgrst.plan` header to see the PostgreSQL EXPLAIN output for any query. Essential for debugging slow queries.

**Incorrect (guessing why query is slow):**

```bash
# Slow query, don't know why
curl "http://localhost:3000/orders?status=eq.pending&select=*,customer:customers(*)"
# Takes 5 seconds... but why?
```

**Correct (get explain plan):**

```bash
# Get execution plan as JSON
curl "http://localhost:3000/orders?status=eq.pending&select=*,customer:customers(*)" \
  -H "Accept: application/vnd.pgrst.plan+json"

# Get as text (easier to read)
curl "http://localhost:3000/orders?status=eq.pending&select=*,customer:customers(*)" \
  -H "Accept: application/vnd.pgrst.plan+text"
```

**Example output:**

```
Nested Loop Left Join  (cost=0.29..16.34 rows=1 width=136)
  ->  Index Scan using orders_status_idx on orders  (cost=0.15..8.17 rows=1 width=68)
        Index Cond: (status = 'pending'::text)
  ->  Index Scan using customers_pkey on customers  (cost=0.14..8.16 rows=1 width=68)
        Index Cond: (id = orders.customer_id)
```

**What to look for:**

| Plan element | Good | Bad |
|--------------|------|-----|
| `Index Scan` | Using index | - |
| `Seq Scan` | Small table | Large table (missing index) |
| `Nested Loop` | Small outer | Large outer (many iterations) |
| `Hash Join` | Large tables | - |
| `Sort` | Small dataset | Large without index |

**Common issues and solutions:**

```bash
# Issue: Seq Scan on large table
# "Seq Scan on orders (cost=0.00..15000.00 rows=100000)"
# Solution: Add index
CREATE INDEX orders_status_idx ON orders (status);

# Issue: Sort on large result
# "Sort (cost=50000.00..55000.00 rows=100000)"
# Solution: Add index for ORDER BY column
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);

# Issue: Slow join
# "Nested Loop (cost=0.00..999999.00)"
# Solution: Index the foreign key
CREATE INDEX orders_customer_id_idx ON orders (customer_id);
```

**Plan options:**

```bash
# Analyze - includes actual timing (slower, runs query)
curl "http://localhost:3000/orders?status=eq.pending" \
  -H "Accept: application/vnd.pgrst.plan+json; options=analyze"

# Verbose - more details
curl "http://localhost:3000/orders?status=eq.pending" \
  -H "Accept: application/vnd.pgrst.plan+json; options=verbose"

# Both
curl "http://localhost:3000/orders?status=eq.pending" \
  -H "Accept: application/vnd.pgrst.plan+json; options=analyze|verbose"
```

**Note:** Requires proper configuration to allow plan output. In Supabase, this is available in the dashboard or via direct database access.

Reference: [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
