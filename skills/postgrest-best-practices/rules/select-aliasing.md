---
title: Alias Columns for Cleaner API Responses
impact: MEDIUM
impactDescription: Rename columns in response without changing database schema
tags: alias, rename, select, columns, api-design
---

## Alias Columns for Cleaner API Responses

Use the `alias:column` syntax to rename columns in the response. This creates cleaner APIs without modifying your database schema.

**Incorrect (exposing database naming conventions):**

```bash
# Database snake_case exposed directly
curl "http://localhost:3000/users?select=id,first_name,last_name,created_at,updated_at"
# Returns: { "first_name": "John", "last_name": "Doe", "created_at": "..." }
```

**Correct (alias to preferred naming):**

```bash
# Alias to camelCase for JavaScript clients
curl "http://localhost:3000/users?select=id,firstName:first_name,lastName:last_name,createdAt:created_at"
# Returns: { "firstName": "John", "lastName": "Doe", "createdAt": "..." }

# Create computed-looking fields
curl "http://localhost:3000/users?select=id,fullName:full_name,profileUrl:avatar_url"

# Shorten long column names
curl "http://localhost:3000/metrics?select=id,value:measurement_value_decimal"
```

**supabase-js:**

```typescript
// Alias columns
const { data } = await supabase
  .from('users')
  .select('id, firstName:first_name, lastName:last_name, createdAt:created_at')

// Result: { id: 1, firstName: "John", lastName: "Doe", createdAt: "..." }
```

**Aliasing embedded resources:**

```bash
# Alias the relationship name
curl "http://localhost:3000/posts?select=id,title,writer:author_id(name)"

# Alias columns within embedded resource
curl "http://localhost:3000/posts?select=id,author:users(displayName:name,profilePic:avatar_url)"
```

```typescript
const { data } = await supabase
  .from('posts')
  .select('id, title, author:users(displayName:name, profilePic:avatar_url)')

// Result: { id: 1, title: "Post", author: { displayName: "John", profilePic: "url" } }
```

**Use cases:**

| Database column | Aliased to | Reason |
|-----------------|------------|--------|
| `first_name` | `firstName` | JavaScript convention |
| `created_at` | `createdAt` | JavaScript convention |
| `avatar_url` | `profilePic` | Semantic naming |
| `usr_email_addr` | `email` | Simplify legacy schema |

**Notes:**
- Aliases only affect the response, not filters
- Filters still use original column names
- Aliases work with embedded resources too

```bash
# Filter uses original name, response uses alias
curl "http://localhost:3000/users?select=userId:id,userName:name&name=eq.John"
```

Reference: [PostgREST Column Aliasing](https://postgrest.org/en/stable/references/api/tables_views.html#renaming-columns)
