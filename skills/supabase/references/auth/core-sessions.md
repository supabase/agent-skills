---
title: Manage Auth Sessions Correctly
impact: CRITICAL
impactDescription: Session mismanagement causes auth failures, security issues, and poor UX
tags: auth, sessions, tokens, refresh, onAuthStateChange, jwt
---

## Manage Auth Sessions Correctly

Session lifecycle, token refresh, and auth state listeners.

## Session Structure

```typescript
interface Session {
  access_token: string      // JWT, expires in 1 hour (default)
  refresh_token: string     // Single-use, used to get new access_token
  expires_at: number        // Unix timestamp when access_token expires
  expires_in: number        // Seconds until expiration
  user: User                // User object with id, email, metadata
}
```

## Listen to Auth State Changes

`onAuthStateChange` is the single source of truth for auth state. In React, wrap it with `useSyncExternalStore` for safe, tear-free subscriptions:

```typescript
import { useSyncExternalStore } from 'react'

let currentSession: Session | null = null

function subscribe(callback: () => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      currentSession = session
      callback()
    }
  )
  return () => subscription.unsubscribe()
}

function getSnapshot() {
  return currentSession
}

// In your component
function useSession() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
```

### Auth Events

| Event | When Fired |
|-------|------------|
| `INITIAL_SESSION` | On page load (before React hydration — React apps rarely see this) |
| `SIGNED_IN` | User signed in successfully |
| `SIGNED_OUT` | User signed out |
| `TOKEN_REFRESHED` | Access token was refreshed |
| `USER_UPDATED` | User profile was updated |
| `PASSWORD_RECOVERY` | User clicked password reset link |

## Get Current Session

```typescript
// From local storage (fast, but not validated)
const { data: { session } } = await supabase.auth.getSession()

// Validate user on server (slower, but secure)
const { data: { user } } = await supabase.auth.getUser()
```

## Common Mistakes

### 1. Using getSession() for Server-Side Validation

**Incorrect:**

```typescript
// Server-side code
const { data: { session } } = await supabase.auth.getSession()
// DANGER: getSession reads from storage, doesn't validate JWT
const userId = session?.user.id
```

**Correct:**

```typescript
// Server-side code - always use getClaims() which validates the JWT
const { data, error } = await supabase.auth.getClaims()
if (error || !data) {
  return unauthorizedResponse()
}
const userId = data.claims.sub
```

> **Performance tip:** Enable asymmetric JWT signing keys (Dashboard: Auth > Settings) so `getClaims()` verifies tokens locally via WebCrypto with no network request. Without asymmetric keys, it falls back to a server round-trip like `getUser()`.

### 2. Calling Supabase in onAuthStateChange Without Deferring

**Incorrect:**

```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  // This can cause deadlocks
  await supabase.from('profiles').select('*')
})
```

**Correct:**

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // Defer Supabase calls with setTimeout
  setTimeout(async () => {
    await supabase.from('profiles').select('*')
  }, 0)
})
```

### 3. Not Unsubscribing from Auth Listener

**Incorrect:**

```typescript
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user)
  })
  // Missing cleanup - causes memory leaks
}, [])
```

**Correct:**

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setUser(session?.user ?? null)
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

## JWT Claims

Access user claims in RLS policies:

```sql
-- Get user ID
auth.uid()                                    -- Returns UUID

-- Get full JWT
auth.jwt()                                    -- Returns JSONB

-- Get specific claims
auth.jwt() ->> 'email'                        -- User email
auth.jwt() -> 'app_metadata' ->> 'role'       -- Custom role (admin-set)
auth.jwt() ->> 'aal'                          -- Auth assurance level (aal1/aal2)
```

## Session Settings

Configure in Dashboard: Auth > Settings

| Setting | Default | Description |
|---------|---------|-------------|
| JWT Expiry | 3600s (1 hour) | How long access tokens are valid |
| Refresh Token Rotation | Enabled | New refresh token on each use |
| Refresh Token Reuse Interval | 10s | Grace period for concurrent requests |

## Related

- [core-signin.md](core-signin.md) - Sign-in flows
- [server-ssr.md](server-ssr.md) - Server-side session handling
- [Docs: Sessions](https://supabase.com/docs/guides/auth/sessions)
- [Docs: onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
