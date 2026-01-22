---
title: Filter Array Columns with Containment Operators
impact: HIGH
impactDescription: Query array data efficiently using PostgreSQL array operators
tags: arrays, cs, cd, ov, contains, overlap, filtering
---

## Filter Array Columns with Containment Operators

Use `cs` (contains), `cd` (contained by), and `ov` (overlap) to filter PostgreSQL array columns. Array values use curly brace syntax `{val1,val2}`.

**Incorrect (treating arrays like scalars):**

```bash
# eq doesn't work for partial array matching
curl "http://localhost:3000/posts?tags=eq.javascript"        # Won't work
curl "http://localhost:3000/posts?tags=eq.{javascript}"      # Exact match only

# LIKE doesn't work on arrays
curl "http://localhost:3000/posts?tags=like.*script*"        # Won't work
```

**Correct (use array containment operators):**

```bash
# cs (contains @>) - array contains these elements
curl "http://localhost:3000/posts?tags=cs.{javascript}"           # Has 'javascript'
curl "http://localhost:3000/posts?tags=cs.{javascript,react}"     # Has BOTH tags

# cd (contained by <@) - array is subset of these elements
curl "http://localhost:3000/posts?tags=cd.{javascript,typescript,react}"  # Only these tags

# ov (overlap &&) - arrays share at least one element
curl "http://localhost:3000/posts?tags=ov.{javascript,python,rust}"  # Has ANY of these

# Combine with other filters
curl "http://localhost:3000/posts?tags=cs.{featured}&status=eq.published"
```

**supabase-js:**

```typescript
// Contains - has this tag
const { data } = await supabase
  .from('posts')
  .select('*')
  .contains('tags', ['javascript'])

// Contains multiple - has ALL these tags
const { data } = await supabase
  .from('posts')
  .select('*')
  .contains('tags', ['javascript', 'react'])

// Contained by - only has these tags (subset)
const { data } = await supabase
  .from('posts')
  .select('*')
  .containedBy('tags', ['javascript', 'typescript', 'react'])

// Overlaps - has ANY of these tags
const { data } = await supabase
  .from('posts')
  .select('*')
  .overlaps('tags', ['javascript', 'python', 'rust'])
```

**Negating array operators:**

```bash
# Does NOT contain tag
curl "http://localhost:3000/posts?tags=not.cs.{spam}"

# No overlap with blocked tags
curl "http://localhost:3000/posts?tags=not.ov.{spam,nsfw,blocked}"
```

```typescript
// NOT contains
const { data } = await supabase
  .from('posts')
  .select('*')
  .not('tags', 'cs', '{spam}')
```

**Operator Reference:**

| Operator | SQL | Meaning | Example |
|----------|-----|---------|---------|
| `cs` | `@>` | Contains | `?tags=cs.{a,b}` - has a AND b |
| `cd` | `<@` | Contained by | `?tags=cd.{a,b,c}` - only a,b,c allowed |
| `ov` | `&&` | Overlaps | `?tags=ov.{a,b}` - has a OR b |

Reference: [PostgREST Operators](https://postgrest.org/en/stable/references/api/tables_views.html#operators)
