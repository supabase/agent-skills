---
title: Implement PKCE Flow for OAuth
impact: HIGH
impactDescription: PKCE prevents authorization code interception attacks in SPAs
tags: auth, oauth, pkce, spa, code-exchange, security
---

## Implement PKCE Flow for OAuth

Proof Key for Code Exchange (PKCE) secures OAuth in browser environments where client secrets can't be stored safely.

## How PKCE Works

1. Client generates a random `code_verifier`
2. Client creates `code_challenge` = SHA256(code_verifier)
3. Client sends `code_challenge` with auth request
4. After redirect, client exchanges code using `code_verifier`
5. Server verifies challenge matches, returns tokens

Supabase handles this automatically with `@supabase/ssr` or when using server-side code exchange.

## Server-Side Code Exchange (Recommended)

### Next.js App Router

```typescript
// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

### SvelteKit

```typescript
// src/routes/auth/callback/+server.ts
import { redirect } from '@sveltejs/kit'

export const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      throw redirect(303, next)
    }
  }

  throw redirect(303, '/auth/auth-code-error')
}
```

## Initiating OAuth with PKCE

```typescript
// Client-side: initiate OAuth flow
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    // PKCE is automatic when using server-side code exchange
  },
})

if (data.url) {
  window.location.href = data.url
}
```

## Common Mistakes

### 1. Not Using Server-Side Code Exchange

**Incorrect:**

```typescript
// Client-side only - implicit flow, less secure
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
})
// Tokens returned in URL fragment, vulnerable to interception
```

**Correct:**

```typescript
// Use server-side callback to exchange code
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback`, // Server route
  },
})

// Server route exchanges code for session securely
```

### 2. Handling Code in Client Instead of Server

**Incorrect:**

```typescript
// Client-side callback page
useEffect(() => {
  const code = new URLSearchParams(window.location.search).get('code')
  if (code) {
    // Don't do this on client - use server route instead
    supabase.auth.exchangeCodeForSession(code)
  }
}, [])
```

**Correct:**

```typescript
// Server-side callback route (see examples above)
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }
}
```

### 3. Missing Cookie Configuration

**Incorrect:**

```typescript
// Missing cookie handlers - session not persisted
const supabase = createServerClient(url, key, {})
```

**Correct:**

```typescript
const supabase = createServerClient(url, key, {
  cookies: {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      )
    },
  },
})
```

### 4. Forgetting Error Handling

**Incorrect:**

```typescript
export async function GET(request: Request) {
  const code = searchParams.get('code')
  await supabase.auth.exchangeCodeForSession(code!) // Crashes if no code
  return redirect('/dashboard')
}
```

**Correct:**

```typescript
export async function GET(request: Request) {
  const code = searchParams.get('code')

  if (!code) {
    return redirect('/auth/error?message=missing_code')
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth error:', error)
    return redirect('/auth/error?message=exchange_failed')
  }

  return redirect('/dashboard')
}
```

## Skip Browser Redirect

For custom OAuth flows (e.g., popup windows):

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    skipBrowserRedirect: true,
  },
})

// Open in popup instead of redirect
const popup = window.open(data.url, 'oauth', 'width=500,height=600')
```

## Related

- [oauth-providers.md](oauth-providers.md) - Provider configuration
- [server-ssr.md](server-ssr.md) - Server-side auth setup
- [Docs: PKCE Flow](https://supabase.com/docs/guides/auth/server-side/oauth-with-pkce)
