# Section Definitions

Reference files are grouped by prefix. Claude loads specific files based on user
queries.

---

## 1. Row Level Security (rls)

**Impact:** CRITICAL
**Description:** RLS policies, common mistakes, performance optimizations, and security patterns specific to Supabase's auth.uid() integration.

## 2. Connection Pooling (conn)

**Impact:** CRITICAL
**Description:** Supabase-specific connection pooling with Supavisor. Transaction mode (port 6543) vs Session mode (port 5432).

## 3. Schema Design (schema)

**Impact:** HIGH
**Description:** Supabase-specific schema patterns including auth.users foreign keys, timestamptz, JSONB usage, extensions, and Realtime.

## 4. Migrations (migrations)

**Impact:** HIGH
**Description:** Migration workflows using Supabase CLI, idempotent patterns, supabase db diff, and local testing strategies.

## 5. Performance (perf)

**Impact:** CRITICAL
**Description:** Index strategies (BRIN, GIN, partial), query optimization for PostgREST, and Supabase-specific performance patterns.

## 6. Security (security)

**Impact:** CRITICAL
**Description:** Service role key handling, security definer functions in private schemas, and Supabase-specific security patterns.
