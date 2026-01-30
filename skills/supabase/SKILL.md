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
| RLS Security       | `references/db-rls-*.md`         | Row Level Security policies, common mistakes   |
| Connection Pooling | `references/db-conn-pooling.md`  | Transaction vs Session mode, port 6543 vs 5432 |
| Schema Design      | `references/db-schema-*.md`      | auth.users FKs, timestamps, JSONB, extensions  |
| Migrations         | `references/db-migrations-*.md`  | CLI workflows, idempotent patterns, db diff    |
| Performance        | `references/db-perf-*.md`        | Indexes (BRIN, GIN), query optimization        |
| Security           | `references/db-security-*.md`    | Service role key, security_definer functions   |

### Edge Functions

| Area                 | Resource                              | When to Use                                      |
| -------------------- | ------------------------------------- | ------------------------------------------------ |
| Quick Start          | `references/edge-fun-quickstart.md`   | Creating and deploying first function            |
| Project Structure    | `references/edge-fun-project-structure.md` | Directory layout, shared code, fat functions |
| JWT Authentication   | `references/edge-auth-jwt-verification.md` | JWT verification, jose library, middleware  |
| RLS Integration      | `references/edge-auth-rls-integration.md` | Passing auth context, user-scoped queries    |
| Database (supabase-js) | `references/edge-db-supabase-client.md` | Queries, inserts, RPC calls                  |
| Database (Direct)    | `references/edge-db-direct-postgres.md` | Postgres pools, Drizzle ORM                  |
| CORS                 | `references/edge-pat-cors.md`         | Browser requests, preflight handling             |
| Routing              | `references/edge-pat-routing.md`      | Multi-route functions, Hono framework            |
| Error Handling       | `references/edge-pat-error-handling.md` | Error responses, validation                    |
| Background Tasks     | `references/edge-pat-background-tasks.md` | waitUntil, async processing                  |
| Streaming            | `references/edge-adv-streaming.md`    | SSE, streaming responses                         |
| WebSockets           | `references/edge-adv-websockets.md`   | Bidirectional communication                      |
| Regional Invocation  | `references/edge-adv-regional.md`     | Region selection, latency optimization           |
| Testing              | `references/edge-dbg-testing.md`      | Deno tests, local testing                        |
| Limits & Debugging   | `references/edge-dbg-limits.md`       | Troubleshooting, runtime limits                  |

**CLI Usage:** Always use `npx supabase` instead of `supabase` for version consistency across team members.
