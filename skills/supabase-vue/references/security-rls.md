---
title: Put Authorization at Supabase Policy Boundaries
impact: CRITICAL
impactDescription: Prevents browser UI logic and public project keys from being mistaken for data authorization
tags: security, rls, authorization, vue, storage
---

## Enforce access beyond the Vue application

The browser holds a publishable key and sends the current user’s access token through the Supabase client. The API forwards the request to PostgreSQL under the appropriate database role; grants determine whether an operation is available and RLS policies determine which rows it may affect. Apply the same principle to `storage.objects` policies.

**Incorrect (trusts a caller-controlled identifier and frontend-only gating):**

```ts
// Hiding this control or filtering by userId does not secure the table.
if (currentUser.value?.id === route.params.userId) {
  await supabase.from('profiles').select('*').eq('id', route.params.userId)
}
```

**Correct (UI is a usability check; the database enforces ownership):**

```sql
alter table public.profiles enable row level security;
create policy "Users read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);
```

Scope table grants to needed operations and write policies to the intended user/tenant. For updates, guard both existing and resulting rows where the access model requires it. Never authorize from user-editable `user_metadata`; do not accept role, tenant, or owner identifiers from the browser as trusted authority. Validate request data, while database constraints and policies remain the enforcement boundary.

Never expose a secret or service-role key to Vite/browser code. The key prefix `VITE_` means public bundle configuration. A publishable key grants no user-level permission by itself, but any rows that exposed grants/policies permit are reachable from the browser. Do not use Vue route guards, disabled buttons, hidden links, client-side filters, or Realtime callbacks as security controls.

Use public Storage buckets only for intentionally public objects; public buckets bypass object read restrictions for serving. Private buckets need object policies and authenticated downloads or short-lived signed URLs. Check access from both a permitted and denied identity.

For detailed policy design, grants, views, and database-side tests, also load the generic [Supabase skill](../../supabase/SKILL.md). References: [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security), [API security](https://supabase.com/docs/guides/api/securing-your-api), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [API keys](https://supabase.com/docs/guides/getting-started/api-keys).
