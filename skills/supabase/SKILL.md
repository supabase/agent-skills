---
name: supabase
description: Guides and best practices for working with Supabase. Covers getting started, Auth, Database, Vectors/AI, Storage, Edge Functions, Realtime, supabase-js SDK, CLI, and MCP integration. Use for any Supabase-related questions including vector search, embeddings, RAG, and semantic search.
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

### Vectors & AI

| Area               | Resource                          | When to Use                                     |
| ------------------ | --------------------------------- | ----------------------------------------------- |
| Vector Setup       | `references/vectors/setup-*.md`   | pgvector extension, vector columns, dimensions  |
| Vector Indexing    | `references/vectors/index-*.md`   | HNSW, IVFFlat, index parameters, concurrent     |
| Vector Search      | `references/vectors/search-*.md`  | Semantic search, hybrid search, match_documents |
| Embeddings         | `references/vectors/embed-*.md`   | gte-small, OpenAI, triggers, Edge Functions     |
| RAG                | `references/vectors/rag-*.md`     | Document ingestion, chunking, query pipelines   |
| Vector Performance | `references/vectors/perf-*.md`    | Pre-warming, compute sizing, batch operations   |

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

### Client Libraries & CLI

| Area         | Resource                    | When to Use                              |
| ------------ | --------------------------- | ---------------------------------------- |
| supabase-js  | `references/supabase-js.md` | JavaScript/TypeScript SDK, client config |
| Supabase CLI | `references/cli.md`         | Local development, migrations, CI/CD     |
| MCP Server   | `references/mcp.md`         | AI agent integration, MCP tooling        |
