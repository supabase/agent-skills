---
title: Index Columns Used in PostgREST Filters
impact: LOW-MEDIUM
impactDescription: Speed up filtered queries with proper indexes
tags: index, performance, filter, query-optimization
---

## Index Columns Used in PostgREST Filters

Create indexes on columns frequently used in PostgREST filters. Without indexes, filters cause full table scans.

**Incorrect (no indexes on filtered columns):**

```bash
# Query filters on unindexed column - full table scan
curl "http://localhost:3000/orders?status=eq.pending"
# Scans entire orders table to find pending ones

curl "http://localhost:3000/users?email=eq.john@example.com"
# Sequential scan on large users table
```

**Correct (create indexes on filtered columns):**

```sql
-- Index on frequently filtered columns
CREATE INDEX orders_status_idx ON orders (status);
CREATE INDEX users_email_idx ON users (email);

-- For range queries, B-tree index (default)
CREATE INDEX orders_created_at_idx ON orders (created_at);

-- For array containment queries, GIN index
CREATE INDEX posts_tags_idx ON posts USING GIN (tags);

-- For JSONB containment
CREATE INDEX products_metadata_idx ON products USING GIN (metadata);
```

```bash
# Now these queries use indexes
curl "http://localhost:3000/orders?status=eq.pending"
# Index scan - fast!

curl "http://localhost:3000/posts?tags=cs.{featured}"
# GIN index scan
```

**Common filter patterns and indexes:**

| Filter | SQL equivalent | Index type |
|--------|---------------|------------|
| `eq`, `neq`, `gt`, `lt` | `=`, `<>`, `>`, `<` | B-tree (default) |
| `like 'prefix%'` | `LIKE 'prefix%'` | B-tree |
| `in.(a,b,c)` | `IN (a,b,c)` | B-tree |
| `cs`, `cd` (arrays) | `@>`, `<@` | GIN |
| `cs` (JSONB) | `@>` | GIN |
| `fts` | Full-text search | GIN on tsvector |

**Compound indexes for combined filters:**

```sql
-- For queries that filter on multiple columns together
-- curl ".../orders?status=eq.pending&customer_id=eq.123"
CREATE INDEX orders_customer_status_idx ON orders (customer_id, status);

-- Column order matters - leftmost columns used first
-- Good for: customer_id=eq.X or customer_id=eq.X AND status=eq.Y
-- Not good for: status=eq.Y alone
```

**Check if index is used:**

```bash
# Use the explain plan header
curl "http://localhost:3000/orders?status=eq.pending" \
  -H "Accept: application/vnd.pgrst.plan+json"
# Shows EXPLAIN output - look for "Index Scan"
```

**Index recommendations:**
- Index columns in `WHERE` clauses (filters)
- Index columns in `ORDER BY` clauses
- Index foreign key columns (for joins/embedding)
- Don't over-index - each index slows writes

Reference: [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
