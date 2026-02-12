---
title: CLI Edge Functions Commands
impact: HIGH
impactDescription: Commands for creating, serving, and deploying Edge Functions
tags: cli, functions, new, serve, deploy, deno
---

## CLI Edge Functions Commands

Commands for scaffolding, local development, and deployment of Edge Functions.

**Incorrect:**

```bash
# Serving webhook function with JWT verification
supabase functions serve stripe-webhook
# Stripe can't provide JWT, all requests fail
```

**Correct:**

```bash
# For webhooks, disable JWT verification
supabase functions serve stripe-webhook --no-verify-jwt
```

---

## supabase functions new

Create new Edge Function with boilerplate.

```bash
supabase functions new hello-world
# Creates: supabase/functions/hello-world/index.ts
```

**Generated template:**
```typescript
Deno.serve(async (req) => {
  const { name } = await req.json()
  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Project structure:**
```text
supabase/functions/
├── _shared/           # Shared code (underscore prefix)
└── hello-world/
    ├── index.ts
    └── deno.json
```

---

## supabase functions serve

Serve functions locally with hot reload.

```bash
supabase functions serve                     # Serve all
supabase functions serve hello-world         # Serve specific
supabase functions serve --no-verify-jwt     # For webhooks
supabase functions serve --env-file .env.local  # Custom env
```

**Flags:** `--no-verify-jwt`, `--env-file`, `--inspect`, `--debug`

**Local URL:** `http://localhost:54321/functions/v1/<function-name>`

**Local secrets:** Create `supabase/functions/.env` (auto-loaded)

**Prerequisites:** `supabase start` running

---

## supabase functions deploy

Deploy to production.

```bash
supabase functions deploy                    # Deploy all
supabase functions deploy hello-world        # Deploy specific
supabase functions deploy --no-verify-jwt    # For webhooks
```

**Flags:** `--no-verify-jwt`, `--use-api`, `--jobs`

## Related

- [secrets-commands.md](secrets-commands.md) - Set production secrets
- [project-commands.md](project-commands.md) - Link before deploy
