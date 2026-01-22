---
title: Use PostgREST Comparison Operators for Filtering
impact: CRITICAL
impactDescription: Enables precise data filtering, foundation of all queries
tags: operators, filtering, comparison, eq, gt, lt, neq
---

## Use PostgREST Comparison Operators for Filtering

PostgREST uses dot-notation operators for filtering. Use `eq`, `neq`, `gt`, `gte`, `lt`, `lte` instead of SQL symbols.

**Incorrect (SQL-style operators won't work):**

```bash
# These SQL-style operators are NOT supported
curl "http://localhost:3000/products?price > 100"      # Won't work
curl "http://localhost:3000/products?status = active"  # Won't work
curl "http://localhost:3000/products?price >= 50"      # Won't work
```

**Correct (PostgREST dot-notation operators):**

```bash
# Equals
curl "http://localhost:3000/products?status=eq.active"

# Not equals
curl "http://localhost:3000/products?status=neq.deleted"

# Greater than / Greater than or equal
curl "http://localhost:3000/products?price=gt.100"
curl "http://localhost:3000/products?price=gte.100"

# Less than / Less than or equal
curl "http://localhost:3000/products?price=lt.50"
curl "http://localhost:3000/products?price=lte.50"

# Combine multiple filters (implicit AND)
curl "http://localhost:3000/products?price=gte.10&price=lte.100&status=eq.active"
```

**supabase-js:**

```typescript
// Equals
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('status', 'active')

// Greater than
const { data } = await supabase
  .from('products')
  .select('*')
  .gt('price', 100)

// Chained filters (AND)
const { data } = await supabase
  .from('products')
  .select('*')
  .gte('price', 10)
  .lte('price', 100)
  .eq('status', 'active')
```

**Operator Reference:**

| Operator | SQL Equivalent | Example |
|----------|---------------|---------|
| `eq` | `=` | `?status=eq.active` |
| `neq` | `<>` or `!=` | `?status=neq.deleted` |
| `gt` | `>` | `?price=gt.100` |
| `gte` | `>=` | `?price=gte.100` |
| `lt` | `<` | `?price=lt.50` |
| `lte` | `<=` | `?price=lte.50` |

Reference: [PostgREST Operators](https://postgrest.org/en/stable/references/api/tables_views.html#operators)
