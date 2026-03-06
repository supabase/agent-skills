---
title: Supabase Remote MCP Server Setup
tags: mcp, setup, configuration, oauth, security, remote, cursor, claude-code, vscode, windsurf, codex, gemini, goose, factory, opencode, kiro
---

## Supabase MCP Server Setup

### Local MCP Server

The local stack automatically exposes an MCP server at `http://127.0.0.1:54321/mcp` when running `npx supabase start`. No extra configuration is required — configure your AI client with this URL the same way as the remote server. DDL via `execute_sql` is allowed on the local MCP server. See [dev-local-workflow.md](dev-local-workflow.md).

### Remote MCP Server

The Supabase remote MCP server (`mcp.supabase.com`) provides authenticated access to **remote Supabase projects** for schema changes via `apply_migration`, database queries, logs, and advisors.

**Incorrect:**

```text
# No read_only, no project scoping
https://mcp.supabase.com/mcp
# Agents can write to any project in the account
```

**Correct:**

```text
# Read-only by default, scoped to a single project
https://mcp.supabase.com/mcp?read_only=true&project_ref=abc123
```

Always include `read_only=true` by default. Only remove it when the user explicitly needs write operations (e.g. `apply_migration`). This prevents accidental writes to the remote database.

## Self-Configuration for Agents

If no Supabase MCP tools are detected when a remote project interaction is needed:

