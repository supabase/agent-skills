---
title: Error Handling Patterns
impact: MEDIUM-HIGH
impactDescription: Prevents runtime errors and enables proper error recovery
tags: error, error-handling, retry, FunctionsHttpError, try-catch
---

## Error Handling Patterns

All Supabase operations return `{ data, error }`. Never assume success.

**Incorrect:**

```typescript
// Destructuring only data - error ignored
const { data } = await supabase.from('users').select()
data.forEach(user => console.log(user)) // Crashes if error!
```

**Correct:**

```typescript
const { data, error } = await supabase.from('users').select()

if (error) {
  console.error('Failed to fetch users:', error.message)
  return
}

// Safe to use data
data.forEach(user => console.log(user))
```

## Error Object Properties

```typescript
if (error) {
  console.log(error.message)  // Human-readable message
  console.log(error.code)     // Error code (e.g., 'PGRST116')
  console.log(error.details)  // Additional details
  console.log(error.hint)     // Suggested fix
}
```

## Edge Functions Error Types

```typescript
import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from '@supabase/supabase-js'

const { data, error } = await supabase.functions.invoke('my-function')

if (error instanceof FunctionsHttpError) {
  // Function returned an error response (4xx/5xx)
  const errorBody = await error.context.json()
  console.error('Function error:', errorBody)
} else if (error instanceof FunctionsRelayError) {
  // Network error between client and Supabase
  console.error('Relay error:', error.message)
} else if (error instanceof FunctionsFetchError) {
  // Could not reach the function
  console.error('Fetch error:', error.message)
}
```

## Automatic Retries

Use `fetch-retry` for resilient requests:

```typescript
import { createClient } from '@supabase/supabase-js'
import fetchRetry from 'fetch-retry'

const retryFetch = fetchRetry(fetch, {
  retries: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  retryOn: [500, 502, 503, 504],
})

const supabase = createClient(url, key, {
  global: { fetch: retryFetch },
})
```

## Common Error Codes

| Code | Meaning |
|------|---------|
| `PGRST116` | No rows returned (with `.single()`) |
| `23505` | Unique constraint violation |
| `23503` | Foreign key violation |
| `42501` | RLS policy violation |
| `42P01` | Table does not exist |

## Handling No Rows

```typescript
// .single() throws if no rows
const { data, error } = await supabase
  .from('users')
  .select()
  .eq('id', userId)
  .single()

if (error?.code === 'PGRST116') {
  // No user found - handle gracefully
  return null
}

// .maybeSingle() returns null instead of error
const { data } = await supabase
  .from('users')
  .select()
  .eq('id', userId)
  .maybeSingle()
// data is null if no rows, no error
```

## Related

- [query-crud.md](query-crud.md)
- [client-config.md](client-config.md)
