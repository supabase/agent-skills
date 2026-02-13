---
name: supabase
description: Guides and best practices for working with Supabase. Covers getting started, Auth, Database, Storage, Edge Functions, Realtime, supabase-js SDK, CLI, and MCP integration. Use for any Supabase-related questions.
license: MIT
metadata:
  author: supabase
  version: '1.0.0'
  organization: Supabase
  date: January 2026
  abstract: Comprehensive Supabase development guide for building applications with Supabase services. Contains guides covering Auth, Database, Storage, Edge Functions, Realtime, client libraries, CLI, and tooling. Each reference includes setup instructions, code examples, common mistakes, and integration patterns.
---

# Supabase

Supabase is an open source Firebase alternative that provides a Postgres database, authentication, instant APIs, edge functions, realtime subscriptions, and storage. It's fully compatible with Postgres and provides several language sdks, including supabase-js and supabase-py.

## Overview of Resources

Reference the appropriate resource file based on the user's needs:

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

**CLI Usage:** Always use `npx supabase` instead of `supabase` for version consistency across team members.

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
