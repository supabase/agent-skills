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

### Realtime

| Area             | Resource                             | When to Use                                         |
| ---------------- | ------------------------------------ | --------------------------------------------------- |
| Channel Setup    | `references/realtime-setup-*.md`     | Creating channels, naming conventions, auth         |
| Broadcast        | `references/realtime-broadcast-*.md` | Client messaging, database-triggered broadcasts     |
| Presence         | `references/realtime-presence-*.md`  | User online status, shared state tracking           |
| Postgres Changes | `references/realtime-postgres-*.md`  | Database change listeners (prefer Broadcast)        |
| Patterns         | `references/realtime-patterns-*.md`  | Cleanup, error handling, React integration          |

**CLI Usage:** Always use `npx supabase` instead of `supabase` for version consistency across team members.
