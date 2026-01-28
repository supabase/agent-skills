# Section Definitions

Reference files are grouped by prefix. Claude loads specific files based on user
queries.

---

## 1. Client Initialization (client)

**Impact:** CRITICAL
**Description:** Browser vs server client setup, singleton patterns, SSR configuration with @supabase/ssr, and middleware for session refresh.

## 2. TypeScript (ts)

**Impact:** HIGH
**Description:** Type generation from database schema, using the Database generic, Tables/Enums helpers, and QueryData for join types.

## 3. Query Patterns (query)

**Impact:** HIGH
**Description:** CRUD operations, filters, modifiers, joins with foreign tables, and RPC calls to Postgres functions.

## 4. Error Handling (error)

**Impact:** MEDIUM-HIGH
**Description:** Error types, checking errors before using data, retry patterns with custom fetch.

## 5. Performance (perf)

**Impact:** HIGH
**Description:** Query optimization (select specific columns, parallel queries), realtime subscription cleanup, and scale considerations.

## 6. Framework Integration (framework)

**Impact:** HIGH
**Description:** Next.js App Router integration, Server Components, middleware setup, and common SSR pitfalls.
