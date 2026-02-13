---
title: RPC - Calling Postgres Functions
impact: MEDIUM
impactDescription: Enables complex server-side logic via Postgres functions
tags: rpc, postgres-functions, stored-procedures, plpgsql
---

## RPC - Calling Postgres Functions

Call Postgres functions using `rpc()`. Useful for complex queries, transactions, or business logic.

**Incorrect:**

```typescript
// Ignoring error - data might be null
const { data } = await supabase.rpc('calculate_total', { order_id: 123 })
console.log(data.total)  // Crashes if RPC failed!
```

**Correct:**

```typescript
// Always check error before using data
const { data, error } = await supabase.rpc('calculate_total', { order_id: 123 })
if (error) {
  console.error('RPC failed:', error.message)
  return
}
console.log(data.total)
```

## Basic Call

```typescript
// Function: create function hello_world() returns text
const { data, error } = await supabase.rpc('hello_world')
// data: "Hello, World!"
```

## With Arguments

```typescript
// Function: create function add_numbers(a int, b int) returns int
const { data, error } = await supabase.rpc('add_numbers', { a: 5, b: 3 })
// data: 8
```

## Function Returning Table

```typescript
// Function: create function get_active_users() returns setof users
const { data, error } = await supabase.rpc('get_active_users')
// data: [{ id: 1, name: 'Alice' }, ...]

// With filters (applied to returned rows)
const { data, error } = await supabase
  .rpc('get_active_users')
  .eq('role', 'admin')
  .limit(10)
```

## Read-Only Functions (GET Request)

For functions that don't modify data, use GET for better caching:

```typescript
const { data, error } = await supabase.rpc('get_stats', undefined, { get: true })
```

## Array Arguments

```typescript
// Function: create function sum_array(numbers int[]) returns int
const { data, error } = await supabase.rpc('sum_array', {
  numbers: [1, 2, 3, 4, 5]
})
// data: 15
```

## Example: Full-Text Search

```typescript
// Function in Postgres
/*
create function search_posts(search_term text)
returns setof posts as $$
  select * from posts
  where to_tsvector('english', title || ' ' || content)
    @@ plainto_tsquery('english', search_term)
$$ language sql;
*/

const { data, error } = await supabase
  .rpc('search_posts', { search_term: 'supabase tutorial' })
  .limit(20)
```

## Error Handling

```typescript
const { data, error } = await supabase.rpc('risky_operation', { id: 123 })

if (error) {
  // error.code    - error code (Postgres or PostgREST-specific, e.g. '42501')
  // error.message - human-readable description
  // error.details - additional context (can be null)
  // error.hint    - suggested fix (can be null)
  console.error('RPC failed:', error.message)
  return
}

// Safe to use data
```

## Related

- [query-crud.md](query-crud.md)
- [error-handling.md](error-handling.md)
