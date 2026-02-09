# Section Definitions

Reference files are grouped by prefix. Claude loads specific files based on user
queries.

---

## 1. Database (db)

**Impact:** CRITICAL
**Description:** Row Level Security policies, connection pooling, schema design patterns, migrations, performance optimization, and security functions for Supabase Postgres.

## 2. CLI (cli)

**Impact:** CRITICAL
**Description:** Supabase CLI commands for project management, database operations, migrations, Edge Functions, secrets, type generation, decision guides, and common pitfalls.

## 3. MCP (mcp)

**Impact:** CRITICAL
**Description:** MCP server configuration for local, hosted, and self-hosted environments. Security settings, OAuth, and feature groups.

## 4. Tooling (tooling)

**Impact:** CRITICAL
**Description:** Decision guidance for choosing between MCP and CLI. Combined workflows for local development, migrations, type generation, and Edge Function deployment.

## 5. Authentication (auth)

**Impact:** CRITICAL
**Description:** Sign-up, sign-in, sign-out, session management, OAuth/social login, SAML SSO, MFA, passwordless flows, auth hooks, and server-side auth patterns.

## 6. Edge Functions (edge)

**Impact:** HIGH
**Description:** Fundamentals, authentication, database access, CORS, routing, error handling, streaming, WebSockets, regional invocations, testing, and limits.

## 7. SDK (sdk)

**Impact:** HIGH
**Description:** supabase-js client initialization, TypeScript generation, CRUD queries, filters, joins, RPC calls, error handling, performance, and Next.js integration.

## 8. Storage (storage)

**Impact:** HIGH
**Description:** Access control, RLS policies, standard and resumable uploads, download URLs, image transformations, CDN caching, and file operations.

## 9. Realtime (realtime)

**Impact:** MEDIUM-HIGH
**Description:** Channel setup, Broadcast messaging, Presence tracking, Postgres Changes listeners, cleanup patterns, error handling, and debugging.

## 10. Vectors (vectors)

**Impact:** MEDIUM
**Description:** pgvector setup, HNSW/IVFFlat indexing, semantic and hybrid search, embedding generation, RAG patterns, and performance tuning.
