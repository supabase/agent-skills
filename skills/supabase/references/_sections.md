# Section Definitions

Reference files are grouped by prefix. Claude loads specific files based on user
queries.

---

## 1. Authentication (auth)

**Impact:** CRITICAL
**Description:** Sign-up, sign-in, sign-out, session management, OAuth/social login, SAML SSO, MFA, passwordless flows, auth hooks, and server-side auth patterns.

## 2. Database (db)

**Impact:** CRITICAL
**Description:** Row Level Security policies, connection pooling, schema design patterns, migrations, performance optimization, and security functions for Supabase Postgres.

## 3. Edge Functions (edge)

**Impact:** HIGH
**Description:** Fundamentals, authentication, database access, CORS, routing, error handling, streaming, WebSockets, regional invocations, testing, and limits.

## 4. SDK (sdk)

**Impact:** HIGH
**Description:** supabase-js client initialization, TypeScript generation, CRUD queries, filters, joins, RPC calls, error handling, performance, and Next.js integration.

## 5. Realtime (realtime)

**Impact:** MEDIUM-HIGH
**Description:** Channel setup, Broadcast messaging, Presence tracking, Postgres Changes listeners, cleanup patterns, error handling, and debugging.

## 6. Storage (storage)

**Impact:** HIGH
**Description:** File uploads (standard and resumable), downloads, signed URLs, image transformations, CDN caching, access control with RLS policies, and file management operations.
