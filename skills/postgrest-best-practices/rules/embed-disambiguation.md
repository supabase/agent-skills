---
title: Disambiguate Multiple Foreign Keys with Hint Syntax
impact: HIGH
impactDescription: Resolves ambiguity when multiple FKs exist to same table
tags: disambiguation, hint, foreign-key, multiple-fk, embedding
---

## Disambiguate Multiple Foreign Keys with Hint Syntax

When a table has multiple foreign keys to the same table, PostgREST cannot automatically determine which relationship to use. Use the `!foreign_key_name` hint syntax to specify.

**Incorrect (ambiguous relationship error):**

```bash
# Error: "Could not embed because more than one relationship was found"
curl "http://localhost:3000/orders?select=*,users(*)"
# orders has both billing_user_id and shipping_user_id pointing to users!
```

**Correct (use FK name hint):**

```bash
# Specify which FK to use with !fk_name syntax
curl "http://localhost:3000/orders?select=*,billing_user:users!billing_user_id(*)"
curl "http://localhost:3000/orders?select=*,shipping_user:users!shipping_user_id(*)"

# Both in one query
curl "http://localhost:3000/orders?select=*,billing_user:users!billing_user_id(name,email),shipping_user:users!shipping_user_id(name,address)"

# Using FK constraint name (if named)
curl "http://localhost:3000/orders?select=*,users!orders_billing_user_fkey(*)"
```

**supabase-js:**

```typescript
// Disambiguate with FK hint
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    billing_user:users!billing_user_id(name, email),
    shipping_user:users!shipping_user_id(name, address)
  `)
```

**Result structure:**

```json
{
  "id": 1,
  "total": 99.99,
  "billing_user": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "shipping_user": {
    "name": "Jane Smith",
    "address": "123 Main St"
  }
}
```

**Schema pattern:**
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  billing_user_id INTEGER REFERENCES users(id),   -- First FK to users
  shipping_user_id INTEGER REFERENCES users(id),  -- Second FK to users
  total DECIMAL
);
```

**Finding FK names:**

```sql
-- Query to find foreign key constraint names
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'orders';
```

**Hint syntax options:**

| Syntax | Meaning |
|--------|---------|
| `users!billing_user_id` | Use FK on column `billing_user_id` |
| `users!orders_billing_user_fkey` | Use FK constraint with this name |
| `users!users_pkey` | Use PK on users (for reverse lookups) |

Reference: [PostgREST Disambiguation](https://postgrest.org/en/stable/references/api/resource_embedding.html#disambiguation)
