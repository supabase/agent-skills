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
| 2 | CLI | CRITICAL | `cli-` |
| 3 | Database | CRITICAL | `db-` |
| 4 | Edge Functions | HIGH | `edge-` |
| 5 | MCP | CRITICAL | `mcp-` |
| 6 | SDK | HIGH | `sdk-` |
| 7 | Realtime | MEDIUM-HIGH | `realtime-` |
| 8 | Storage | HIGH | `storage-` |
| 9 | Tooling | CRITICAL | `tooling-` |

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

**CLI** (`cli-`):
- `references/cli-database-commands.md`
- `references/cli-decision-guide.md`
- `references/cli-functions-commands.md`
- `references/cli-generation-commands.md`
- `references/cli-gotchas-pitfalls.md`
- `references/cli-migration-commands.md`
- `references/cli-project-commands.md`
- `references/cli-secrets-commands.md`

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

| Area               | Resource                        | When to Use                                    |
| ------------------ | ------------------------------- | ---------------------------------------------- |
| RLS Security       | `references/db-rls-*.md`        | Row Level Security policies, common mistakes   |
| Connection Pooling | `references/db-conn-pooling.md` | Transaction vs Session mode, port 6543 vs 5432 |
| Schema Design      | `references/db-schema-*.md`     | auth.users FKs, timestamps, JSONB, extensions  |
| Migrations         | `references/db-migrations-*.md` | CLI workflows, idempotent patterns, db diff    |
| Performance        | `references/db-perf-*.md`       | Indexes (BRIN, GIN), query optimization        |
| Security           | `references/db-security-*.md`   | Service role key, security_definer functions   |

**MCP** (`mcp-`):
- `references/mcp-setup-configuration.md`
- `references/mcp-setup-feature-groups.md`
- `references/mcp-setup-security.md`

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

**Tooling** (`tooling-`):
- `references/tooling-tool-overlap.md`
- `references/tooling-tool-selection.md`
- `references/tooling-workflow-function-dev.md`
- `references/tooling-workflow-local-dev.md`
- `references/tooling-workflow-migration-create.md`
- `references/tooling-workflow-type-generation.md`

---

*94 reference files across 9 categories*
