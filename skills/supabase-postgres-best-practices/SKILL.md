---
name: supabase-postgres-best-practices
description: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.
license: MIT
metadata:
  author: supabase
  version: "1.1.0"
  organization: Supabase
  date: January 2026
  abstract: Comprehensive Postgres performance optimization guide for developers using Supabase and Postgres. Contains performance rules across 8 categories, prioritized by impact from critical (query performance, connection management) to incremental (advanced features). Each rule includes detailed explanations, incorrect vs. correct SQL examples, query plan analysis, and specific performance metrics to guide automated optimization and code generation.
---

# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design.

## When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

## How to Use

Read individual rule files for detailed explanations and SQL examples:

```
references/query-missing-indexes.md
references/schema-partial-indexes.md
references/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Additional context and references
- Supabase-specific notes (when applicable)

## Auth Flow Checklist (Supabase + Next.js)

When implementing email/password authentication with Supabase, always include a **password reset flow** alongside the login page. Without it, users who forget their password are locked out with no self-service recovery.

Required pieces:

1. **"Forgot password?" on the login page** — Toggles to an email-only form that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`. Shows a confirmation message on success.

2. **`/reset-password` page** — A `'use client'` component that:
   - Listens for the `PASSWORD_RECOVERY` event via `supabase.auth.onAuthStateChange`
   - Shows new password + confirm password inputs
   - Calls `supabase.auth.updateUser({ password })` on submit
   - Redirects to `/` on success

3. **Middleware exclusion** — Add `/reset-password` to the auth gate's skip list (same as `/login`), so the page is accessible without an active session.

4. **Nav exclusion** — Hide the app's navigation bar on `/reset-password` (same as `/login`).

How Supabase password reset works under the hood:
- `resetPasswordForEmail` triggers Supabase to email the user a magic link
- Clicking the link verifies the token server-side, then redirects to the `redirectTo` URL with hash fragments (`#access_token=...&type=recovery`)
- The Supabase JS client detects `type=recovery` and fires the `PASSWORD_RECOVERY` event via `onAuthStateChange`
- The app then shows the new-password form and calls `updateUser`

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
