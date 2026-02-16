# Supabase

## Structure

```
supabase/
  SKILL.md       # Main skill file - read this first
  AGENTS.md      # This navigation guide
  CLAUDE.md      # Symlink to AGENTS.md
  references/    # Detailed reference files
```

## Usage

1. Read `SKILL.md` for the main skill instructions
2. Browse `references/` for detailed documentation on specific topics
3. Reference files are loaded on-demand - read only what you need

Guides and best practices for working with Supabase. Covers getting started, Auth, Database, Storage, Edge Functions, Realtime, supabase-js SDK, CLI, and MCP integration. Use for any Supabase-related questions.

## Development Guidance

**Before performing any Supabase development task, read the development reference files.** They define which tools to use, how to interact with Supabase instances, and the correct workflows for local and remote development. Getting these wrong leads to schema drift, migration conflicts, and broken deployments.

- **Which tool to use for each operation** — read [references/dev-cli-vs-mcp.md](references/dev-cli-vs-mcp.md)
- **New project or first-time setup** — read [references/dev-getting-started.md](references/dev-getting-started.md)
- **Local development workflow** (CLI migrations, psql debugging, type generation) — read [references/dev-local-workflow.md](references/dev-local-workflow.md)
- **Remote project interaction** (MCP queries, logs, advisors, deploying) — read [references/dev-remote-workflow.md](references/dev-remote-workflow.md)
- **CLI command details and pitfalls** — read [references/dev-cli-reference.md](references/dev-cli-reference.md)
- **MCP server configuration** — read [references/dev-mcp-setup.md](references/dev-mcp-setup.md)
- **MCP tool usage** (execute_sql, apply_migration, get_logs, get_advisors) — read [references/dev-mcp-tools.md](references/dev-mcp-tools.md)

When the user's project has no `supabase/` directory, start with [references/dev-getting-started.md](references/dev-getting-started.md). When it already exists, pick up from the appropriate workflow (local or remote) based on user intentions.

## Overview of Resources

Reference the appropriate resource file based on the user's needs.

### Development (read first)

**Read these files before any Supabase development task.** They define the correct tools, workflows, and boundaries for interacting with Supabase instances. Start here when setting up a project, running CLI or MCP commands, writing migrations, connecting to a database, or deciding which tool to use for an operation.

| Area            | Resource                            | When to Use                                                    |
| --------------- | ----------------------------------- | -------------------------------------------------------------- |
| Getting Started | `references/dev-getting-started.md` | New project setup, CLI install, first-time init                |
| Local Workflow  | `references/dev-local-workflow.md`  | Local development with CLI migrations and psql debugging       |
| Remote Workflow | `references/dev-remote-workflow.md` | Developing against hosted Supabase project using MCP           |
| CLI vs MCP      | `references/dev-cli-vs-mcp.md`     | Tool roles: CLI (schema), psql/MCP (debugging), SDK (app code) |
| CLI Reference   | `references/dev-cli-reference.md`  | CLI command details, best practices, pitfalls                  |
| MCP Setup       | `references/dev-mcp-setup.md`      | Configuring Supabase remote MCP server for hosted projects     |
| MCP Tools       | `references/dev-mcp-tools.md`      | execute_sql, apply_migration, get_logs, get_advisors           |

### Authentication & Security

Read when implementing sign-up, sign-in, OAuth, SSO, MFA, passwordless flows, auth hooks, or server-side auth patterns.

| Area               | Resource                            | When to Use                                              |
| ------------------ | ----------------------------------- | -------------------------------------------------------- |
| Auth Core          | `references/auth-core-*.md`        | Sign-up, sign-in, sessions, password reset               |
| OAuth/Social       | `references/auth-oauth-*.md`       | Google, GitHub, Apple login, PKCE flow                   |
| Enterprise SSO     | `references/auth-sso-*.md`         | SAML 2.0, enterprise identity providers                  |
| MFA                | `references/auth-mfa-*.md`         | TOTP authenticator apps, phone MFA, AAL levels           |
| Passwordless       | `references/auth-passwordless-*.md`| Magic links, email OTP, phone OTP                        |
| Auth Hooks         | `references/auth-hooks-*.md`       | Custom JWT claims, send email hooks (HTTP and SQL)       |
| Server-Side Auth   | `references/auth-server-*.md`      | Admin API, SSR with Next.js/SvelteKit, service role auth |

### Database

Read when designing tables, writing RLS policies, creating migrations, configuring connection pooling, or optimizing query performance.

| Area               | Resource                        | When to Use                                    |
| ------------------ | ------------------------------- | ---------------------------------------------- |
| RLS Security       | `references/db-rls-*.md`        | Row Level Security policies, common mistakes   |
| Connection Pooling | `references/db-conn-pooling.md` | Transaction vs Session mode, port 6543 vs 5432 |
| Schema Design      | `references/db-schema-*.md`     | auth.users FKs, timestamps, JSONB, extensions  |
| Migrations         | `references/db-migrations-*.md` | CLI workflows, idempotent patterns, db diff    |
| Performance        | `references/db-perf-*.md`       | Indexes (BRIN, GIN), query optimization        |
| Security           | `references/db-security-*.md`   | Service role key, security_definer functions   |

