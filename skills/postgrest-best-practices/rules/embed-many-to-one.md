---
title: Embed Many-to-One Relationships (Parent Records)
impact: HIGH
impactDescription: Fetch parent record as nested object via foreign key
tags: many-to-one, m2o, embedding, parent, foreign-key
---

## Embed Many-to-One Relationships (Parent Records)

When a table has a foreign key to another table, you can embed the parent record. The result is a single nested object (not an array).

**Incorrect (separate request for parent):**

```bash
# Get order
curl "http://localhost:3000/orders?id=eq.1"
# Returns: {"id": 1, "customer_id": 42, "total": 99.99}

# Separate request for customer
curl "http://localhost:3000/customers?id=eq.42"
```

**Correct (embed parent via foreign key):**

```bash
# Embed customer in order (many-to-one: many orders -> one customer)
curl "http://localhost:3000/orders?select=id,total,customer:customers(id,name,email)&id=eq.1"

# Multiple many-to-one relationships
curl "http://localhost:3000/orders?select=*,customer:customers(name),product:products(name),shipper:shippers(name)"
```

**supabase-js:**

```typescript
// Embed parent record
const { data } = await supabase
  .from('orders')
  .select('id, total, customer:customers(id, name, email)')
  .eq('id', 1)
  .single()

// Result shape - customer is an object, not an array
// { id: 1, total: 99.99, customer: { id: 42, name: "John", email: "john@example.com" } }
```

**Result structure (M2O returns object):**

```json
{
  "id": 1,
  "total": 99.99,
  "customer": {
    "id": 42,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Schema pattern:**
```sql
-- orders.customer_id references customers.id (many-to-one)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),  -- FK creates the relationship
  total DECIMAL
);
```

**Key behavior:**
- Many-to-one embedding returns a **single object** (or null if no match)
- The FK is on the "many" side (orders has customer_id)
- Alias is optional: `customers(*)` or `customer:customers(*)`
- If parent doesn't exist, the embedded field is `null`

Reference: [PostgREST Resource Embedding](https://postgrest.org/en/stable/references/api/resource_embedding.html)
