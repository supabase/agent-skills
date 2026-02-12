---
title: RLS Integration in Edge Functions
impact: HIGH
impactDescription: Ensures proper data isolation and security enforcement
tags: edge-functions, rls, row-level-security, auth-context
---

## RLS Integration in Edge Functions

Pass user authentication context to Supabase client for Row Level Security enforcement. Create the client inside the request handler to get per-request auth context. Use service role key only for admin operations.

**Incorrect:**

```typescript
// Client created outside handler - same auth for all requests
const supabase = createClient(url, key, {
  global: { headers: { Authorization: "static-token" } },
});

Deno.serve(async (req) => {
  const { data } = await supabase.from("profiles").select("*");
  return Response.json(data);
});
```

**Correct:**

```typescript
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Create client with per-request auth context
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    }
  );

  // RLS policies now apply to this user
  const { data, error } = await supabase.from("profiles").select("*");
  return Response.json({ data, error });
});
```

Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations that need to bypass RLS (background jobs, webhooks). For verifying the user's identity, use `supabase.auth.getClaims()` on the per-request client.

Reference: [Connect to Postgres](https://supabase.com/docs/guides/functions/connect-to-postgres)
