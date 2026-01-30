---
title: Query Performance Optimization
impact: HIGH
impactDescription: Reduces data transfer and improves response times
tags: performance, optimization, select, parallel, Promise.all, explain
---

## Query Performance Optimization

Optimize SDK queries for faster responses and lower bandwidth.

## Select Only Needed Columns

**Incorrect:**

```typescript
// Fetches ALL columns, including large blobs
const { data } = await supabase.from('users').select('*')
```

**Correct:**

```typescript
// Fetch only what you need
const { data } = await supabase.from('users').select('id, name, email')
```

## Parallel Queries with Promise.all

**Incorrect:**

```typescript
// Sequential - slow
const users = await supabase.from('users').select()
const posts = await supabase.from('posts').select()
const comments = await supabase.from('comments').select()
```

**Correct:**

```typescript
// Parallel - fast
const [usersResult, postsResult, commentsResult] = await Promise.all([
  supabase.from('users').select('id, name'),
  supabase.from('posts').select('id, title').limit(10),
  supabase.from('comments').select('id, content').limit(20),
])
```

## Use Filters to Reduce Data

```typescript
// Fetch only relevant data
const { data } = await supabase
  .from('orders')
  .select('id, total, status')
  .eq('user_id', userId)
  .gte('created_at', startDate)
  .order('created_at', { ascending: false })
  .limit(50)
```

## Pagination with range()

```typescript
// Page 1 (rows 0-9)
const { data: page1 } = await supabase
  .from('products')
  .select('id, name, price')
  .range(0, 9)

// Page 2 (rows 10-19)
const { data: page2 } = await supabase
  .from('products')
  .select('id, name, price')
  .range(10, 19)
```

## Count Without Fetching Data

```typescript
// Get count only (no row data transferred)
const { count, error } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
```

## Debug with EXPLAIN

```typescript
// See query execution plan
const { data, error } = await supabase
  .from('orders')
  .select()
  .eq('status', 'pending')
  .explain({ analyze: true, verbose: true })

console.log(data)  // Execution plan, not rows
```

## Avoid N+1 Queries

**Incorrect:**

```typescript
// N+1: One query per post
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
// Single query with join
const { data: posts } = await supabase.from('posts').select(`
  id,
  title,
  comments (id, content)
`)
```

## Related

- [query-joins.md](query-joins.md)
- [perf-realtime.md](perf-realtime.md)
