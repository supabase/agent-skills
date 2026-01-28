---
title: Use the IN Operator for Multiple Values
impact: HIGH
impactDescription: Single filter instead of multiple OR conditions
tags: in, list, multiple-values, filtering
---

## Use the IN Operator for Multiple Values

Use `in.(val1,val2,val3)` to filter by a list of values instead of chaining multiple OR conditions.

**Incorrect (multiple separate requests or complex OR):**

```bash
# Making separate requests for each status - inefficient
curl "http://localhost:3000/orders?status=eq.pending"
curl "http://localhost:3000/orders?status=eq.processing"
curl "http://localhost:3000/orders?status=eq.shipped"

# Or using verbose OR syntax
curl "http://localhost:3000/orders?or=(status.eq.pending,status.eq.processing,status.eq.shipped)"
```

**Correct (single IN operator):**

```bash
# Single request with IN operator
curl "http://localhost:3000/orders?status=in.(pending,processing,shipped)"

# Works with numbers too
curl "http://localhost:3000/products?category_id=in.(1,2,3,4)"

# Works with UUIDs
curl "http://localhost:3000/users?id=in.(a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11,b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22)"
```

**supabase-js:**

```typescript
// IN with array of values
const { data } = await supabase
  .from('orders')
  .select('*')
  .in('status', ['pending', 'processing', 'shipped'])

// IN with numbers
const { data } = await supabase
  .from('products')
  .select('*')
  .in('category_id', [1, 2, 3, 4])
```

**Handling values with special characters:**

```bash
# Values containing commas must be double-quoted
curl 'http://localhost:3000/products?name=in.("Item, Large","Item, Small")'

# Values with parentheses need quoting
curl 'http://localhost:3000/products?name=in.("Widget (A)","Widget (B)")'
```

**Negating IN:**

```bash
# NOT IN - exclude these values
curl "http://localhost:3000/orders?status=not.in.(cancelled,refunded)"
```

```typescript
// supabase-js NOT IN
const { data } = await supabase
  .from('orders')
  .select('*')
  .not('status', 'in', '(cancelled,refunded)')
```

Reference: [PostgREST Operators](https://postgrest.org/en/stable/references/api/tables_views.html#operators)
