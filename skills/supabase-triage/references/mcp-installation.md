---
title: Installing the Supabase MCP Server (or Diagnosing Without It)
impact: HIGH
impactDescription: Unlocks get_logs/execute_sql/get_advisors for live triage instead of curated-text-only diagnosis
tags: mcp, setup, logs, studio, installation
---

## Check before assuming it's missing

Tool availability can vary by client and session. Before telling the user the MCP isn't installed, confirm `get_logs`, `execute_sql`, or `get_advisors` really aren't in your available tools — don't assume from a prior turn.

## Installing the Supabase MCP server

The MCP server is `@supabase/mcp-server-supabase`, run via `npx`. It needs a Supabase [personal access token](https://supabase.com/dashboard/account/tokens) and (recommended) a `--project-ref` to scope it to one project and `--read-only` to keep it non-destructive.

**Claude Code (CLI):**
```bash
claude mcp add supabase -- npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=<project-ref>
```
Then set `SUPABASE_ACCESS_TOKEN` when prompted, or pass it via `--access-token=<token>`.

**Claude Desktop / Cursor / Windsurf (`mcp.json` / `claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=<project-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
      }
    }
  }
}
```

**Where to find `<project-ref>`:** the subdomain in the project's dashboard URL (`https://supabase.com/dashboard/project/<project-ref>`).

**Where to find a personal access token:** [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) — "Generate new token".

After adding, restart the client (or start a new Claude Code session) so it picks up the new server, then confirm `get_logs`/`execute_sql`/`get_advisors` show up as available tools.

Full docs: [supabase.com/docs/guides/ai-tools/mcp](https://supabase.com/docs/guides/ai-tools/mcp).

## If they'd rather not install it: doing it manually in Supabase Studio

Everything the MCP tools would fetch is also in the dashboard. Point the user here per check:

**Logs (`get_logs` equivalent):**
1. Open the project in [supabase.com/dashboard](https://supabase.com/dashboard) → **Logs** in the left sidebar.
2. Pick the relevant service tab (API, Postgres, Auth, Realtime, Storage, Edge Functions).
3. Use the search bar or the built-in Log Explorer SQL editor to filter — the same `logFilterHints` strings from `diagnostics.json` work as free-text search terms here.
4. Logs default to the last 24h/7d depending on plan; widen the time range picker top-right if nothing shows.

**Read-only SQL (`execute_sql` equivalent):**
1. **SQL Editor** in the left sidebar → **New query**.
2. Paste the exact query from `diagnostics.json`'s `sqlQueries` (or `references/*.md`'s "SQL to run" snippet, only if it's plain Postgres, not BigQuery/Logflare dialect) → **Run**.

**Advisors (`get_advisors` equivalent):**
1. **Advisors** in the left sidebar (under Database or Security, depending on dashboard version).
2. Select the **Security** or **Performance** tab matching the `advisorTypes` for the category.
3. Review flagged findings against the candidate causes.

This gets the same evidence the MCP tools would return — just requires the user to copy results back into the conversation for you to read.
