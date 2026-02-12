---
title: CRUD Operations
impact: HIGH
impactDescription: Core database operations with proper return handling
tags: select, insert, update, delete, upsert, crud
---

## CRUD Operations

All operations return `{ data, error }`. Always check error before using data.

## Select

```typescript
// All rows
const { data, error } = await supabase.from('users').select()

// Specific columns
const { data, error } = await supabase.from('users').select('id, name, email')

// With count
const { count, error } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
```

## Insert

**Incorrect:**

```typescript
// Insert without returning data
const { error } = await supabase.from('users').insert({ name: 'Alice' })
// No way to get the inserted row's id!
```

**Correct:**

```typescript
// Insert and return the created row
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'Alice' })
  .select()
  .single()

// Bulk insert
const { data, error } = await supabase
  .from('users')
  .insert([
    { name: 'Alice' },
    { name: 'Bob' },
  ])
  .select()
```

## Update

**Incorrect:**

```typescript
// DANGEROUS: Updates ALL rows!
await supabase.from('users').update({ status: 'inactive' })
```

**Correct:**

```typescript
// Always use a filter
const { data, error } = await supabase
  .from('users')
  .update({ status: 'inactive' })
  .eq('id', userId)
  .select()
  .single()
```

## Upsert

Insert or update based on primary key or unique constraint:

```typescript
const { data, error } = await supabase
  .from('users')
  .upsert({ id: 1, name: 'Alice', email: 'alice@example.com' })
  .select()
  .single()

// Upsert on different column
const { data, error } = await supabase
  .from('users')
  .upsert(
    { email: 'alice@example.com', name: 'Alice' },
    { onConflict: 'email' }
  )
  .select()
```

## Delete

```typescript
// Delete with filter
const { error } = await supabase.from('users').delete().eq('id', userId)

// Delete and return deleted row
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId)
  .select()
  .single()
```

## single() vs maybeSingle()

```typescript
// Throws error if 0 or >1 rows
.single()

// Returns null if 0 rows, error only if >1 rows
.maybeSingle()
```

## Related

- [query-filters.md](query-filters.md)
- [error-handling.md](error-handling.md)
