# Supabase

## Structure

```
supabase/
  SKILL.md       # Main skill file
  AGENTS.md      # This file (CLAUDE.md is a symlink)
  references/    # Detailed reference files
```

## Usage

1. Browse `references/` for detailed documentation on specific topics
2. Reference files are loaded on-demand - read only what you need

## Overview

Guides and best practices for working with Supabase. Covers getting started, Auth, Database, Storage, Edge Functions, Realtime, supabase-js SDK, CLI, and MCP integration. Use for any Supabase-related questions.

## Overview of Resources

Reference the appropriate resource file based on the user's needs:

### Authentication & Security

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

| Area               | Resource                        | When to Use                                    |
| ------------------ | ------------------------------- | ---------------------------------------------- |
| RLS Security       | `references/db-rls-*.md`        | Row Level Security policies, common mistakes   |
| Connection Pooling | `references/db-conn-pooling.md` | Transaction vs Session mode, port 6543 vs 5432 |
| Schema Design      | `references/db-schema-*.md`     | auth.users FKs, timestamps, JSONB, extensions  |
| Migrations         | `references/db-migrations-*.md` | CLI workflows, idempotent patterns, db diff    |
| Performance        | `references/db-perf-*.md`       | Indexes (BRIN, GIN), query optimization        |
| Security           | `references/db-security-*.md`   | Service role key, security_definer functions   |

### Edge Functions

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

| Area             | Resource                             | When to Use                                     |
| ---------------- | ------------------------------------ | ----------------------------------------------- |
| Channel Setup    | `references/realtime-setup-*.md`     | Creating channels, naming conventions, auth     |
| Broadcast        | `references/realtime-broadcast-*.md` | Client messaging, database-triggered broadcasts |
| Presence         | `references/realtime-presence-*.md`  | User online status, shared state tracking       |
| Postgres Changes | `references/realtime-postgres-*.md`  | Database change listeners (prefer Broadcast)    |
| Patterns         | `references/realtime-patterns-*.md`  | Cleanup, error handling, React integration      |

### SDK (supabase-js)

| Area            | Resource                        | When to Use                               |
| --------------- | ------------------------------- | ----------------------------------------- |
| Client Setup    | `references/sdk-client-*.md`    | Browser/server client, SSR, configuration |
| TypeScript      | `references/sdk-ts-*.md`        | Type generation, using Database types     |
| Query Patterns  | `references/sdk-query-*.md`     | CRUD, filters, joins, RPC calls           |
| Error Handling  | `references/sdk-error-*.md`     | Error types, retries, handling patterns   |
| SDK Performance | `references/sdk-perf-*.md`      | Query optimization, realtime cleanup      |
| Framework       | `references/sdk-framework-*.md` | Next.js App Router, middleware setup      |

### Storage

| Area            | Resource                              | When to Use                                    |
| --------------- | ------------------------------------- | ---------------------------------------------- |
| Access Control  | `references/storage-access-control.md`| Bucket policies, RLS for storage               |
| Standard Upload | `references/storage-upload-standard.md`| File uploads up to 5GB                         |
| Resumable Upload| `references/storage-upload-resumable.md`| Large file uploads with TUS protocol          |
| Downloads       | `references/storage-download-urls.md` | Public URLs, signed URLs, download methods     |
| Transformations | `references/storage-transform-images.md`| Image resize, crop, format conversion         |
| CDN & Caching   | `references/storage-cdn-caching.md`   | Cache control, Smart CDN, stale content        |
| File Operations | `references/storage-ops-file-management.md`| Move, copy, delete, list files             |

### Development

| Area            | Resource                            | When to Use                                                    |
| --------------- | ----------------------------------- | -------------------------------------------------------------- |
| Getting Started | `references/dev-getting-started.md` | New project setup, CLI install, first-time init                |
| MCP Setup       | `references/dev-mcp-setup.md`      | Configuring Supabase remote MCP server for hosted projects     |
| CLI Reference   | `references/dev-cli-reference.md`  | CLI command details, best practices, pitfalls                  |
| MCP Tools       | `references/dev-mcp-tools.md`      | execute_sql, apply_migration, get_logs, get_advisors           |
| CLI vs MCP      | `references/dev-cli-vs-mcp.md`     | Choosing between CLI+psql (local) and MCP (remote)             |
| Local Workflow  | `references/dev-local-workflow.md`  | Developing with local Supabase stack using CLI and psql        |
| Remote Workflow | `references/dev-remote-workflow.md` | Developing against hosted Supabase project using MCP           |

## Development Guidance

Supabase development uses different tools depending on the environment:

