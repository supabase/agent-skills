---
title: Use Computed Columns for Derived Values
impact: MEDIUM
impactDescription: Return calculated values without client-side computation
tags: computed, generated, functions, derived, select
---

## Use Computed Columns for Derived Values

PostgreSQL computed columns (generated columns or function-based) can be selected like regular columns, moving computation to the database.

**Incorrect (computing values client-side):**

```bash
# Fetch raw data and compute full_name client-side
curl "http://localhost:3000/users?select=id,first_name,last_name"
# Client: fullName = first_name + ' ' + last_name
```

**Correct (use database computed column):**

```sql
-- Option 1: Generated column (stored)
ALTER TABLE users ADD COLUMN full_name TEXT
  GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

-- Option 2: Function-based computed column
CREATE FUNCTION users_full_name(users) RETURNS TEXT AS $$
  SELECT $1.first_name || ' ' || $1.last_name
$$ LANGUAGE SQL STABLE;
```

```bash
# Select computed column directly
curl "http://localhost:3000/users?select=id,full_name"

# Function-based computed column (same syntax)
curl "http://localhost:3000/users?select=id,full_name"
```

**supabase-js:**

```typescript
// Select computed column
const { data } = await supabase
  .from('users')
  .select('id, full_name')

// Works the same as regular columns
```

**Creating function-based computed columns:**

```sql
-- Computed column for age from birth_date
CREATE FUNCTION users_age(users) RETURNS INTEGER AS $$
  SELECT EXTRACT(YEAR FROM age($1.birth_date))::INTEGER
$$ LANGUAGE SQL STABLE;

-- Computed column for order total
CREATE FUNCTION orders_item_count(orders) RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM order_items WHERE order_id = $1.id
$$ LANGUAGE SQL STABLE;
```

```bash
# Use in select
curl "http://localhost:3000/users?select=id,name,age"
curl "http://localhost:3000/orders?select=id,total,item_count"
```

**Filtering on computed columns:**

```bash
# Filter by computed value
curl "http://localhost:3000/users?select=id,name,age&age=gte.18"
```

**Ordering by computed columns:**

```bash
curl "http://localhost:3000/users?select=*&order=full_name"
```

**Requirements for function-based computed columns:**
1. Function takes the table row type as first unnamed parameter
2. Function must be `STABLE` or `IMMUTABLE`
3. Function must be in the exposed schema
4. User must have EXECUTE permission

**Generated vs Function-based:**

| Type | Storage | Performance | Flexibility |
|------|---------|-------------|-------------|
| Generated (STORED) | Yes | Fast (pre-computed) | Limited to deterministic |
| Function-based | No | Computed per query | Can use other tables |

Reference: [PostgREST Computed Columns](https://postgrest.org/en/stable/references/api/computed_fields.html)
