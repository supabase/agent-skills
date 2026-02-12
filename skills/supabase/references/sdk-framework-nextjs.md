---
title: Next.js App Router Integration
impact: HIGH
impactDescription: Enables proper SSR auth with session refresh and type-safe queries
tags: nextjs, app-router, server-components, proxy, ssr
---

## Next.js App Router Integration

Complete setup for Next.js 13+ App Router with Supabase.

**Incorrect:**

```typescript
// Using deprecated package and wrong cookie methods
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}
```

**Correct:**

```typescript
// Using @supabase/ssr with getAll/setAll
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
    },
  })
}
```

## 1. Install Packages

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

> The publishable key (`sb_publishable_...`) is replacing the legacy `anon` key. Both work during the transition period.

## 3. Create Client Utilities

**Browser Client** (`lib/supabase/client.ts`):

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**Server Client** (`lib/supabase/server.ts`):

```typescript
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
            // Server Component - ignore
          }
        },
      },
    }
  )
}
```

## 4. Proxy (Required)

```typescript
// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the Auth token
  // getClaims() validates JWT locally (fast, no network request, requires asymmetric keys)
  // getUser() validates via Auth server round-trip (detects logouts/revocations)
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## 5. Usage Examples

**Server Component:**

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: posts } = await supabase.from('posts').select()

  return <ul>{posts?.map(post => <li key={post.id}>{post.title}</li>)}</ul>
}
```

**Client Component:**

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function RealtimePosts() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => setPosts(prev => [...prev, payload.new])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return <ul>{posts.map(post => <li key={post.id}>{post.title}</li>)}</ul>
}
```

**Server Action:**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('posts').insert({ title: formData.get('title') })
  revalidatePath('/posts')
}
```

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Using `auth-helpers-nextjs` | Use `@supabase/ssr` |
| Individual cookie methods | Use `getAll()`/`setAll()` |
| Trusting `getSession()` | Use `getUser()` (server-verified) or `getClaims()` (local JWT validation, requires asymmetric keys) |
| Missing proxy | Required for session refresh |
| Reusing server client | Create fresh client per request |

## Related

- [client-browser.md](client-browser.md)
- [client-server.md](client-server.md)
