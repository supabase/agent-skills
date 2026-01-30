---
title: Server Client and Middleware Setup
impact: CRITICAL
impactDescription: Prevents auth bypass and ensures session refresh works correctly
tags: createServerClient, middleware, cookies, ssr, server-components
---

## Server Client Setup

Use `createServerClient` from `@supabase/ssr` for Server Components, Route Handlers, and Server Actions. Create a fresh instance per request.

**Incorrect:**

```typescript
// Using deprecated package
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

// Using individual cookie methods
cookies: {
  get(name) { return cookieStore.get(name)?.value },
  set(name, value, options) { cookieStore.set({ name, value, ...options }) },
  remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
}
```

**Correct:**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // Called from Server Component - ignore
          }
        },
      },
    }
  )
}
```

## Middleware for Session Refresh

Token refresh requires middleware to update cookies on both request and response.

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always call getUser() to refresh the session
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## Never Trust getSession() on Server

`getSession()` reads from cookies without validating the JWT.

```typescript
// DANGEROUS - JWT not validated
const { data: { session } } = await supabase.auth.getSession()

// SAFE - validates JWT with Supabase Auth server
const { data: { user } } = await supabase.auth.getUser()
```

## Related

- [client-browser.md](client-browser.md)
- [framework-nextjs.md](framework-nextjs.md)
