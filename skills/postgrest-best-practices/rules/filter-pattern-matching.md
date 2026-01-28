---
title: Use Pattern Matching Operators for Text Search
impact: HIGH
impactDescription: Enables flexible text filtering with wildcards and regex
tags: like, ilike, match, pattern, regex, text-search
---

## Use Pattern Matching Operators for Text Search

PostgREST provides `like`, `ilike` (case-insensitive), and `match`/`imatch` (regex) for text pattern matching. Use `*` as the wildcard character (converted to `%` internally).

**Incorrect (SQL LIKE syntax won't work):**

```bash
# SQL LIKE syntax is NOT supported
curl "http://localhost:3000/users?name LIKE '%john%'"     # Won't work
curl "http://localhost:3000/users?name LIKE 'john%'"      # Won't work
```

**Correct (PostgREST pattern operators with * wildcard):**

```bash
# LIKE - case-sensitive pattern matching (use * for wildcard)
curl "http://localhost:3000/users?name=like.*john*"      # Contains 'john'
curl "http://localhost:3000/users?name=like.john*"       # Starts with 'john'
curl "http://localhost:3000/users?name=like.*smith"      # Ends with 'smith'

# ILIKE - case-insensitive pattern matching
curl "http://localhost:3000/users?name=ilike.*JOHN*"     # Contains 'john' (any case)
curl "http://localhost:3000/users?email=ilike.*@gmail.com"

# MATCH - POSIX regex (case-sensitive)
curl "http://localhost:3000/users?name=match.^[A-Z]"     # Starts with uppercase

# IMATCH - POSIX regex (case-insensitive)
curl "http://localhost:3000/users?email=imatch.^[a-z]+@"
```

**supabase-js:**

```typescript
// LIKE - contains pattern
const { data } = await supabase
  .from('users')
  .select('*')
  .like('name', '%john%')  // Note: supabase-js uses % not *

// ILIKE - case-insensitive
const { data } = await supabase
  .from('users')
  .select('*')
  .ilike('email', '%@gmail.com')

// Starts with
const { data } = await supabase
  .from('users')
  .select('*')
  .like('name', 'john%')

// Regex matching (via filter)
const { data } = await supabase
  .from('users')
  .select('*')
  .filter('name', 'match', '^[A-Z]')
```

**Operator Reference:**

| Operator | SQL Equivalent | Case | Example |
|----------|---------------|------|---------|
| `like` | `LIKE` | Sensitive | `?name=like.*john*` |
| `ilike` | `ILIKE` | Insensitive | `?name=ilike.*john*` |
| `match` | `~` | Sensitive | `?name=match.^[A-Z]` |
| `imatch` | `~*` | Insensitive | `?name=imatch.^[a-z]` |

Note: In curl/PostgREST, use `*` for wildcards. In supabase-js, use `%` for wildcards.

Reference: [PostgREST Operators](https://postgrest.org/en/stable/references/api/tables_views.html#operators)
