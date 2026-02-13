---
title: Filters and Modifiers
impact: HIGH
impactDescription: Enables precise data retrieval with proper filter ordering
tags: filters, eq, neq, in, like, order, limit, range, modifiers
---

## Filters and Modifiers

Filters narrow results. Modifiers shape output.

**Incorrect:**

```typescript
// Missing await - query never executes
const { data } = supabase.from('users')
  .select('id, name')
  .eq('status', 'active')
console.log(data)  // undefined!
```

**Correct:**

```typescript
// Always await the query
const { data } = await supabase.from('users')
  .select('id, name')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10)
```

## Comparison Filters

```typescript
.eq('column', value)      // Equal
.neq('column', value)     // Not equal
.gt('column', value)      // Greater than
.gte('column', value)     // Greater than or equal
.lt('column', value)      // Less than
.lte('column', value)     // Less than or equal
```

## Special Filters

```typescript
// In array
.in('status', ['active', 'pending'])

// Is null / is not null
.is('deleted_at', null)
.not('deleted_at', 'is', null)

// Pattern matching
.like('name', '%john%')      // Case sensitive
.ilike('name', '%john%')     // Case insensitive

// Array contains
.contains('tags', ['urgent', 'bug'])

// Text search
.textSearch('content', 'hello world', { type: 'websearch' })
```

## Boolean Logic

```typescript
// OR conditions
.or('status.eq.active,status.eq.pending')

// Complex: OR with AND
.or('role.eq.admin,and(role.eq.user,verified.eq.true)')
```

## Conditional Filters

Build queries dynamically:

```typescript
let query = supabase.from('products').select('*')

if (category) {
  query = query.eq('category', category)
}
if (minPrice) {
  query = query.gte('price', minPrice)
}
if (maxPrice) {
  query = query.lte('price', maxPrice)
}

const { data, error } = await query
```

## Modifiers

```typescript
// Sorting
.order('created_at', { ascending: false })
.order('name')  // Ascending by default

// Pagination
.limit(10)
.range(0, 9)  // First 10 rows (0-indexed)

// Single row
.single()      // Error if not exactly 1 row
.maybeSingle() // null if 0 rows, error if >1
```

## JSON Column Filters

```typescript
// -> returns JSONB (use for non-string comparisons)
.eq('address->postcode', 90210)

// ->> returns text (use for string comparisons)
.eq('address->>city', 'London')
```

## Related

- [query-crud.md](query-crud.md)
- [query-joins.md](query-joins.md)
