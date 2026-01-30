---
title: Optimize Queries for PostgREST
impact: HIGH
impactDescription: Faster API responses and reduced database load
tags: postgrest, queries, performance, optimization, supabase-js
---

## Optimize Queries for PostgREST

Supabase uses PostgREST to generate REST APIs. Optimize queries for better
performance.

## Select Only Needed Columns

**Incorrect:**

```javascript
// Fetches all columns including large text/blobs
const { data } = await supabase.from("posts").select("*");
```

**Correct:**

```javascript
// Only fetch needed columns
const { data } = await supabase.from("posts").select("id, title, author_id");
```

## Use Explicit Filters

Explicit filters help the query planner, even with RLS.

**Incorrect:**

```javascript
// Relies only on RLS - query planner has less info
const { data } = await supabase.from("posts").select("*");
```

**Correct:**

```javascript
// Explicit filter improves query plan
const { data } = await supabase
  .from("posts")
  .select("*")
  .eq("author_id", userId);
```

## Always Paginate

**Incorrect:**

```javascript
// Could return thousands of rows
const { data } = await supabase.from("posts").select("*");
```

**Correct:**

```javascript
// Paginate results
const { data } = await supabase
  .from("posts")
  .select("*")
  .range(0, 19) // First 20 rows
  .order("created_at", { ascending: false });
```

## Efficient Joins

**Incorrect:**

```javascript
// N+1: One query per post for author
const { data: posts } = await supabase.from("posts").select("*");
for (const post of posts) {
  const { data: author } = await supabase
    .from("users")
    .select("*")
    .eq("id", post.author_id)
    .single();
}
```

**Correct:**

```javascript
// Single query with embedded join
const { data } = await supabase.from("posts").select(`
    id,
    title,
    author:users (
      id,
      name,
      avatar_url
    )
  `);
```

## Use count Option Efficiently

**Incorrect:**

```javascript
// Counts ALL rows (slow on large tables)
const { count } = await supabase
  .from("posts")
  .select("*", { count: "exact", head: true });
```

**Correct:**

```javascript
// Estimated count (fast)
const { count } = await supabase
  .from("posts")
  .select("*", { count: "estimated", head: true });

// Or planned count (uses query planner estimate)
const { count } = await supabase
  .from("posts")
  .select("*", { count: "planned", head: true });
```

## Debug Query Performance

```javascript
// Get query execution plan
const { data } = await supabase
  .from("posts")
  .select("*")
  .eq("author_id", userId)
  .explain({ analyze: true, verbose: true });

console.log(data); // Shows execution plan
```

Enable explain in database:

```sql
alter role authenticator set pgrst.db_plan_enabled to true;
notify pgrst, 'reload config';
```

## Related

- [perf-indexes.md](perf-indexes.md)
- [Docs](https://supabase.com/docs/guides/database/query-optimization)
