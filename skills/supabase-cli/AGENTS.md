# supabase-cli

> **Note:** `CLAUDE.md` is a symlink to this file.

## Overview

Supabase CLI command reference and usage guide. Use this skill when running Supabase CLI commands, managing local development environments, deploying to Supabase projects, working with database migrations, edge functions, branches, secrets, storage, SSO, custom domains, network configuration, or any other Supabase CLI operation.

## Structure

```
supabase-cli/
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
| 1 | General Commands | CRITICAL | `general-` |
| 2 | Database Commands | CRITICAL | `db-` |
| 4 | Edge Functions | HIGH | `functions-` |
| 5 | Project Management | HIGH | `project-` |
| 6 | Secrets & Storage | HIGH | `secrets-` |
| 7 | Authentication & SSO | MEDIUM | `auth-` |
| 8 | Domain & Network | MEDIUM | `network-` |
| 9 | Inspect & Diagnostics | MEDIUM | `inspect-` |
| 10 | Utilities | LOW | `util-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Authentication & SSO** (`auth-`):
- `references/auth-sso-commands.md`

**Database Commands** (`db-`):
- `references/db-commands.md`
- `references/db-migrations.md`

**Edge Functions** (`functions-`):
- `references/functions-commands.md`

**General Commands** (`general-`):
- `references/general-commands.md`

**Inspect & Diagnostics** (`inspect-`):
- `references/inspect-commands.md`

**Domain & Network** (`network-`):
- `references/network-domain-commands.md`

**Project Management** (`project-`):
- `references/project-management.md`

**Secrets & Storage** (`secrets-`):
- `references/secrets-commands.md`

**Utilities** (`util-`):
- `references/util-commands.md`

---

*10 reference files across 9 categories*