# supabase

## Overview

Guides and best practices for working with Supabase. Covers getting started, Auth, Database, Storage, Edge Functions, Realtime, supabase-js SDK, CLI, and MCP integration. Use for any Supabase-related questions.

## Structure

```
supabase/
  SKILL.md       # Main skill file - read this first
  AGENTS.md      # This navigation guide
  references/    # Detailed reference files
```

## Usage

1. Read `SKILL.md` for the main skill instructions
2. Browse `references/` for detailed documentation on specific topics
3. Reference files are loaded on-demand - read only what you need

## Reference Categories

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Core Authentication | CRITICAL | `core-` |
| 1 | Row Level Security | CRITICAL | `rls-` |
| 2 | OAuth & Social Login | HIGH | `oauth-` |
| 2 | Connection Pooling | CRITICAL | `conn-` |
| 3 | Enterprise SSO | MEDIUM | `sso-` |
| 3 | Schema Design | HIGH | `schema-` |
| 4 | Multi-Factor Authentication | HIGH | `mfa-` |
| 4 | Migrations | HIGH | `migrations-` |
| 5 | Passwordless | MEDIUM-HIGH | `passwordless-` |
| 5 | Performance | CRITICAL | `perf-` |
| 6 | Auth Hooks | HIGH | `hooks-` |
| 6 | Security | CRITICAL | `security-` |
| 7 | Server-Side Auth | CRITICAL | `server-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Core Authentication** (`core-`):
- `references/auth/core-sessions.md`
- `references/auth/core-signin.md`
- `references/auth/core-signup.md`

**Auth Hooks** (`hooks-`):
- `references/auth/hooks-custom-claims.md`
- `references/auth/hooks-send-email.md`

**Multi-Factor Authentication** (`mfa-`):
- `references/auth/mfa-phone.md`
- `references/auth/mfa-totp.md`

**OAuth & Social Login** (`oauth-`):
- `references/auth/oauth-pkce.md`
- `references/auth/oauth-providers.md`

**Passwordless** (`passwordless-`):
- `references/auth/passwordless-magic-links.md`
- `references/auth/passwordless-otp.md`

**Server-Side Auth** (`server-`):
- `references/auth/server-admin-api.md`
- `references/auth/server-ssr.md`

**Enterprise SSO** (`sso-`):
- `references/auth/sso-saml.md`

**Connection Pooling** (`conn-`):
- `references/db/conn-pooling.md`

**Migrations** (`migrations-`):
- `references/db/migrations-diff.md`
- `references/db/migrations-idempotent.md`
- `references/db/migrations-testing.md`

**Performance** (`perf-`):
- `references/db/perf-indexes.md`
- `references/db/perf-query-optimization.md`

**Row Level Security** (`rls-`):
- `references/db/rls-common-mistakes.md`
- `references/db/rls-mandatory.md`
- `references/db/rls-performance.md`
- `references/db/rls-policy-types.md`
- `references/db/rls-views.md`

**Schema Design** (`schema-`):
- `references/db/schema-auth-fk.md`
- `references/db/schema-extensions.md`
- `references/db/schema-jsonb.md`
- `references/db/schema-realtime.md`
- `references/db/schema-timestamps.md`

**Security** (`security-`):
- `references/db/security-functions.md`
- `references/db/security-service-role.md`

---

*32 reference files across 13 categories*