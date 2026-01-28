---
title: Upsert with Merge Duplicates
impact: HIGH
impactDescription: Insert or update in single atomic operation
tags: upsert, merge, on-conflict, insert, update, mutation
---

## Upsert with Merge Duplicates

Use `Prefer: resolution=merge-duplicates` to insert rows or update them if they already exist (based on primary key or unique constraint).

**Incorrect (check-then-insert pattern):**

```javascript
// Race condition prone!
const existing = await fetch('/users?email=eq.john@example.com')
if (existing.length === 0) {
  await fetch('/users', { method: 'POST', body: newUser })
} else {
  await fetch('/users?id=eq.' + existing[0].id, { method: 'PATCH', body: updates })
}
// Another request could insert between check and insert!
```

**Correct (atomic upsert):**

```bash
# Upsert - inserts if not exists, updates if exists
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates, return=representation" \
  -d '{"id": 123, "name": "John Doe", "email": "john@example.com"}'

# Upsert based on unique constraint (not PK)
curl "http://localhost:3000/users?on_conflict=email" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates, return=representation" \
  -d '{"email": "john@example.com", "name": "John Updated"}'

# Bulk upsert
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates, return=representation" \
  -d '[
    {"sku": "A001", "name": "Widget", "price": 10.99},
    {"sku": "A002", "name": "Gadget", "price": 20.99}
  ]'
```

**supabase-js:**

```typescript
// Upsert by primary key
const { data, error } = await supabase
  .from('users')
  .upsert({ id: 123, name: 'John Doe', email: 'john@example.com' })
  .select()

// Upsert by unique column
const { data, error } = await supabase
  .from('users')
  .upsert(
    { email: 'john@example.com', name: 'John Updated' },
    { onConflict: 'email' }
  )
  .select()

// Bulk upsert
const { data, error } = await supabase
  .from('products')
  .upsert([
    { sku: 'A001', name: 'Widget', price: 10.99 },
    { sku: 'A002', name: 'Gadget', price: 20.99 }
  ])
  .select()
```

**How it works:**
1. Attempts INSERT
2. On conflict (PK/unique violation), performs UPDATE
3. All in single atomic operation

**Composite unique keys:**

```bash
# on_conflict with multiple columns
curl "http://localhost:3000/inventory?on_conflict=product_id,warehouse_id" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '{"product_id": 1, "warehouse_id": 5, "quantity": 100}'
```

```typescript
const { data, error } = await supabase
  .from('inventory')
  .upsert(
    { product_id: 1, warehouse_id: 5, quantity: 100 },
    { onConflict: 'product_id,warehouse_id' }
  )
```

**Requirements:**
- Primary key or unique constraint must exist
- All conflict columns must be provided
- User needs both INSERT and UPDATE permissions

Reference: [PostgREST Upsert](https://postgrest.org/en/stable/references/api/tables_views.html#upsert)
