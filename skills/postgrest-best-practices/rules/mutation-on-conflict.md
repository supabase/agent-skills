---
title: Specify Conflict Columns for Non-PK Upserts
impact: HIGH
impactDescription: Upsert based on unique constraints other than primary key
tags: on_conflict, upsert, unique, constraint, mutation
---

## Specify Conflict Columns for Non-PK Upserts

Use the `on_conflict` query parameter to specify which unique constraint to use for conflict detection when it's not the primary key.

**Incorrect (assuming PK is the conflict target):**

```bash
# Fails if email conflicts but id doesn't
curl "http://localhost:3000/users" \
  -X POST \
  -H "Prefer: resolution=merge-duplicates" \
  -d '{"name": "John", "email": "john@example.com"}'
# Error: duplicate key value violates unique constraint "users_email_key"
```

**Correct (specify on_conflict column):**

```bash
# Upsert based on email unique constraint
curl "http://localhost:3000/users?on_conflict=email" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates, return=representation" \
  -d '{"email": "john@example.com", "name": "John Updated"}'

# Composite unique constraint
curl "http://localhost:3000/inventory?on_conflict=product_id,location_id" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '{"product_id": 1, "location_id": 5, "quantity": 100}'

# Upsert by SKU (not id)
curl "http://localhost:3000/products?on_conflict=sku" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '{"sku": "WIDGET-001", "name": "Widget", "price": 29.99}'
```

**supabase-js:**

```typescript
// Upsert by email
const { data, error } = await supabase
  .from('users')
  .upsert(
    { email: 'john@example.com', name: 'John Updated' },
    { onConflict: 'email' }
  )
  .select()

// Composite key
const { data, error } = await supabase
  .from('inventory')
  .upsert(
    { product_id: 1, location_id: 5, quantity: 100 },
    { onConflict: 'product_id,location_id' }
  )
  .select()

// Bulk with on_conflict
const { data, error } = await supabase
  .from('products')
  .upsert(
    [
      { sku: 'A001', name: 'Widget', price: 10.99 },
      { sku: 'A002', name: 'Gadget', price: 20.99 }
    ],
    { onConflict: 'sku' }
  )
  .select()
```

**Schema requirements:**

```sql
-- Single column unique
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,  -- Can use on_conflict=email
  name TEXT
);

-- Composite unique
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INT,
  location_id INT,
  quantity INT,
  UNIQUE(product_id, location_id)  -- Can use on_conflict=product_id,location_id
);
```

**Notes:**
- Column(s) must have UNIQUE constraint or be PRIMARY KEY
- All conflict columns must be provided in the payload
- Column order in `on_conflict` doesn't matter
- Without `on_conflict`, defaults to primary key

**Common patterns:**

```bash
# Email-based user upsert
on_conflict=email

# Slug-based content upsert
on_conflict=slug

# External ID sync
on_conflict=external_id

# Composite business key
on_conflict=tenant_id,entity_id
```

Reference: [PostgREST On Conflict](https://postgrest.org/en/stable/references/api/tables_views.html#on-conflict)
