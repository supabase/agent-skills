---
title: Use Embedding to Avoid N+1 Query Problems
impact: CRITICAL
impactDescription: Single request instead of N+1 requests, 10-100x fewer HTTP calls
tags: n-plus-one, embedding, performance, joins
---

## Use Embedding to Avoid N+1 Query Problems

Making separate API calls for each related record causes N+1 problems. Use embedding to fetch all related data in a single request.

**Incorrect (N+1 API calls):**

```javascript
// First: get all posts (1 request)
const posts = await fetch('http://localhost:3000/posts').then(r => r.json())

// Then: get author for each post (N requests!)
for (const post of posts) {
  const author = await fetch(`http://localhost:3000/users?id=eq.${post.author_id}`)
    .then(r => r.json())
  post.author = author[0]
}
// Total: 101 requests for 100 posts!
```

**Correct (single embedded request):**

```bash
# Single request returns posts with nested authors
curl "http://localhost:3000/posts?select=*,author:users(id,name,avatar_url)"
```

```typescript
// supabase-js: single request with embedding
const { data: posts } = await supabase
  .from('posts')
  .select('*, author:users(id, name, avatar_url)')

// posts[0].author is already populated
console.log(posts[0].author.name)
```

**Multiple levels of embedding:**

```bash
# Posts with authors AND their profiles AND post comments
curl "http://localhost:3000/posts?select=*,author:users(name,profile:profiles(bio)),comments(text,user:users(name))"
```

```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    author:users(
      name,
      profile:profiles(bio)
    ),
    comments(
      text,
      user:users(name)
    )
  `)
```

**Before (N+1):**
- 1 request for posts
- 100 requests for authors
- 100 requests for profiles
- **Total: 201 requests**

**After (embedding):**
- 1 request with all data
- **Total: 1 request**

**Performance impact:**
- Reduces HTTP overhead dramatically
- Database performs optimized JOINs
- Network latency: 1 round-trip vs N+1 round-trips
- Typically 10-100x faster for lists with related data

Reference: [PostgREST Resource Embedding](https://postgrest.org/en/stable/references/api/resource_embedding.html)
