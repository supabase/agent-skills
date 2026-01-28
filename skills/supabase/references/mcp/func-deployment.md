---
title: MCP Edge Function Deployment
impact: MEDIUM
impactDescription: Deploy Edge Functions with correct configuration and security
tags: mcp, edge-functions, deploy, deno
---

## MCP Edge Function Deployment

Deploy Edge Functions via MCP using `deploy_edge_function`. Functions run on Deno runtime with pre-configured Supabase secrets. Always enable `verify_jwt: true` unless the function has custom authentication or is a webhook endpoint. Use `jsr:` or `npm:` prefixes with explicit versions for all external dependencies.

**Incorrect:**

```typescript
// Disable JWT verification without reason
deploy_edge_function({
  project_id: "ref",
  name: "api-handler",
  verify_jwt: false,  // Exposes function publicly!
  files: [{ name: "index.ts", content: "..." }]
});

// Missing version in import
import { z } from "zod";  // Error: no version
```

Disabling JWT verification exposes function publicly. Missing import versions fail.

**Correct:**

```typescript
// Enable JWT verification (default, recommended)
deploy_edge_function({
  project_id: "ref",
  name: "api-handler",
  entrypoint_path: "index.ts",
  verify_jwt: true,  // Requires valid JWT
  files: [{
    name: "index.ts",
    content: `
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.22.4";  // Explicit version

Deno.serve(async (req) => {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
`
  }]
});
```

Enable JWT verification, use versioned imports.

## Pre-configured Secrets

All functions have access to:
- `SUPABASE_URL` - Project API URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `SUPABASE_DB_URL` - Database connection

## Related

- [debug-logs-advisors.md](debug-logs-advisors.md) - Function logs
- [Docs](https://supabase.com/docs/guides/functions) - Edge Functions guide
