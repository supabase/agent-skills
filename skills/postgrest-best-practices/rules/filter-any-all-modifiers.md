---
title: Simplify Repeated Conditions with ANY and ALL Modifiers
impact: MEDIUM
impactDescription: Cleaner syntax for multiple OR/AND conditions on same column
tags: any, all, modifiers, filtering, operators
---

## Simplify Repeated Conditions with ANY and ALL Modifiers

Use `(any)` and `(all)` modifiers to apply an operator against multiple values without verbose OR/AND syntax. These work with `eq`, `like`, `ilike`, `gt`, `gte`, `lt`, `lte`, `match`, `imatch`.

**Incorrect (verbose OR syntax):**

```bash
# Multiple OR conditions - verbose and hard to read
curl "http://localhost:3000/users?or=(name.like.A*,name.like.B*,name.like.C*)"

# Multiple conditions on same column
curl "http://localhost:3000/products?or=(price.gt.100,price.gt.200,price.gt.300)"
```

**Correct (use any/all modifiers):**

```bash
# any - matches if ANY value satisfies the condition (OR logic)
curl "http://localhost:3000/users?name=like(any).{A*,B*,C*}"

# Starts with any of these letters
curl "http://localhost:3000/products?name=like(any).{Phone*,Tablet*,Laptop*}"

# Case-insensitive any
curl "http://localhost:3000/users?email=ilike(any).{*@gmail.com,*@yahoo.com}"

# all - matches if ALL values satisfy condition (AND logic)
curl "http://localhost:3000/products?price=gt(all).{10,20}"   # price > 10 AND price > 20

# Equals any value (similar to IN but with any operator)
curl "http://localhost:3000/products?status=eq(any).{active,pending}"
```

**supabase-js:**

```typescript
// Using filter for any modifier
const { data } = await supabase
  .from('users')
  .select('*')
  .filter('name', 'like(any)', '{A%,B%,C%}')

// Using filter for all modifier
const { data } = await supabase
  .from('products')
  .select('*')
  .filter('price', 'gt(all)', '{10,20}')

// Note: For simple OR cases, .in() is cleaner
const { data } = await supabase
  .from('products')
  .select('*')
  .in('status', ['active', 'pending'])
```

**Supported operators with any/all:**

| Operator | Example with any | Example with all |
|----------|-----------------|------------------|
| `eq` | `eq(any).{a,b}` | `eq(all).{a,b}` |
| `like` | `like(any).{A*,B*}` | - |
| `ilike` | `ilike(any).{*test*}` | - |
| `gt` | `gt(any).{10,20}` | `gt(all).{10,20}` |
| `gte` | `gte(any).{5}` | `gte(all).{5}` |
| `lt` | `lt(any).{100}` | `lt(all).{100}` |
| `lte` | `lte(any).{50}` | `lte(all).{50}` |
| `match` | `match(any).{^A,^B}` | - |

**When to use what:**

```bash
# Use in. for simple value lists
curl "http://localhost:3000/products?status=in.(active,pending)"

# Use like(any) for multiple patterns
curl "http://localhost:3000/users?email=like(any).{*@company1.com,*@company2.com}"

# Use gt(all) when value must exceed all thresholds
curl "http://localhost:3000/products?stock=gt(all).{min_threshold,safety_stock}"
```

Reference: [PostgREST Operators](https://postgrest.org/en/stable/references/api/tables_views.html#operators)
