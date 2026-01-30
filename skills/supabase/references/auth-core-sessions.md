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

**Always use `onAuthStateChange`** - it's the single source of truth for auth state:

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth event:', event)

      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was automatically refreshed
        console.log('New access token received')
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user ?? null)
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

### Auth Events

| Event | When Fired |
|-------|------------|
| `INITIAL_SESSION` | On page load if session exists |
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
// Server-side code - always use getUser() which validates the JWT
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  return unauthorizedResponse()
}
const userId = user.id
```

### 2. Not Handling INITIAL_SESSION

**Incorrect:**

```typescript
// Only listens for SIGNED_IN, misses existing session on page load
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    setUser(session?.user)
  }
})
```

**Correct:**

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // INITIAL_SESSION fires on page load with existing session
  if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
    setUser(session?.user ?? null)
  } else if (event === 'SIGNED_OUT') {
    setUser(null)
  }
})
```

### 3. Calling Supabase in onAuthStateChange Without Deferring

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

### 4. Not Unsubscribing from Auth Listener

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

## Manual Session Management

```typescript
// Refresh session manually (rarely needed - client handles this)
const { data, error } = await supabase.auth.refreshSession()

// Set session from tokens (e.g., from OAuth callback)
const { data, error } = await supabase.auth.setSession({
  access_token: 'jwt-token',
  refresh_token: 'refresh-token',
})
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
