---
title: Using TypeScript Types
impact: HIGH
impactDescription: Provides type-safe access to tables, enums, and complex query results
tags: typescript, Tables, Enums, QueryData, type-helpers
---

## Using TypeScript Types

Use helper types for cleaner code instead of verbose type paths.

**Incorrect:**

```typescript
// Verbose path - hard to read and maintain
type User = Database['public']['Tables']['users']['Row']
type NewUser = Database['public']['Tables']['users']['Insert']
```

**Correct:**

```typescript
// Helper types - clean and concise
import { Tables, TablesInsert } from './database.types'

type User = Tables<'users'>
type NewUser = TablesInsert<'users'>
```

## Tables and Enums Helpers

```typescript
import { Tables, Enums } from './database.types'

// Get row type for a table
type User = Tables<'users'>
// { id: number; name: string; created_at: string }

// Get enum values
type Status = Enums<'status'>
// 'active' | 'inactive'

// Instead of verbose path
type UserVerbose = Database['public']['Tables']['users']['Row']
```

## Insert and Update Types

```typescript
import { TablesInsert, TablesUpdate } from './database.types'

type NewUser = TablesInsert<'users'>
// { id?: number; name: string; created_at?: string }

type UserUpdate = TablesUpdate<'users'>
// { id?: number; name?: string; created_at?: string }

// Use in functions
async function createUser(user: TablesInsert<'users'>) {
  return supabase.from('users').insert(user).select().single()
}
```

## QueryData for Complex Queries

Infer types from query definitions, especially for joins:

```typescript
import { QueryData } from '@supabase/supabase-js'

// Define query
const postsWithAuthorQuery = supabase.from('posts').select(`
  id,
  title,
  author:users (
    id,
    name
  )
`)

// Infer type from query (QueryData returns the array type)
type PostsWithAuthor = QueryData<typeof postsWithAuthorQuery>
// { id: number; title: string; author: { id: number; name: string } | null }[]

// Use the type
const { data } = await postsWithAuthorQuery
const posts: PostsWithAuthor = data ?? []
```

## Type Overrides

Override inferred types. Use `Array<>` for array responses, bare type after `.maybeSingle()`:

```typescript
// Partial override (merges with existing types)
const { data } = await supabase
  .from('users')
  .select()
  .overrideTypes<Array<{ status: 'active' | 'inactive' }>>()

// Complete override (replaces types entirely)
const { data } = await supabase
  .from('users')
  .select('id, metadata')
  .overrideTypes<Array<{ id: number; metadata: CustomMetadataType }>, { merge: false }>()

// Single row override (no Array<> needed)
const { data } = await supabase
  .from('users')
  .select('id, metadata')
  .maybeSingle()
  .overrideTypes<{ id: number; metadata: CustomMetadataType }>()
```

## Function Parameters

Type RPC function parameters:

```typescript
type FunctionArgs = Database['public']['Functions']['my_function']['Args']
type FunctionReturn = Database['public']['Functions']['my_function']['Returns']

const { data } = await supabase.rpc('my_function', {
  arg1: 'value',
} satisfies FunctionArgs)
```

## Related

- [ts-generation.md](ts-generation.md)
- [query-joins.md](query-joins.md)
