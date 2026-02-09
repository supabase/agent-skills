---
title: Edge Functions Quick Start
impact: CRITICAL
impactDescription: Foundation for all Edge Function development
tags: edge-functions, quickstart, deployment, cli, deno
---

## Edge Functions Quick Start

Create and deploy serverless TypeScript functions that run globally at the edge on Deno runtime. Functions use `Deno.serve()` as the handler and have automatic access to environment variables like `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

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
// Handle JSON parsing errors gracefully
Deno.serve(async (req) => {
  try {
    const { name } = await req.json();
    return new Response(JSON.stringify({ message: `Hello ${name}!` }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
});
```

CLI workflow: `npx supabase functions new hello-world`, then `npx supabase functions serve` for local dev, and `npx supabase functions deploy hello-world` for production (after `npx supabase link --project-ref PROJECT_ID`).

Reference: [Quickstart Guide](https://supabase.com/docs/guides/functions/quickstart)
