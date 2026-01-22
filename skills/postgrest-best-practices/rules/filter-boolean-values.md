---
title: Filter Boolean Values with IS Operator
impact: HIGH
impactDescription: Correctly filters true/false/unknown boolean states
tags: boolean, is, true, false, filtering
---

## Filter Boolean Values with IS Operator

Use `is.true`, `is.false`, and `is.unknown` for boolean columns. While `eq.true` works, `is` is the standard SQL approach and handles tri-state booleans (true/false/null).

**Incorrect (inconsistent boolean handling):**

```bash
# These work but are inconsistent with NULL handling
curl "http://localhost:3000/users?active=eq.true"
curl "http://localhost:3000/users?active=eq.false"

# This won't catch NULL values
curl "http://localhost:3000/users?verified=neq.true"  # Misses NULL rows!
```

**Correct (use is.true, is.false, is.unknown):**

```bash
# Filter for TRUE values
curl "http://localhost:3000/users?is_active=is.true"

# Filter for FALSE values
curl "http://localhost:3000/users?is_active=is.false"

# Filter for NULL/UNKNOWN values (nullable boolean)
curl "http://localhost:3000/users?email_verified=is.unknown"

# Combine boolean filters
curl "http://localhost:3000/users?is_active=is.true&is_admin=is.false"
```

**supabase-js:**

```typescript
// Filter for true
const { data } = await supabase
  .from('users')
  .select('*')
  .is('is_active', true)

// Filter for false
const { data } = await supabase
  .from('users')
  .select('*')
  .is('is_active', false)

// Combined filters
const { data } = await supabase
  .from('users')
  .select('*')
  .is('is_active', true)
  .is('is_admin', false)
```

**Handling nullable booleans (tri-state):**

```bash
# Find users who have NOT verified (false or null)
curl "http://localhost:3000/users?email_verified=not.is.true"

# Find users with unknown verification status
curl "http://localhost:3000/users?email_verified=is.unknown"
```

```typescript
// NOT true (includes false AND null)
const { data } = await supabase
  .from('users')
  .select('*')
  .not('email_verified', 'is', true)
```

Note: Boolean values are case-insensitive (`is.TRUE`, `is.True`, `is.true` all work).

Reference: [PostgREST Operators](https://postgrest.org/en/stable/references/api/tables_views.html#operators)