### Edge Functions

Read when creating, deploying, or debugging Deno-based Edge Functions — including authentication, database access, CORS, routing, streaming, and testing patterns.

| Area                   | Resource                              | When to Use                            |
| ---------------------- | ------------------------------------- | -------------------------------------- |
| Quick Start            | `references/edge-fun-quickstart.md`   | Creating and deploying first function  |
| Project Structure      | `references/edge-fun-project-structure.md` | Directory layout, shared code, fat functions |
| JWT Authentication     | `references/edge-auth-jwt-verification.md` | JWT verification, jose library, middleware |
| RLS Integration        | `references/edge-auth-rls-integration.md` | Passing auth context, user-scoped queries |
| Database (supabase-js) | `references/edge-db-supabase-client.md` | Queries, inserts, RPC calls          |
| Database (Direct)      | `references/edge-db-direct-postgres.md` | Postgres pools, Drizzle ORM          |
| CORS                   | `references/edge-pat-cors.md`         | Browser requests, preflight handling   |
| Routing                | `references/edge-pat-routing.md`      | Multi-route functions, Hono framework  |
| Error Handling         | `references/edge-pat-error-handling.md` | Error responses, validation          |
| Background Tasks       | `references/edge-pat-background-tasks.md` | waitUntil, async processing        |
| Streaming              | `references/edge-adv-streaming.md`    | SSE, streaming responses               |
| WebSockets             | `references/edge-adv-websockets.md`   | Bidirectional communication            |
| Regional Invocation    | `references/edge-adv-regional.md`     | Region selection, latency optimization |
| Testing                | `references/edge-dbg-testing.md`      | Deno tests, local testing              |
| Limits & Debugging     | `references/edge-dbg-limits.md`       | Troubleshooting, runtime limits        |

### Realtime

Read when implementing live updates — Broadcast messaging, Presence tracking, or Postgres Changes listeners.

| Area             | Resource                             | When to Use                                     |
| ---------------- | ------------------------------------ | ----------------------------------------------- |
| Channel Setup    | `references/realtime-setup-*.md`     | Creating channels, naming conventions, auth     |
| Broadcast        | `references/realtime-broadcast-*.md` | Client messaging, database-triggered broadcasts |
| Presence         | `references/realtime-presence-*.md`  | User online status, shared state tracking       |
| Postgres Changes | `references/realtime-postgres-*.md`  | Database change listeners (prefer Broadcast)    |
| Patterns         | `references/realtime-patterns-*.md`  | Cleanup, error handling, React integration      |

### SDK (supabase-js)

Read when writing application code that interacts with Supabase — client setup, queries, error handling, TypeScript types, or framework integration.

| Area            | Resource                        | When to Use                               |
| --------------- | ------------------------------- | ----------------------------------------- |
| Client Setup    | `references/sdk-client-*.md`    | Browser/server client, SSR, configuration |
| TypeScript      | `references/sdk-ts-*.md`        | Type generation, using Database types     |
| Query Patterns  | `references/sdk-query-*.md`     | CRUD, filters, joins, RPC calls           |
| Error Handling  | `references/sdk-error-*.md`     | Error types, retries, handling patterns   |
| SDK Performance | `references/sdk-perf-*.md`      | Query optimization, realtime cleanup      |
| Framework       | `references/sdk-framework-*.md` | Next.js App Router, middleware setup      |

### Storage

Read when implementing file uploads, downloads, image transformations, or configuring storage access control and CDN caching.

| Area            | Resource                              | When to Use                                    |
| --------------- | ------------------------------------- | ---------------------------------------------- |
| Access Control  | `references/storage-access-control.md`| Bucket policies, RLS for storage               |
| Standard Upload | `references/storage-upload-standard.md`| File uploads up to 5GB                         |
| Resumable Upload| `references/storage-upload-resumable.md`| Large file uploads with TUS protocol          |
| Downloads       | `references/storage-download-urls.md` | Public URLs, signed URLs, download methods     |
| Transformations | `references/storage-transform-images.md`| Image resize, crop, format conversion         |
| CDN & Caching   | `references/storage-cdn-caching.md`   | Cache control, Smart CDN, stale content        |
| File Operations | `references/storage-ops-file-management.md`| Move, copy, delete, list files             |

## Supabase Documentation

When something is not clear or you need to verify information, reference the official Supabase documentation — it is the source of truth. Available in plain text for easy fetching:

```bash
# Index of all available docs
curl https://supabase.com/llms.txt

# Fetch all guides as plain text
curl https://supabase.com/llms/guides.txt

# Fetch JavaScript SDK reference
curl https://supabase.com/llms/js.txt
```

Full documentation: [https://supabase.com/docs](https://supabase.com/docs)
