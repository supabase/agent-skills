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

When a table has multiple FKs to the same table:

```typescript
// messages table has sender_id and receiver_id both pointing to users
const { data, error } = await supabase.from('messages').select(`
  id,
  content,
  sender:users!sender_id (name),
  receiver:users!receiver_id (name)
`)
```

## Filter on Related Table

```typescript
// Posts where author is active
const { data, error } = await supabase.from('posts')
  .select(`
    id,
    title,
    author:users!inner (
      id,
      name
    )
  `)
  .eq('author.status', 'active')
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
