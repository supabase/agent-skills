---
title: Negate Filters with NOT Prefix
impact: HIGH
impactDescription: Enables inverse filtering for any operator
tags: not, negation, filtering, inverse
---

## Negate Filters with NOT Prefix

Prefix any operator with `not.` to negate it. This works with all operators including `eq`, `like`, `in`, `is`, and array operators.

**Incorrect (using wrong negation approach):**

```bash
# Don't use neq when you need to negate complex operators
curl "http://localhost:3000/products?tags=neq.{electronics}"  # Wrong for arrays!

# Double negation is invalid
curl "http://localhost:3000/users?status=not.not.eq.active"  # Error!
```

**Correct (not. prefix works with any operator):**

```bash
# NOT equals (same as neq)
curl "http://localhost:3000/products?status=not.eq.discontinued"

# NOT like - exclude pattern
curl "http://localhost:3000/users?email=not.like.*@spam.com"
curl "http://localhost:3000/users?email=not.ilike.*test*"

# NOT in - exclude from list
curl "http://localhost:3000/orders?status=not.in.(cancelled,refunded)"

# NOT is - for booleans/null
curl "http://localhost:3000/users?deleted_at=not.is.null"
curl "http://localhost:3000/users?is_active=not.is.false"

# NOT contains (array)
curl "http://localhost:3000/posts?tags=not.cs.{spam}"

# NOT full-text search
curl "http://localhost:3000/articles?content=not.fts.prohibited"
```

**supabase-js:**

```typescript
// NOT equals
const { data } = await supabase
  .from('products')
  .select('*')
  .neq('status', 'discontinued')

// NOT like
const { data } = await supabase
  .from('users')
  .select('*')
  .not('email', 'like', '%@spam.com')

// NOT in
const { data } = await supabase
  .from('orders')
  .select('*')
  .not('status', 'in', '(cancelled,refunded)')

// NOT is null
const { data } = await supabase
  .from('users')
  .select('*')
  .not('deleted_at', 'is', null)
```

**Negating logical operators:**

```bash
# NOT (A AND B) = NOT A OR NOT B
curl "http://localhost:3000/products?not.and=(price.gt.100,in_stock.is.true)"

# NOT (A OR B) = NOT A AND NOT B
curl "http://localhost:3000/products?not.or=(status.eq.sold,status.eq.reserved)"
```

Reference: [PostgREST Operators](https://postgrest.org/en/stable/references/api/tables_views.html#operators)
