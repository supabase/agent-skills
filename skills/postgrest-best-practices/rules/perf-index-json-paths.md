---
title: Create Expression Indexes for JSONB Paths
impact: LOW-MEDIUM
impactDescription: Index specific JSON paths used in filters
tags: index, jsonb, expression, json-path, performance
---

## Create Expression Indexes for JSONB Paths

Create expression indexes on JSONB paths that are frequently filtered. Generic GIN indexes help containment queries, but expression indexes help equality filters.

**Incorrect (filtering on unindexed JSON paths):**

```bash
# Filtering on JSON field without expression index - slow
curl "http://localhost:3000/products?metadata->>color=eq.red"
# Full table scan, extracts color from every row
```

**Correct (expression index on JSON path):**

```sql
-- Expression index for specific JSON path
CREATE INDEX products_color_idx ON products ((metadata->>'color'));

-- For nested paths
CREATE INDEX products_width_idx ON products ((metadata->'dimensions'->>'width'));

-- For numeric JSON values (cast in index)
CREATE INDEX products_weight_idx ON products (((metadata->>'weight')::numeric));
```

```bash
# Now these queries use indexes
curl "http://localhost:3000/products?metadata->>color=eq.red"
# Index scan on products_color_idx
```

**GIN index for containment queries:**

```sql
-- GIN index for @> containment operator (cs)
CREATE INDEX products_metadata_gin_idx ON products USING GIN (metadata);
```

```bash
# Containment queries use GIN index
curl 'http://localhost:3000/products?metadata=cs.{"color":"red"}'
# GIN index scan
```

**When to use which:**

| Query type | Index type | Example |
|------------|------------|---------|
| `metadata->>field=eq.value` | Expression B-tree | `CREATE INDEX ... ((col->>'field'))` |
| `metadata=cs.{"key":"val"}` | GIN | `CREATE INDEX ... USING GIN (col)` |
| `metadata->field=gt.10` | Expression B-tree (with cast) | `CREATE INDEX ... (((col->>'field')::int))` |

**Multiple JSON paths:**

```sql
-- If filtering on multiple paths together
-- curl ".../products?metadata->>brand=eq.Apple&metadata->>color=eq.silver"
CREATE INDEX products_brand_color_idx ON products (
  (metadata->>'brand'),
  (metadata->>'color')
);

-- Or separate indexes if filtered independently
CREATE INDEX products_brand_idx ON products ((metadata->>'brand'));
CREATE INDEX products_color_idx ON products ((metadata->>'color'));
```

**Index on nested path:**

```sql
-- For deeply nested: metadata.specs.display.size
CREATE INDEX products_display_size_idx ON products (
  (metadata->'specs'->'display'->>'size')
);
```

```bash
curl "http://localhost:3000/products?metadata->specs->display->>size=eq.15"
# Uses expression index
```

**Partial indexes for common values:**

```sql
-- Index only active products
CREATE INDEX products_active_color_idx ON products ((metadata->>'color'))
  WHERE status = 'active';
```

Reference: [PostgreSQL Expression Indexes](https://www.postgresql.org/docs/current/indexes-expressional.html)
