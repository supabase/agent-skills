# supabase

> **Note:** `CLAUDE.md` is a symlink to this file.

## Overview

Guides and best practices for working with Supabase. Covers getting started, Auth, Database, Storage, Edge Functions, Realtime, supabase-js SDK, CLI, and MCP integration. Use for any Supabase-related questions.

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

## Reference Categories

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Project Commands | CRITICAL | `project-` |
| 1 | Row Level Security | CRITICAL | `rls-` |
| 1 | Setup | CRITICAL | `setup-` |
| 1 | Tool Selection | CRITICAL | `tool-` |
| 2 | Database Commands | CRITICAL | `database-` |
| 2 | Connection Pooling | CRITICAL | `conn-` |
| 2 | Combined Workflows | CRITICAL | `workflow-` |
| 3 | Migration Commands | HIGH | `migration-` |
| 3 | Schema Design | HIGH | `schema-` |
| 4 | Functions Commands | HIGH | `functions-` |
| 4 | Migrations | HIGH | `migrations-` |
| 5 | Secrets Commands | MEDIUM | `secrets-` |
| 5 | Performance | CRITICAL | `perf-` |
| 6 | Generation Commands | HIGH | `generation-` |
| 6 | Security | CRITICAL | `security-` |
| 7 | Decision Guide | HIGH | `decision-` |
| 8 | Gotchas and Pitfalls | HIGH | `gotchas-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Database Commands** (`database-`):
- `references/cli/database-commands.md`

**Decision Guide** (`decision-`):
- `references/cli/decision-guide.md`

**Functions Commands** (`functions-`):
- `references/cli/functions-commands.md`

**Generation Commands** (`generation-`):
- `references/cli/generation-commands.md`

**Gotchas and Pitfalls** (`gotchas-`):
- `references/cli/gotchas-pitfalls.md`

**Migration Commands** (`migration-`):
- `references/cli/migration-commands.md`

**Project Commands** (`project-`):
- `references/cli/project-commands.md`

**Secrets Commands** (`secrets-`):
- `references/cli/secrets-commands.md`

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

**Setup** (`setup-`):
- `references/mcp/setup-configuration.md`
- `references/mcp/setup-feature-groups.md`
- `references/mcp/setup-security.md`

**Tool Selection** (`tool-`):
- `references/tooling/tool-overlap.md`
- `references/tooling/tool-selection.md`

**Combined Workflows** (`workflow-`):
- `references/tooling/workflow-function-dev.md`
- `references/tooling/workflow-local-dev.md`
- `references/tooling/workflow-migration-create.md`
- `references/tooling/workflow-type-generation.md`

---

*35 reference files across 17 categories*