---
title: Initialize One Browser Supabase Client
impact: HIGH
impactDescription: Prevents duplicated clients, accidental key exposure, and incorrect browser/server lifecycle assumptions
tags: vue, vite, supabase-js, client, environment
---

## Keep client configuration browser-scoped and singular

For Vue + Vite browser apps, a module exporting one typed `createClient` instance is sufficient. Import it from features and composables rather than creating a client per component. This default is not an SSR architecture.

**Incorrect (client per component, or server secret in public config):**

```ts
// Creates competing Auth/realtime instances on repeated component setup.
const supabase = createClient(url, import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY)
```

**Correct (one browser client):**

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Missing Supabase browser configuration')

export const supabase = createClient<Database>(url, key)
```

Put these values in an ignored local env file and configure them in the hosting platform. Every `VITE_` value is compiled into browser-visible assets. A publishable key is expected to be public; it must be paired with database grants, RLS policies, and Storage policies.

Before changing setup, inspect the existing client and package versions. Do not add a Vue wrapper merely to access the client. The community package’s current README presents `useSupabaseClient()` rather than a conventional `app.use()` plugin. Its implementation wraps `supabase-js`, returns a module-level shared client, and does not provide a reactive Auth/session store; this global singleton is not appropriate for request-scoped SSR. Its package metadata declares `@supabase/supabase-js` `^2.52.0` and Vue peer dependency `^3.0.0` (development metadata shows Vue `^3.5.4`), so the broad peer range does not prove compatibility with every current SDK/Vue version. At research time the repository showed recent activity and a GitHub release page reported v3.0.6, while the repository `package.json` and npm page showed v3.0.1. Treat that discrepancy as unresolved: inspect the actual registry version, lockfile, release/tag, and source in the target project before choosing it. Its README also still uses the legacy `VITE_SUPABASE_ANON_KEY` example; prefer the current publishable key naming. These signals do not establish that the package is either abandoned or fully current.

If the project executes code server-side, stop: a process-wide browser singleton can leak session state between requests. Research the framework’s request-scoped, cookie-aware setup and current Supabase server guidance rather than improvising server storage.

References: [Vue quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/vue), [JavaScript initialization](https://supabase.com/docs/reference/javascript/initializing), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Vite env variables](https://vite.dev/guide/env-and-mode.html).
