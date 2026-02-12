---
title: Implement SSR Authentication
impact: CRITICAL
impactDescription: SSR auth mistakes cause auth failures, security issues, and hydration mismatches
tags: auth, ssr, server, nextjs, sveltekit, nuxt, cookies
---

## Implement SSR Authentication

Server-side rendering authentication using `@supabase/ssr` for Next.js, SvelteKit, Nuxt, and other frameworks.

## Install

```bash
npm install @supabase/ssr @supabase/supabase-js
```

## Next.js App Router

### Client Setup

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Server Client Setup

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  )
}
```

### Middleware

```typescript
// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed
  const { data: claims } = await supabase.auth.getClaims()

  // Protect routes
  if (!claims && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Usage in Server Components

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  // Use getClaims() (validates JWT locally) or getUser() (round-trips to Auth server)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)

  return <div>{/* Render posts */}</div>
}
```

## SvelteKit

### Hooks Setup

```typescript
// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return event.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { ...options, path: '/' })
          })
        },
      },
    }
  )

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    if (!session) return { session: null, user: null }

    const { data: { user }, error } = await event.locals.supabase.auth.getUser()
    if (error) return { session: null, user: null }

    return { session, user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}
```

## Common Mistakes

### 1. Using createClient Instead of createServerClient

**Incorrect:**

```typescript
// Server-side code
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(url, key)
  // No cookie handling - session not available
  const { data: { user } } = await supabase.auth.getUser()
}
```

**Correct:**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) { /* ... */ },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
}
```

### 2. Using getSession() for Auth Validation

**Incorrect:**

```typescript
// Server-side - INSECURE
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  // Session from cookies - not validated!
  return protectedContent
}
```

**Correct:**

```typescript
// Server-side - validates JWT
const { data: { user }, error } = await supabase.auth.getUser()
if (!user || error) {
  redirect('/login')
}
return protectedContent
```

### 3. Missing Cookie Configuration

**Incorrect:**

```typescript
const supabase = createServerClient(url, key, {})
// No cookie handlers - session lost on page reload
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

### 4. Not Refreshing Session in Middleware

**Incorrect:**

```typescript
// proxy.ts
export async function middleware(request: NextRequest) {
  // No supabase call - session never refreshed
  return NextResponse.next()
}
```

**Correct:**

```typescript
export async function middleware(request: NextRequest) {
  // Create client to trigger cookie refresh
  const supabase = createServerClient(url, key, {
    cookies: { /* ... */ },
  })

  // This refreshes the session if needed
  await supabase.auth.getClaims()

  return supabaseResponse
}
```

### 5. Hydration Mismatch with Auth State

**Incorrect:**

```typescript
// Client component
export function Header() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  // Server renders null, client renders user = mismatch
  return <div>{user?.email}</div>
}
```

**Correct:**

```typescript
// Pass user from server component
// app/layout.tsx (Server Component)
export default async function Layout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <Header initialUser={user}>{children}</Header>
}

// components/Header.tsx (Client Component)
'use client'
export function Header({ initialUser }) {
  const [user, setUser] = useState(initialUser)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  return <div>{user?.email}</div>
}
```

## OAuth Callback Route

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

## Related

- [oauth-pkce.md](oauth-pkce.md) - PKCE flow for OAuth
- [core-sessions.md](core-sessions.md) - Session management
- [server-admin-api.md](server-admin-api.md) - Admin operations
- [Docs: SSR](https://supabase.com/docs/guides/auth/server-side)
