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

### Database

| Area               | Resource                         | When to Use                                    |
| ------------------ | -------------------------------- | ---------------------------------------------- |
| RLS Security       | `references/db-rls-*.md`        | Row Level Security policies, common mistakes   |
| Connection Pooling | `references/db-conn-pooling.md` | Transaction vs Session mode, port 6543 vs 5432 |
| Schema Design      | `references/db-schema-*.md`     | auth.users FKs, timestamps, JSONB, extensions  |
| Migrations         | `references/db-migrations-*.md` | CLI workflows, idempotent patterns, db diff    |
| Performance        | `references/db-perf-*.md`       | Indexes (BRIN, GIN), query optimization        |
| Security           | `references/db-security-*.md`   | Service role key, security_definer functions   |

### CLI Commands

| Area       | Resource                                 | When to Use                                         |
| ---------- | ---------------------------------------- | --------------------------------------------------- |
| Project    | `references/cli-project-commands.md`     | init, start, stop, status, link, login              |
| Database   | `references/cli-database-commands.md`    | push, pull, diff, reset, dump                       |
| Migrations | `references/cli-migration-commands.md`   | new, list, fetch, repair, squash                    |
| Functions  | `references/cli-functions-commands.md`   | new, serve, deploy                                  |
| Secrets    | `references/cli-secrets-commands.md`     | set, list                                           |
| Generation | `references/cli-generation-commands.md`  | gen types                                           |
| Decisions  | `references/cli-decision-guide.md`       | pull vs diff, push vs up, targeting, --experimental |
| Gotchas    | `references/cli-gotchas-pitfalls.md`     | Common mistakes, edge cases, troubleshooting        |

### MCP Setup

| Area           | Resource                            | When to Use                                          |
| -------------- | ----------------------------------- | ---------------------------------------------------- |
| Configuration  | `references/mcp-setup-*.md`        | Configuring MCP connection, security, feature groups |

### MCP + CLI Workflows

| Area               | Resource                             | When to Use                                         |
| ------------------ | ------------------------------------ | --------------------------------------------------- |
| Tool Selection     | `references/tooling-tool-*.md`      | MCP vs CLI decision, capability comparison          |
| Combined Workflows | `references/tooling-workflow-*.md`  | Local dev, migrations, type gen, function workflows |

### Authentication

| Area               | Resource                               | When to Use                                        |
| ------------------ | -------------------------------------- | -------------------------------------------------- |
| Sign-up/Sign-in    | `references/auth-core-*.md`           | Email/password signup, signin, session management  |
| OAuth              | `references/auth-oauth-*.md`          | Social login, PKCE flow                            |
| MFA                | `references/auth-mfa-*.md`            | TOTP, phone verification                           |
| Passwordless       | `references/auth-passwordless-*.md`   | Magic links, OTP                                   |
| SSO                | `references/auth-sso-*.md`            | SAML SSO configuration                             |
| Hooks              | `references/auth-hooks-*.md`          | Custom claims, send email hooks                    |
| Server-side        | `references/auth-server-*.md`         | SSR auth, admin API                                |

### Edge Functions

| Area           | Resource                          | When to Use                                         |
| -------------- | --------------------------------- | --------------------------------------------------- |
| Fundamentals   | `references/edge-fun-*.md`       | Quickstart, project structure                       |
| Auth & JWT     | `references/edge-auth-*.md`      | JWT verification, RLS integration                   |
| Database       | `references/edge-db-*.md`        | Supabase client, direct Postgres                    |
| Patterns       | `references/edge-pat-*.md`       | CORS, routing, error handling, background tasks     |
| Advanced       | `references/edge-adv-*.md`       | Streaming, WebSockets, regional invocations         |
| Debug & Limits | `references/edge-dbg-*.md`       | Testing, resource limits                            |

### SDK (supabase-js)

| Area           | Resource                          | When to Use                                  |
| -------------- | --------------------------------- | -------------------------------------------- |
| Client Setup   | `references/sdk-client-*.md`     | Browser/server initialization, config        |
| Queries        | `references/sdk-query-*.md`      | CRUD, filters, joins, RPC                    |
| TypeScript     | `references/sdk-ts-*.md`         | Type generation and usage                    |
| Performance    | `references/sdk-perf-*.md`       | Query and realtime optimization              |
| Error Handling | `references/sdk-error-handling.md`| Error patterns and recovery                 |
| Frameworks     | `references/sdk-framework-*.md`  | Next.js integration                          |

### Storage

| Area           | Resource                               | When to Use                                   |
| -------------- | -------------------------------------- | --------------------------------------------- |
| Access Control | `references/storage-access-control.md` | Bucket policies, RLS for storage              |
| Uploads        | `references/storage-upload-*.md`       | Standard and resumable uploads                |
| Downloads      | `references/storage-download-urls.md`  | Public URLs, signed URLs                      |
| Transforms     | `references/storage-transform-*.md`    | Image transformations                         |
| CDN            | `references/storage-cdn-caching.md`    | CDN caching strategies                        |
| File Ops       | `references/storage-ops-*.md`          | Move, copy, delete, list files                |

### Realtime

| Area             | Resource                             | When to Use                                     |
| ---------------- | ------------------------------------ | ----------------------------------------------- |
| Channel Setup    | `references/realtime-setup-*.md`     | Creating channels, naming conventions, auth     |
| Broadcast        | `references/realtime-broadcast-*.md` | Client messaging, database-triggered broadcasts |
| Presence         | `references/realtime-presence-*.md`  | User online status, shared state tracking       |
| Postgres Changes | `references/realtime-postgres-*.md`  | Database change listeners (prefer Broadcast)    |
| Patterns         | `references/realtime-patterns-*.md`  | Cleanup, error handling, React integration      |

### Vectors

| Area            | Resource                            | When to Use                                   |
| --------------- | ----------------------------------- | --------------------------------------------- |
| Setup           | `references/vectors-setup-*.md`    | pgvector installation and configuration       |
| Indexing        | `references/vectors-index-*.md`    | HNSW, IVFFlat index types                     |
| Search          | `references/vectors-search-*.md`   | Semantic and hybrid search                    |
| Embeddings      | `references/vectors-embed-*.md`    | Embedding generation patterns                 |
| RAG             | `references/vectors-rag-*.md`      | Retrieval-augmented generation                |
| Performance     | `references/vectors-perf-*.md`     | Vector query tuning                           |

**CLI Usage:** Always use `npx supabase` instead of `supabase` for version consistency across team members.
