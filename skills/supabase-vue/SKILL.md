---
name: supabase-vue
description: "Vue 3 and Supabase integration guidance for Vite applications using TypeScript, Composition API, and <script setup lang=\"ts\">. Use when initializing Supabase clients in Vue, building typed database composables, implementing Auth UI, Realtime subscriptions, Storage uploads, RLS-aware features, or testing Supabase behavior in Vue."
license: MIT
metadata:
  author: supabase
  version: "1.0.0"
---

# Supabase Vue

Use this skill for Vue 3-specific Supabase integration. Load the generic [Supabase skill](../supabase/SKILL.md) as well for product-wide Supabase practices, schema changes, RLS policy design, and security review. Do not duplicate its general guidance here.

This skill targets browser-based Vue 3 + Vite applications using TypeScript, Composition API, and `<script setup lang="ts">`. It does not cover Nuxt, Vue 2, or general Vue architecture.

## Integration choice

- Prefer the official `@supabase/supabase-js` SDK for new applications. It exposes the complete supported API, direct TypeScript inference, and avoids an unnecessary wrapper.
- First inspect the project’s dependencies and client setup. Keep a working integration unless a concrete requirement justifies changing it; do not install a second wrapper or create multiple clients.
- `@supabase-community/vue-supabase` is optional, not an official-SDK requirement. Consider it only when the project already uses it or its shared-client composable solves a specific need. Verify its installed version, peer dependencies, source/API, and current compatibility against the project before use. Prefer `supabase-js` if it is incompatible, stale, or adds no value.
- If the project uses SSR or executes code on a server, do not apply the browser singleton patterns below. Find the framework’s request-scoped, cookie-aware Supabase integration and follow its current official guidance.

## Required workflow

Before implementation:

1. Inspect `package.json`, lockfiles, Vue/Vite/TypeScript versions, Supabase SDK versions, and the existing integration.
2. Locate generated database types and determine whether they match the current schema.
3. Identify the feature’s data shape, auth/session needs, permissions, and required RLS/Storage/Realtime behavior.
4. Choose the existing client and a focused composable pattern; consult current official docs for version-sensitive APIs.
5. Implement explicit loading, success, empty, and error states. Handle every Supabase operation’s `error` and mutation failure.
6. Clean up Auth listeners, Realtime channels, watchers, and other component-scoped side effects.
7. Test successful and failing paths, then run the project’s Vue-aware TypeScript check and tests.

## Client and types

- Create one shared browser client and import it into components/composables. Read only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for browser configuration; validate that both are present. Vite-prefixed values are shipped to the browser and are never secrets.
- Never place a Supabase secret key or legacy service-role key in Vue/Vite code, `VITE_` variables, source maps, or browser requests. Use publishable keys for browser clients; RLS and grants—not key secrecy—authorize data access.
- Generate database types with the Supabase CLI and initialize with `createClient<Database>()`. Keep generated types committed and regenerate them when schema/migrations change. Infer query result types; use generated `Row`, `Insert`, and `Update` types as appropriate. Respect nullability and relationship cardinality. Do not hand-maintain parallel schemas, use `any`, or assert away type errors.
- Types only check code at build time; validate untrusted runtime input separately. If generated types are outdated, do not compensate with unsafe casts: inspect the actual schema/migrations, regenerate with the project’s CLI workflow, review the diff, and fix the underlying query or schema drift.

```ts
// src/lib/supabase.ts — browser-only Vite module
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !publishableKey) throw new Error('Missing Supabase browser configuration')

export const supabase = createClient<Database>(url, publishableKey)
```

See [client setup](references/client-setup.md) and [database types](references/type-database.md).

## Query and error rules

- Inspect `error` from every Supabase database, Auth, Storage, Functions, and other response. Never silently ignore it or only log it.
- Distinguish an empty successful result (`data: []` or `null` where appropriate) from a failed operation (`error` is set). Model loading, empty, success, and error states separately.
- For Supabase’s `{ data, error }` result style, explicitly check `error`; throw it only when using a surrounding `try/catch` that records or propagates it. Use `try/catch/finally` for thrown exceptions and always reset loading. Preserve useful diagnostic context, but show users a safe message rather than SQL, stack traces, credentials, or internal details.
- Treat mutation errors and zero-row outcomes deliberately. A successful response does not prove that the intended row changed or that a business workflow completed; request returned rows where needed and verify the outcome.

