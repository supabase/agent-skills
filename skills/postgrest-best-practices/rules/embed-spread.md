---
title: Flatten Embedded Objects with Spread Syntax
impact: MEDIUM
impactDescription: Lift embedded columns to parent level for flatter response structure
tags: spread, flatten, embedding, denormalize
---

## Flatten Embedded Objects with Spread Syntax

Use spread syntax `...table(columns)` to lift embedded columns to the parent level, creating a flatter response structure. Works only with to-one relationships.

**Incorrect (nested structure when flat is preferred):**

```bash
# Returns nested object
curl "http://localhost:3000/orders?select=id,total,customer:customers(name,email)"
# Result: { "id": 1, "total": 99, "customer": { "name": "John", "email": "john@ex.com" } }
```

**Correct (spread to flatten):**

```bash
# Spread columns to top level
curl "http://localhost:3000/orders?select=id,total,...customers(name,email)"
# Result: { "id": 1, "total": 99, "name": "John", "email": "john@ex.com" }

# Spread with aliases to avoid conflicts
curl "http://localhost:3000/orders?select=id,total,...customers(customer_name:name,customer_email:email)"
# Result: { "id": 1, "total": 99, "customer_name": "John", "customer_email": "john@ex.com" }

# Multiple spreads
curl "http://localhost:3000/orders?select=id,...customers(customer_name:name),...products(product_name:name)"
```

**supabase-js:**

```typescript
// Spread embedding
const { data } = await supabase
  .from('orders')
  .select('id, total, ...customers(name, email)')

// Result shape is flat:
// { id: 1, total: 99, name: "John", email: "john@ex.com" }

// With aliases
const { data } = await supabase
  .from('orders')
  .select('id, total, ...customers(customer_name:name, customer_email:email)')
```

**Comparison:**

| Without spread | With spread |
|----------------|-------------|
| `{ "id": 1, "customer": { "name": "John" } }` | `{ "id": 1, "name": "John" }` |

**Limitations:**
- Only works with **to-one** relationships (M2O, O2O)
- Cannot spread to-many relationships (would create multiple rows)
- Column name conflicts must be resolved with aliases

**Combining spread and nested:**

```bash
# Spread customer, keep items nested
curl "http://localhost:3000/orders?select=id,...customers(customer_name:name),items(product_name,quantity)"
```

```json
{
  "id": 1,
  "customer_name": "John",
  "items": [
    { "product_name": "Widget", "quantity": 2 },
    { "product_name": "Gadget", "quantity": 1 }
  ]
}
```

**Use cases:**
- Simplify response for UI consumption
- Match expected API contract
- Reduce nesting depth
- Create denormalized views without actual views

Reference: [PostgREST Spread Embedding](https://postgrest.org/en/stable/references/api/resource_embedding.html#spread-embedded-resource)
