# Supabase

## Structure

```
supabase/
  SKILL.md       # Main skill file - read this first
  AGENTS.md      # This navigation guide
  CLAUDE.md      # Symlink to AGENTS.md
  references/    # Detailed reference files
```

## Usage

1. Read `SKILL.md` for the main skill instructions
2. Browse `references/` for detailed documentation on specific topics
3. Reference files are loaded on-demand - read only what you need

Supabase is an open source Firebase alternative that provides a Postgres database, authentication, instant APIs, edge functions, realtime subscriptions, and storage. It's fully compatible with Postgres and provides several language sdks, including supabase-js and supabase-py.

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Authentication | CRITICAL | `auth-` |
| 2 | Database | CRITICAL | `db-` |
| 3 | Development | CRITICAL | `dev-` |
| 4 | Edge Functions | HIGH | `edge-` |
| 5 | SDK | HIGH | `sdk-` |
| 6 | Realtime | MEDIUM-HIGH | `realtime-` |
| 7 | Storage | HIGH | `storage-` |

Reference the appropriate resource file based on the user's needs:

### Authentication & Security

| Area               | Resource                            | When to Use                                              |
| ------------------ | ----------------------------------- | -------------------------------------------------------- |
| Auth Core          | `references/auth-core-*.md`        | Sign-up, sign-in, sessions, password reset               |
| OAuth/Social       | `references/auth-oauth-*.md`       | Google, GitHub, Apple login, PKCE flow                   |
| Enterprise SSO     | `references/auth-sso-*.md`         | SAML 2.0, enterprise identity providers                  |
| MFA                | `references/auth-mfa-*.md`         | TOTP authenticator apps, phone MFA, AAL levels           |
| Passwordless       | `references/auth-passwordless-*.md`| Magic links, email OTP, phone OTP                        |
| Auth Hooks         | `references/auth-hooks-*.md`       | Custom JWT claims, send email hooks (HTTP and SQL)       |
| Server-Side Auth   | `references/auth-server-*.md`      | Admin API, SSR with Next.js/SvelteKit, service role auth |

**Database** (`db-`):
- `references/db-conn-pooling.md`
- `references/db-migrations-diff.md`
- `references/db-migrations-idempotent.md`
- `references/db-migrations-testing.md`
- `references/db-perf-indexes.md`
- `references/db-perf-query-optimization.md`
- `references/db-rls-common-mistakes.md`
- `references/db-rls-mandatory.md`
- `references/db-rls-performance.md`
- `references/db-rls-policy-types.md`
- `references/db-rls-views.md`
- `references/db-schema-auth-fk.md`
- `references/db-schema-extensions.md`
- `references/db-schema-jsonb.md`
- `references/db-schema-realtime.md`
- `references/db-schema-timestamps.md`
- `references/db-security-functions.md`
- `references/db-security-service-role.md`

**Development** (`dev-`):
- `references/dev-cli-reference.md`
- `references/dev-cli-vs-mcp.md`
- `references/dev-getting-started.md`
- `references/dev-local-workflow.md`
- `references/dev-mcp-setup.md`
- `references/dev-mcp-tools.md`
- `references/dev-remote-workflow.md`

**Edge Functions** (`edge-`):
- `references/edge-adv-regional.md`
- `references/edge-adv-streaming.md`
- `references/edge-adv-websockets.md`
- `references/edge-auth-jwt-verification.md`
- `references/edge-auth-rls-integration.md`
- `references/edge-db-direct-postgres.md`
- `references/edge-db-supabase-client.md`
- `references/edge-dbg-limits.md`
- `references/edge-dbg-testing.md`
- `references/edge-fun-project-structure.md`
- `references/edge-fun-quickstart.md`
- `references/edge-pat-background-tasks.md`
- `references/edge-pat-cors.md`
- `references/edge-pat-error-handling.md`
- `references/edge-pat-routing.md`

**Realtime** (`realtime-`):
- `references/realtime-broadcast-basics.md`
- `references/realtime-broadcast-database.md`
- `references/realtime-patterns-cleanup.md`
- `references/realtime-patterns-debugging.md`
- `references/realtime-patterns-errors.md`
- `references/realtime-postgres-changes.md`
- `references/realtime-presence-tracking.md`
- `references/realtime-setup-auth.md`
- `references/realtime-setup-channels.md`

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

---

*84 reference files across 7 categories*