```ts
// Incorrect: errors disappear and data may be mistaken for a successful fetch.
const { data } = await supabase.from('profiles').select('*')

// Correct: empty data is valid; request failure is not.
const { data, error } = await supabase.from('profiles').select('id, display_name')
if (error) throw error
const profiles = data // inferred from generated Database types
```

Build reusable query state as focused composables, not as a large repository layer for a simple query. See [error and state handling](references/error-state.md) and [composables](references/composable-data.md).

## Security and authorization

The request path is **Vue UI → publishable-key Supabase client → Supabase API → PostgreSQL grants and RLS → rows**. A browser key identifies the project; it does not authorize users. Enable RLS on exposed user-data tables, grant least privilege, and enforce every access rule in database policies. The generic Supabase skill owns detailed policy authoring; inspect it for database security work.

- Never rely on route guards, hidden UI, client filters, or a frontend `user.id`/tenant/role check to protect data. Never trust user-supplied identity or user-editable `user_metadata` for authorization. Enforce ownership and permissions at the database/API boundary.
- Validate user input before submitting it, while still enforcing constraints and authorization server-side/database-side.
- Separate authentication (who signed in) from authorization (what they may access). Frontend auth state is for UI, not proof of permission.
- Distinguish public and private Storage buckets. A public bucket serves objects to anyone; a hidden URL is not access control. Use Storage policies and short-lived signed URLs for private content.
- See [security and RLS](references/security-rls.md) before touching user or tenant data.

## Auth, Realtime, Storage, and lifecycle

- Use Supabase Auth APIs for sign-up, password sign-in, OAuth, magic links/OTP, email confirmation, recovery, profile updates, and sign-out. Allow the SDK to manage refresh; do not implement token refresh yourself. Treat sessions as expiring/revocable and handle sign-out/session changes.
- Subscribe to `onAuthStateChange` for session UI updates and unsubscribe at the owning lifecycle boundary. Keep the callback fast and synchronous: update local reactive state only; schedule unrelated/async work outside it. This conservative pattern avoids slow callbacks and SDK-version-specific lock/reentrancy behavior. See [Auth](references/auth-session.md).
- Create Realtime channels only when needed. Handle subscription statuses and failures; remove channels on unmount and before replacing a reactive subscription. Realtime delivery is not authorization—RLS and Realtime policies still matter. See [Realtime lifecycle](references/realtime-lifecycle.md).
- Validate file size/type before upload, handle upload errors, and align bucket limits and `storage.objects` policies with the feature. Use `getPublicUrl()` only for intentionally public buckets; fetch private files through Storage or create a short-lived signed URL. See [Storage](references/storage-files.md).

## Verification

- Test composables and components with Vitest and Vue Test Utils; mock Supabase for deterministic unit tests. Cover empty, successful, rejected/error, loading reset, auth state, and subscription cleanup paths.
- Add local Supabase integration tests for critical policies and flows using different users/roles. Do not make every unit test depend on a hosted project; keep credentials out of test output and fixtures.
- Run `vue-tsc --noEmit` (or the repository’s configured Vue type-check script) because Vite transpilation alone does not type-check Vue SFCs. Run the application test suite. See [testing](references/test-vue.md).

## References

- [Client setup](references/client-setup.md)
- [Database types](references/type-database.md)
- [Error and state handling](references/error-state.md)
- [Auth and session state](references/auth-session.md)
- [Supabase composables](references/composable-data.md)
- [Realtime lifecycle](references/realtime-lifecycle.md)
- [Storage files](references/storage-files.md)
- [Security and RLS](references/security-rls.md)
- [Testing](references/test-vue.md)

## Official documentation

- [Supabase Vue quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/vue)
- [Supabase JavaScript reference](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase JavaScript TypeScript support](https://supabase.com/docs/reference/javascript/typescript-support)
- [Vue composables](https://vuejs.org/guide/reusability/composables)
- [Vue TypeScript](https://vuejs.org/guide/typescript/overview.html)
