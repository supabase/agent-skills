# Supabase Skills Test Scenarios

## Overview

Pattern-based test scenarios for evaluating AI-generated code against Supabase skill reference files. Adapted from the [microsoft-skills test harness](https://github.com/microsoft/skills) pattern (1,114+ scenarios across 123+ Azure SDK skills).

## Scenario Format

Each scenario YAML follows this structure:

```yaml
config:
  model: gpt-4
  max_tokens: 2000
  temperature: 0.3

scenarios:
  - name: scenario_name
    prompt: "What the LLM should generate"
    expected_patterns:
      - "pattern that MUST appear in output"
    forbidden_patterns:
      - "anti-pattern that MUST NOT appear"
    tags: [category, priority]
    mock_response: |
      # Hand-crafted correct response for deterministic CI
```

## Current Scenarios

| File | Category | Scenarios | Source References |
|------|----------|-----------|------------------|
| `supabase/tooling.scenarios.yaml` | MCP vs CLI tool selection | 5 | `tooling-tool-selection.md`, `tooling-tool-overlap.md`, `tooling-workflow-local-dev.md` |
| `supabase/edge-functions.scenarios.yaml` | Edge Function patterns | 5 | `edge-fun-quickstart.md`, `edge-auth-jwt-verification.md`, `edge-pat-cors.md`, `edge-db-supabase-client.md`, `edge-pat-routing.md` |

## Tags

| Tag | Meaning |
|-----|---------|
| `tool:mcp` | Tests MCP tool usage patterns |
| `tool:cli` | Tests CLI command patterns |
| `tool:both` | Tests combined MCP+CLI workflows |
| `edge-functions` | Edge Function specific |
| `env:local` | Requires local Docker stack (`supabase start`) |
| `env:cloud` | Requires cloud project + access token |
| `env:any` | Works in any environment |
| `priority:p0` | Critical — must always pass |

## MCP Authentication for CI

For headless/CI environments, configure the MCP server with an access token:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

**Local development** (no auth needed): `http://127.0.0.1:54321/mcp` after `supabase start`.

## Testing Philosophy

**MCP first, CLI for local-only.** When both MCP and CLI can do the same operation, scenarios should validate that MCP is preferred:

| Preferred (MCP) | Fallback (CLI) | When CLI |
|-----------------|----------------|----------|
| `list_migrations()` | `supabase migration list` | MCP not connected |
| `execute_sql()` | N/A (psql) | MCP not available |
| `deploy_edge_function()` | `supabase functions deploy` | Local testing |
| `list_projects()` | `supabase projects list` | MCP not connected |

CLI-only operations (no MCP equivalent): `supabase init`, `supabase start`, `supabase db diff`, `supabase migration new`, `supabase functions serve`.
