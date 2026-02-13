---
title: Joins and Relations
impact: HIGH
impactDescription: Enables efficient data fetching with related tables in a single query
tags: joins, relations, foreign-tables, nested-select, inner-join
---

## Joins and Relations

Foreign key relationships are automatically detected. Fetch related data in one query.

**Incorrect:**

```typescript
// N+1 query pattern - separate query for each post's comments
const { data: posts } = await supabase.from('posts').select('id, title')
for (const post of posts) {
  const { data: comments } = await supabase
    .from('comments')
    .select()
    .eq('post_id', post.id)
}
```

**Correct:**

```typescript
// Single query with join - fetches all data at once
const { data: posts } = await supabase.from('posts').select(`
  id,
  title,
  comments (id, content, created_at)
`)
```

## Basic Join (One-to-Many)

```typescript
// Fetch posts with their comments
const { data, error } = await supabase.from('posts').select(`
  id,
  title,
  comments (
    id,
    content,
    created_at
  )
`)
// Returns: { id, title, comments: [...] }[]
```

## Many-to-One

```typescript
// Fetch comments with their post
const { data, error } = await supabase.from('comments').select(`
  id,
  content,
  post:posts (
    id,
    title
  )
`)
// Returns: { id, content, post: { id, title } }[]
```

## Inner Join

Only return rows with matching related data:

```typescript
const { data, error } = await supabase.from('posts')
  .select(`
    id,
    title,
    comments!inner (
      id,
      content
    )
  `)
  .eq('comments.approved', true)
// Only posts that have approved comments
```

## Multiple Relationships (Aliases)

When a table has multiple FKs to the same table, disambiguate using the column name or constraint name:

```typescript
// Option 1: Column-based disambiguation
const { data, error } = await supabase.from('messages').select(`
  id,
  content,
  from:sender_id (name),
  to:receiver_id (name)
`)

// Option 2: Explicit constraint name (recommended for type inference)
const { data, error } = await supabase.from('messages').select(`
  id,
  content,
  from:users!messages_sender_id_fkey (name),
  to:users!messages_receiver_id_fkey (name)
`)
```

## Filter on Related Table

```typescript
// Posts where author is active (use table name in dot notation, not alias)
const { data, error } = await supabase.from('posts')
  .select(`
    id,
    title,
    author:users!inner (
      id,
      name
    )
  `)
  .eq('users.status', 'active')
```

## Count Related Rows

```typescript
const { data, error } = await supabase.from('posts').select(`
  id,
  title,
  comments(count)
`)
// Returns: { id, title, comments: [{ count: 5 }] }[]
```

## Nested Relations

```typescript
const { data, error } = await supabase.from('organizations').select(`
  id,
  name,
  teams (
    id,
    name,
    members:users (
      id,
      name
    )
  )
`)
```

## Limit on Related Table

```typescript
const { data, error } = await supabase.from('posts')
  .select(`
    id,
    title,
    comments (
      id,
      content
    )
  `)
  .limit(3, { referencedTable: 'comments' })
```

## Related

- [query-filters.md](query-filters.md)
- [ts-usage.md](ts-usage.md)
