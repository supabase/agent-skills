---
title: Browser Client Setup
impact: CRITICAL
impactDescription: Prevents session conflicts and memory leaks from multiple client instances
tags: createBrowserClient, singleton, client-side, ssr, supabase-js
---

## Browser Client Setup

Use `createBrowserClient` from `@supabase/ssr` for client-side code. It implements a singleton pattern internally.

**Incorrect:**

```typescript
// Creates new instance on every render - causes session conflicts
import { createClient } from '@supabase/supabase-js'

function MyComponent() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  // ...
}
```

**Correct:**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// In component - uses singleton
import { createClient } from '@/lib/supabase/client'

function MyComponent() {
  const supabase = createClient()
  // ...
}
```

## When to Use

- Client Components (`'use client'`)
- Browser-side event handlers
- Realtime subscriptions in the browser

## Key Points

- `createBrowserClient` returns the same instance on subsequent calls
- Do not use `@supabase/auth-helpers-nextjs` (deprecated)
- Session is stored in cookies; requires middleware/proxy setup for server sync

## Related

- [client-server.md](client-server.md)
- [framework-nextjs.md](framework-nextjs.md)