- **Local development** — Use the **CLI** (`npx supabase`) for project management, migrations, and deployment. Use **`psql`** to interact with the local Postgres database (queries, schema iteration, debugging). The local database connection string is available via `npx supabase status`.
- **Remote project interaction** — Use the **Supabase remote MCP server** (`mcp.supabase.com`). If no Supabase MCP tools are available, check whether the MCP server is configured for the project. If not, fetch the configuration from [Supabase MCP client configuration](https://supabase.com/docs/guides/getting-started/mcp#step-2-configure-your-ai-tool), configure it for the current AI tool, and ask the user to authenticate via the browser OAuth flow. See [dev-mcp-setup.md](references/dev-mcp-setup.md) for details.

When the user's project has no `supabase/` directory, start with the getting-started guide. When it already exists, pick up from the appropriate workflow (local or remote) based on user intentions.

- **CLI is the default tool for local development.** All commands prefixed with `npx supabase`.
- **`psql` is for database interaction locally.** Use it to run queries, iterate on schema, debug, and explore data against the local Postgres instance.
- **MCP is for remote project interaction.** Use `execute_sql` for non-schema-changing SQL (queries, data exploration, debugging). Use `get_logs` and `get_advisors` for debugging and health checks.
- **Schema changes go through migrations.** Locally, iterate with `psql`, capture with `npx supabase db diff -f "name"`, verify with `npx supabase db reset`.
- **Deploy migrations with `npx supabase db push`.** Always ask for user permission before pushing to the remote project. Only use MCP `apply_migration` as a last resort for schema mismatch issues that CLI cannot resolve.
- **After any schema change:** Generate types with `npx supabase gen types`.

## Supabase Documentation

Everytime something is not clear, or you want to double-check something, reference the official Supabase documentation. It is the source of truth for all things Supabase and is regularly updated with the latest information, best practices, and examples. - [Supabase Documentation](https://supabase.com/docs). The documentation is available in html format on the website, but you can also fetch plain text versions of specific sections using the following endpoints:

**Documentation:**

```bash
# Index of all available docs
curl https://supabase.com/llms.txt

# Fetch all guides as plain text
curl https://supabase.com/llms/guides.txt

# Fetch JavaScript SDK reference
curl https://supabase.com/llms/js.txt
```

## Reference Categories

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Authentication | CRITICAL | `auth-` |
| 2 | Database | CRITICAL | `db-` |
| 3 | Development | CRITICAL | `dev-` |
| 4 | Edge Functions | HIGH | `edge-` |
| 5 | SDK | HIGH | `sdk-` |
| 6 | Realtime | MEDIUM-HIGH | `realtime-` |
| 7 | Storage | HIGH | `storage-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Authentication** (`auth-`):
- `references/auth-core-sessions.md`
- `references/auth-core-signin.md`
- `references/auth-core-signup.md`
- `references/auth-hooks-custom-claims.md`
- `references/auth-hooks-send-email-http.md`
- `references/auth-hooks-send-email-sql.md`
- `references/auth-mfa-phone.md`
- `references/auth-mfa-totp.md`
- `references/auth-oauth-pkce.md`
- `references/auth-oauth-providers.md`
- `references/auth-passwordless-magic-links.md`
- `references/auth-passwordless-otp.md`
- `references/auth-server-admin-api.md`
- `references/auth-server-ssr.md`
- `references/auth-sso-saml.md`

**Database** (`db-`):
- `references/db-conn-pooling.md`
- `references/db-migrations-diff.md`
- `references/db-migrations-idempotent.md`
- `references/db-migrations-testing.md`
- `references/db-perf-indexes.md`
- `references/db-perf-query-optimization.md`
- `references/db-rls-common-mistakes.md`
- `references/db-rls-mandatory.md`
- `references/db-rls-performance.md`
- `references/db-rls-policy-types.md`
- `references/db-rls-views.md`
- `references/db-schema-auth-fk.md`
- `references/db-schema-extensions.md`
- `references/db-schema-jsonb.md`
- `references/db-schema-realtime.md`
- `references/db-schema-timestamps.md`
- `references/db-security-functions.md`
- `references/db-security-service-role.md`

**Development** (`dev-`):
- `references/dev-cli-reference.md`
- `references/dev-cli-vs-mcp.md`
- `references/dev-getting-started.md`
- `references/dev-local-workflow.md`
- `references/dev-mcp-setup.md`
- `references/dev-mcp-tools.md`
- `references/dev-remote-workflow.md`

**Edge Functions** (`edge-`):
- `references/edge-adv-regional.md`
- `references/edge-adv-streaming.md`
- `references/edge-adv-websockets.md`
- `references/edge-auth-jwt-verification.md`
- `references/edge-auth-rls-integration.md`
- `references/edge-db-direct-postgres.md`
- `references/edge-db-supabase-client.md`
- `references/edge-dbg-limits.md`
- `references/edge-dbg-testing.md`
- `references/edge-fun-project-structure.md`
- `references/edge-fun-quickstart.md`
- `references/edge-pat-background-tasks.md`
- `references/edge-pat-cors.md`
- `references/edge-pat-error-handling.md`
- `references/edge-pat-routing.md`

**Realtime** (`realtime-`):
- `references/realtime-broadcast-basics.md`
- `references/realtime-broadcast-database.md`
- `references/realtime-patterns-cleanup.md`
- `references/realtime-patterns-debugging.md`
- `references/realtime-patterns-errors.md`
- `references/realtime-postgres-changes.md`
- `references/realtime-presence-tracking.md`
- `references/realtime-setup-auth.md`
- `references/realtime-setup-channels.md`

**SDK** (`sdk-`):
- `references/sdk-client-browser.md`
- `references/sdk-client-config.md`
- `references/sdk-client-server.md`
- `references/sdk-error-handling.md`
- `references/sdk-framework-nextjs.md`
- `references/sdk-perf-queries.md`
- `references/sdk-perf-realtime.md`
- `references/sdk-query-crud.md`
- `references/sdk-query-filters.md`
- `references/sdk-query-joins.md`
- `references/sdk-query-rpc.md`
- `references/sdk-ts-generation.md`
- `references/sdk-ts-usage.md`

**Storage** (`storage-`):
- `references/storage-access-control.md`
- `references/storage-cdn-caching.md`
- `references/storage-download-urls.md`
- `references/storage-ops-file-management.md`
- `references/storage-transform-images.md`
- `references/storage-upload-resumable.md`
- `references/storage-upload-standard.md`

---

*84 reference files across 7 categories*