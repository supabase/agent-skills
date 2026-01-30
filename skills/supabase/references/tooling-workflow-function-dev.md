---
title: Edge Function Development Workflow
impact: HIGH
impactDescription: Develop locally with CLI, deploy with MCP for fastest iteration
tags: functions, workflow, deploy
---

## Edge Function Development Workflow

Develop and test Edge Functions locally with CLI, deploy with MCP. CLI scaffolds and serves functions, MCP deploys without requiring local Docker for deployment.

**Incorrect:**

```bash
# Deploy without local testing
deploy_edge_function({
  project_id: "ref",
  name: "api-handler",
  files: [{ content: "untested code..." }]
})
# Function fails in production
```

**Correct:**

```bash
# 1. Scaffold (CLI)
supabase functions new api-handler

# 2. Test locally (CLI)
supabase functions serve api-handler
# Test: curl http://localhost:54321/functions/v1/api-handler

# 3. Set secrets (CLI)
supabase secrets set STRIPE_KEY=sk_live_...

# 4. Deploy (MCP preferred when connected)
deploy_edge_function({
  project_id: "ref",
  name: "api-handler",
  verify_jwt: true,
  files: [{ name: "index.ts", content: "..." }]
})
```

## Workflow Steps

| Step | Tool | Command/Tool | Purpose |
|------|------|--------------|---------|
| 1 | CLI | `functions new` | Scaffold function |
| 2 | CLI | `functions serve` | Local dev/test |
| 3 | CLI | `secrets set` | Set production secrets |
| 4 | MCP | `deploy_edge_function` | Deploy to production |
| 5 | MCP | `get_logs` | Debug if needed |

## MCP vs CLI Deploy

| MCP `deploy_edge_function` | CLI `functions deploy` |
|---------------------------|------------------------|
| No local Docker needed | Requires local files |
| Deploy from any content | Deploys local files |
| Faster for quick updates | Better for CI/CD |

Both work. MCP preferred when connected.

## Related CLI Commands

- [../cli/functions-new.md](../cli/functions-new.md) - Scaffold function
- [../cli/functions-serve.md](../cli/functions-serve.md) - Local development
- [../cli/functions-deploy.md](../cli/functions-deploy.md) - CLI deployment
- [../cli/secrets-set.md](../cli/secrets-set.md) - Set secrets
