---
title: Combine Filters with AND and OR Operators
impact: CRITICAL
impactDescription: Enables complex filtering logic in single request
tags: and, or, logical, filtering, boolean-logic
---

## Combine Filters with AND and OR Operators

Multiple query parameters are ANDed by default. Use `or=()` for OR logic and `and=()` for explicit grouping. Operators can be nested for complex logic.

**Incorrect (multiple requests instead of logical operators):**

```bash
# Making separate requests for OR conditions - inefficient
curl "http://localhost:3000/users?role=eq.admin"
curl "http://localhost:3000/users?role=eq.moderator"
# Then combining results client-side
```

**Correct (use or/and operators):**

```bash
# Basic OR - users who are admin OR moderator
curl "http://localhost:3000/users?or=(role.eq.admin,role.eq.moderator)"

# Implicit AND - active users in sales department
curl "http://localhost:3000/users?is_active=is.true&department=eq.sales"

# Explicit AND with OR - (active AND admin) OR (active AND moderator)
curl "http://localhost:3000/users?is_active=is.true&or=(role.eq.admin,role.eq.moderator)"

# Nested logic - (A AND B) OR (C AND D)
curl "http://localhost:3000/products?or=(and(category.eq.electronics,price.lt.100),and(category.eq.books,price.lt.20))"

# Complex: active AND (premium OR (verified AND score > 90))
curl "http://localhost:3000/users?is_active=is.true&or=(is_premium.is.true,and(is_verified.is.true,score.gt.90))"
```

**supabase-js:**

```typescript
// Basic OR
const { data } = await supabase
  .from('users')
  .select('*')
  .or('role.eq.admin,role.eq.moderator')

// AND with OR
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('is_active', true)
  .or('role.eq.admin,role.eq.moderator')

// Nested conditions
const { data } = await supabase
  .from('products')
  .select('*')
  .or('and(category.eq.electronics,price.lt.100),and(category.eq.books,price.lt.20)')
```

**Filtering on embedded resources:**

```bash
# Filter parent by child conditions with OR
curl "http://localhost:3000/authors?select=*,books(*)&books.or=(genre.eq.fiction,genre.eq.mystery)"
```

```typescript
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .or('genre.eq.fiction,genre.eq.mystery', { referencedTable: 'books' })
```

**Common patterns:**

```bash
# Date range (between)
curl "http://localhost:3000/events?and=(date.gte.2024-01-01,date.lte.2024-12-31)"

# Multiple status values (prefer in. over or)
curl "http://localhost:3000/orders?status=in.(pending,processing)"  # Better than or

# Exclude multiple values
curl "http://localhost:3000/orders?status=not.in.(cancelled,refunded)"
```

Reference: [PostgREST Logical Operators](https://postgrest.org/en/stable/references/api/tables_views.html#logical-operators)
