---
title: Edge Function Development Workflow
impact: HIGH
impactDescription: CLI-only workflow for creating, testing, and deploying Edge Functions
tags: functions, workflow, deploy, cli
---

## Edge Function Development Workflow

All Edge Function operations use CLI. Scaffold locally, test with `functions serve`, deploy with `functions deploy`.

**Incorrect:**

```bash
# Deploying without local testing
npx supabase functions deploy api-handler
# Function fails in production - untested code
```

**Correct:**

```bash
# 1. Scaffold (CLI)
npx supabase functions new api-handler

# 2. Test locally (CLI)
npx supabase functions serve api-handler
# Test: curl http://localhost:54321/functions/v1/api-handler

# 3. Set secrets (CLI)
npx supabase secrets set STRIPE_KEY=sk_live_...

# 4. Deploy (CLI)
npx supabase functions deploy api-handler

# 5. Debug if needed (MCP)
get_logs({ project_id: "ref", service: "edge_functions" })
```

## Workflow Steps

| Step | Tool | Command | Purpose |
| --- | --- | --- | --- |
| 1 | CLI | `functions new` | Scaffold function |
| 2 | CLI | `functions serve` | Local dev/test |
| 3 | CLI | `secrets set` | Set production secrets |
| 4 | CLI | `functions deploy` | Deploy to production |
| 5 | MCP | `get_logs` | Debug if needed |

## Related

- [../cli-functions-commands.md](../cli-functions-commands.md) - Function CLI reference
- [../cli-secrets-commands.md](../cli-secrets-commands.md) - Set secrets
- [../cli-project-commands.md](../cli-project-commands.md) - Link before deploy
