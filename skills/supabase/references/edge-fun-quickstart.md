---
title: Edge Functions Quick Start
tags: edge-functions, quickstart, deployment, cli, deno
---

## Edge Functions Quick Start

Create and deploy serverless TypeScript functions that run globally at the edge on Deno runtime. Functions use `Deno.serve()` as the handler and have automatic access to environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DB_URL`.

**Incorrect:**

```typescript
// Missing error handling for JSON parsing - crashes on invalid input
Deno.serve(async (req) => {
  const { name } = await req.json();
  return new Response(`Hello ${name}`);
});
```

**Correct:**

```typescript
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();
    return new Response(JSON.stringify({ message: `Hello ${name}!` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

Place shared CORS headers in `supabase/functions/_shared/cors.ts`:

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
```

CLI workflow: `npx supabase functions new hello-world`, then `npx supabase start && npx supabase functions serve` for local dev, and `npx supabase functions deploy hello-world` for production (after `npx supabase login` and `npx supabase link --project-ref PROJECT_ID`).

Reference: [Quickstart Guide](https://supabase.com/docs/guides/functions/quickstart)
