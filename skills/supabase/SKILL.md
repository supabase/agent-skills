---
name: supabase
description: Guides and best practices for working with Supabase. Covers getting started, Auth, Database, Storage, Edge Functions, Realtime, supabase-js SDK, CLI, and MCP integration. Use for any Supabase-related questions.
license: MIT
metadata:
  author: supabase
  version: "1.0.0"
  organization: Supabase
  date: January 2026
  abstract: Comprehensive Supabase development guide for building applications with Supabase services. Contains guides covering Auth, Database, Storage, Edge Functions, Realtime, client libraries, CLI, and tooling. Each reference includes setup instructions, code examples, common mistakes, and integration patterns.
---

# Supabase

Supabase is an open source Firebase alternative that provides a Postgres database, authentication, instant APIs, edge functions, realtime subscriptions, and storage. It's fully compatible with Postgres and works with any language, framework, or ORM.

## Tool Priority

Prefer CLI commands (`npx supabase ...`) over MCP tools unless a reference file explicitly recommends MCP for a specific operation. MCP is configured for database and debugging features only, providing `execute_sql`, `get_logs`, and `get_advisors` (plus `list_tables`, `list_extensions`, `list_migrations`, `apply_migration`).

## Supabase Documentation

Always reference the Supabase documentation before making Supabase-related claims. The documentation is the source of truth for all Supabase-related information.

You can use the `curl` commands to fetch the documentation page as markdown:

**Documentation:**

```bash
# Fetch any doc page as markdown
curl -H "Accept: text/markdown" https://supabase.com/docs/<path>
```

## Overview of Resources

Reference the appropriate resource file based on the user's needs:

### Core Guides

| Area             | Resource                         | When to Use                                              |
| ---------------- | -------------------------------- | -------------------------------------------------------- |
| Getting Started  | `references/getting-started.md`  | Setting up a project, connection strings, dependencies   |
| Referencing Docs | `references/referencing-docs.md` | Looking up official documentation, verifying information |

### Authentication & Security

| Area               | Resource             | When to Use                                |
| ------------------ | -------------------- | ------------------------------------------ |
| Auth Overview      | `references/auth.md` | Authentication, social login, sessions     |
| Row Level Security | `references/rls.md`  | Database security policies, access control |

### Database

| Area               | Resource                        | When to Use                                    |
| ------------------ | ------------------------------- | ---------------------------------------------- |
| Database           | `references/database.md`        | Postgres queries, migrations, modeling         |
| RLS Security       | `references/db/rls-*.md`        | Row Level Security policies, common mistakes   |
| Connection Pooling | `references/db/conn-pooling.md` | Transaction vs Session mode, port 6543 vs 5432 |
| Schema Design      | `references/db/schema-*.md`     | auth.users FKs, timestamps, JSONB, extensions  |
| Migrations         | `references/db/migrations-*.md` | CLI workflows, idempotent patterns, db diff    |
| Performance        | `references/db/perf-*.md`       | Indexes (BRIN, GIN), query optimization        |
| Security           | `references/db/security-*.md`   | Service role key, security_definer functions   |

### Storage & Media

| Area    | Resource                | When to Use                  |
| ------- | ----------------------- | ---------------------------- |
| Storage | `references/storage.md` | File uploads, buckets, media |

### Edge Functions

| Area           | Resource                       | When to Use                                  |
| -------------- | ------------------------------ | -------------------------------------------- |
| Edge Functions | `references/edge-functions.md` | Serverless functions, Deno runtime, webhooks |

### Realtime

| Area     | Resource                 | When to Use                                  |
| -------- | ------------------------ | -------------------------------------------- |
| Realtime | `references/realtime.md` | Real-time subscriptions, presence, broadcast |

### Client Libraries

| Area        | Resource                    | When to Use                              |
| ----------- | --------------------------- | ---------------------------------------- |
| supabase-js | `references/supabase-js.md` | JavaScript/TypeScript SDK, client config |

### CLI Commands

| Area       | Resource                                | When to Use                                    |
| ---------- | --------------------------------------- | ---------------------------------------------- |
| Project    | `references/cli/project-commands.md`    | init, start, stop, status, link, login         |
| Database   | `references/cli/database-commands.md`   | push, pull, diff, reset, dump                  |
| Migrations | `references/cli/migration-commands.md`  | new, list, fetch, repair, squash               |
| Functions  | `references/cli/functions-commands.md`  | new, serve, deploy                             |
| Secrets    | `references/cli/secrets-commands.md`    | set, list                                      |
| Generation | `references/cli/generation-commands.md` | gen types                                      |
| Decisions  | `references/cli/decision-guide.md`      | pull vs diff, push vs up, targeting, --experimental |
| Gotchas    | `references/cli/gotchas-pitfalls.md`    | Common mistakes, edge cases, troubleshooting   |

### MCP + CLI Workflows

| Area               | Resource                           | When to Use                                         |
| ------------------ | ---------------------------------- | --------------------------------------------------- |
| Tool Selection     | `references/tooling/tool-*.md`     | MCP vs CLI decision, capability comparison          |
| Combined Workflows | `references/tooling/workflow-*.md` | Local dev, migrations, type gen, function workflows |

### MCP Setup

| Area      | Resource                    | When to Use                                          |
| --------- | --------------------------- | ---------------------------------------------------- |
| MCP Setup | `references/mcp/setup-*.md` | Configuring MCP connection, security, feature groups |
