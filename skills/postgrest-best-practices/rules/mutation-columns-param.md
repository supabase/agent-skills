---
title: Restrict Writable Columns with Columns Parameter
impact: MEDIUM
impactDescription: Control which columns can be set, ignore extra payload data
tags: columns, whitelist, insert, update, security, mutation
---

## Restrict Writable Columns with Columns Parameter

Use the `columns` query parameter to specify which columns can be written. Extra fields in the payload are ignored, providing security and flexibility.

**Incorrect (accepting any payload fields):**

```bash
# Client could send malicious fields
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com", "is_admin": true, "balance": 1000000}'
# is_admin and balance might be set if columns exist!
```

**Correct (whitelist allowed columns):**

```bash
# Only name and email are accepted
curl "http://localhost:3000/users?columns=name,email" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John", "email": "john@example.com", "is_admin": true}'
# is_admin is ignored, only name and email are inserted

# For updates too
curl "http://localhost:3000/users?columns=name,bio&id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "bio": "Hello", "role": "admin"}'
# role is ignored
```

**supabase-js (handled via payload or RLS):**

```typescript
// supabase-js doesn't have columns parameter
// Control via payload structure or RLS policies
const { data, error } = await supabase
  .from('users')
  .insert({
    name: input.name,
    email: input.email
    // Don't include is_admin even if in input
  })
  .select()

// Better: Use RLS to prevent writing sensitive columns
```

**Use cases:**

1. **Public signup** - Only allow specific fields
```bash
curl "http://localhost:3000/users?columns=email,password_hash,name" \
  -X POST \
  -d '{"email": "...", "password_hash": "...", "name": "...", "role": "admin"}'
# role ignored even if sent
```

2. **Profile updates** - Prevent changing sensitive fields
```bash
curl "http://localhost:3000/profiles?columns=bio,avatar_url&user_id=eq.123" \
  -X PATCH \
  -d '{"bio": "New bio", "user_id": 456}'
# user_id change ignored
```

3. **Bulk import** - Map CSV columns explicitly
```bash
curl "http://localhost:3000/products?columns=sku,name,price" \
  -X POST \
  -H "Content-Type: text/csv" \
  -d 'sku,name,price,internal_cost
A001,Widget,29.99,15.00'
# internal_cost column ignored
```

**Combine with missing=default:**

```bash
curl "http://localhost:3000/users?columns=name,email" \
  -X POST \
  -H "Prefer: missing=default, return=representation" \
  -d '{"name": "John"}'
# email uses DEFAULT if not provided, other columns use defaults too
```

**Security note:**
This is application-level filtering. For true security, use:
- RLS policies to restrict column access
- Database GRANT/REVOKE for column-level permissions
- Views that expose only allowed columns

Reference: [PostgREST Columns Parameter](https://postgrest.org/en/stable/references/api/tables_views.html#specifying-columns)