1. Check if the Supabase MCP server is already configured
2. Identify which AI client you are running in
3. Write the matching config from [Client Configuration](#client-configuration) below
4. If your client is not listed, fetch the configuration from the [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp#step-2-configure-your-ai-tool)
5. **STOP.** Do not continue working. Inform the user that:
   - The MCP configuration has been written
   - They must authenticate with the Supabase MCP server before the agent can use it
   - Authentication requires a browser-based OAuth flow — the user must open their browser, log in to Supabase, and grant access to the MCP client
   - They may need to restart their client or reload the MCP server after authenticating
   - Once authenticated, they should confirm back so the agent can proceed

## Client Configuration

Replace `<URL>` with the MCP server URL. Always include `read_only=true` unless the user explicitly needs write operations.

Default URL: `https://mcp.supabase.com/mcp?read_only=true&project_ref=<PROJECT_REF>`

If the user needs write operations (e.g. `apply_migration`): `https://mcp.supabase.com/mcp?project_ref=<PROJECT_REF>`

---

### Cursor

File: `.cursor/mcp.json`

```json
{ "mcpServers": { "supabase": { "url": "<URL>" } } }
```

---

### Claude Code

Run:

```bash
claude mcp add --scope project --transport http supabase "<URL>"
```

Then authenticate in a regular terminal (not IDE extension): `claude /mcp` → select "supabase" → "Authenticate".

Or write `.mcp.json`:

```json
{ "mcpServers": { "supabase": { "type": "http", "url": "<URL>" } } }
```

---

### VS Code

File: `.vscode/mcp.json` — uses `servers` not `mcpServers`:

```json
{ "servers": { "supabase": { "type": "http", "url": "<URL>" } } }
```

---

### Windsurf

File: `~/.codeium/windsurf/mcp_config.json` — requires `mcp-remote` proxy (no native HTTP transport). Requires version `0.1.37+`.

```json
{ "mcpServers": { "supabase": { "command": "npx", "args": ["-y", "mcp-remote", "<URL>"] } } }
```

---

### Codex

Run:

```bash
codex mcp add supabase --url <URL>
```

Enable remote MCP in `~/.codex/config.toml`:

```toml
[features]
rmcp_client = true
```

Authenticate: `codex mcp login supabase`

Or write `~/.codex/config.toml` — uses `mcp_servers` (underscore):

```json
{ "mcp_servers": { "supabase": { "url": "<URL>" } } }
```

---

### Gemini CLI

Requires version `0.20.2+`. Run:

```bash
gemini mcp add -t http supabase <URL>
```

Authenticate: `/mcp auth supabase`

Or write `.gemini/settings.json` — uses `httpUrl` not `url`:

```json
{ "mcpServers": { "supabase": { "httpUrl": "<URL>" } } }
```

---

### Goose

File: `~/.config/goose/config.yaml` — uses `extensions` with `uri` and `type: streamable_http`:

```yaml
extensions:
  supabase:
    type: streamable_http
    uri: <URL>
    enabled: true
    timeout: 300
```

Or run: `goose session --with-streamable-http-extension "<URL>"`

---

### Factory

Run:

```bash
droid mcp add supabase <URL> --type http
```

Restart Factory or type `/mcp` within droid to complete OAuth.

Or write `~/.factory/mcp.json`:

```json
{ "mcpServers": { "supabase": { "type": "http", "url": "<URL>" } } }
```

---

### OpenCode

File: `~/.config/opencode/opencode.json` — uses `mcp` not `mcpServers`, with `type: "remote"`:

```json
{ "$schema": "https://opencode.ai/config.json", "mcp": { "supabase": { "type": "remote", "url": "<URL>", "enabled": true } } }
```

Authenticate: `opencode mcp auth supabase`

---

### Kiro

File: `~/.kiro/settings/mcp.json`

```json
{ "mcpServers": { "supabase": { "type": "http", "url": "<URL>" } } }
```

---

### Client Not Listed

If the client you are running in is not listed above, fetch the configuration from the [Supabase MCP documentation](https://supabase.com/docs/guides/getting-started/mcp#step-2-configure-your-ai-tool) using `search_docs` or by reading the page directly.

---

### After Writing the Configuration

**STOP. Do not attempt to use MCP tools yet.** The user must authenticate first. Tell the user:

1. The MCP configuration file has been written
2. They need to authenticate with the Supabase MCP server — a browser window will open to log in to Supabase and grant access
3. They may need to restart their client or reload the MCP server connection after authenticating
4. Ask them to confirm once authentication is complete so you can proceed

The agent cannot use any MCP tools until the user completes authentication.

---

## What MCP Provides

All tools interact exclusively with remote Supabase projects. See [dev-mcp-tools.md](dev-mcp-tools.md) for the full tool reference.

| Tool | Purpose |
| --- | --- |
| `execute_sql` | Run non-schema-changing SQL against the remote database |
| `get_logs` | Retrieve service logs (postgres, api, edge-function, auth, storage, realtime) |
| `get_advisors` | Security and performance recommendations |
| `list_tables` | Inspect schema |
| `list_extensions` | Check installed extensions |
| `list_migrations` | View applied migrations |
| `apply_migration` | Apply schema changes as recorded migration (see [dev-mcp-tools.md](dev-mcp-tools.md)) |

## URL Parameters

| Parameter | Example | Default | Purpose |
| --- | --- | --- | --- |
| `read_only` | `read_only=true` | **Use by default** | Prevent all write operations. Only omit when user explicitly needs writes. |
| `project_ref` | `project_ref=abc123` | Recommended | Scope to single project |
| `features` | `features=database,debugging` | Optional | Restrict available tool groups (comma-separated) |

Combine: `https://mcp.supabase.com/mcp?read_only=true&project_ref=abc123`

### Feature Groups

All groups except `storage` are enabled by default. Use `features=` to restrict to specific groups.

| Group | Tools | Enabled by Default |
| --- | --- | --- |
| `database` | `execute_sql`, `apply_migration`, `list_tables`, `list_extensions`, `list_migrations` | Yes |
| `debugging` | `get_logs`, `get_advisors` | Yes |
| `development` | `get_project_url`, `get_publishable_keys`, `generate_typescript_types` | Yes |
| `functions` | `list_edge_functions`, `get_edge_function`, `deploy_edge_function` | Yes |
| `account` | `list_projects`, `get_project`, `list_organizations`, `get_organization`, `create_project`, `get_cost`, `confirm_cost`, `pause_project`, `restore_project` | Yes (disabled in project-scoped mode) |
| `docs` | `search_docs` | Yes |
| `branching` | `create_branch`, `list_branches`, `delete_branch`, `merge_branch`, `reset_branch`, `rebase_branch` | Yes (paid plan only) |
| `storage` | `list_storage_buckets`, `get_storage_config`, `update_storage_config` | **No** |

See [dev-mcp-tools.md](dev-mcp-tools.md) for full tool details, parameters, and usage guidance.

## Authentication

| Method | When to Use |
| --- | --- |
| Dynamic Client Registration | Default. Browser OAuth on first connect. |
| Personal Access Token (PAT) | CI/CD, GitHub Actions. Pass via `Authorization: Bearer <token>` header. |

PAT example for CI:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": { "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}" }
    }
  }
}
```

Not all clients support custom headers. For clients requiring an OAuth client ID/secret, create an OAuth app in Supabase Dashboard under Organization > OAuth Apps.

## Security Rules

1. **Never point at production.** Use development or staging projects only.
2. **Always include `read_only=true` by default.** Only remove it when the user explicitly needs write operations.
3. **Always scope with `project_ref`.** Without it, agents can access all projects in your account.
4. **Keep manual tool approval enabled.** Review every MCP tool call before execution.

## Prompt Injection Warning

Database records may contain malicious content that tricks LLMs into executing unintended tool calls. Supabase MCP wraps SQL results with instructions discouraging LLMs from following embedded commands, but this is not foolproof. Always review tool calls before approval.
