---
title: Always Filter UPDATE Requests
impact: HIGH
impactDescription: Prevent accidental full-table updates with mandatory filters
tags: update, patch, filter, safety, mutation
---

## Always Filter UPDATE Requests

Always include filters when using PATCH to update rows. PostgREST will error on unrestricted updates by default, but always filter explicitly for safety.

**Incorrect (no filter - dangerous!):**

```bash
# This could update ALL rows!
curl "http://localhost:3000/users" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
# Error (with default config) or updates entire table!
```

**Correct (always include filters):**

```bash
# Update specific row by ID
curl "http://localhost:3000/users?id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"status": "inactive"}'

# Update multiple rows with filter
curl "http://localhost:3000/orders?status=eq.pending&created_at=lt.2024-01-01" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"status": "cancelled"}'

# Update with complex filter
curl "http://localhost:3000/products?or=(stock.eq.0,discontinued.is.true)" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"visible": false}'
```

**supabase-js:**

```typescript
// Update by ID
const { data, error } = await supabase
  .from('users')
  .update({ status: 'inactive' })
  .eq('id', 123)
  .select()

// Update multiple with filter
const { data, error } = await supabase
  .from('orders')
  .update({ status: 'cancelled' })
  .eq('status', 'pending')
  .lt('created_at', '2024-01-01')
  .select()

// Complex filter
const { data, error } = await supabase
  .from('products')
  .update({ visible: false })
  .or('stock.eq.0,discontinued.is.true')
```

**Return affected rows:**

```bash
# Get updated rows back
curl "http://localhost:3000/users?id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"email": "new@example.com"}'
# Returns: [{"id": 123, "email": "new@example.com", ...}]
```

**Limit affected rows:**

```bash
# Safety limit
curl "http://localhost:3000/orders?status=eq.pending" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation, max-affected=100" \
  -d '{"reviewed": true}'
# Errors if more than 100 rows would be affected
```

**Safety configuration:**
- PostgREST `db-max-rows` limits affected rows
- RLS policies can restrict updates
- `max-affected` header provides request-level limit

Reference: [PostgREST Update](https://postgrest.org/en/stable/references/api/tables_views.html#update)
