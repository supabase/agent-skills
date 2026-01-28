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
| 1 | Common Workflows | CRITICAL | `workflows-` |
| 2 | Decision Guide | HIGH | `decision-` |
| 3 | Gotchas and Pitfalls | HIGH | `gotchas-` |
| 4 | Commands Overview | MEDIUM | `commands-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Commands Overview** (`commands-`):
- `references/commands-overview.md`

**Decision Guide** (`decision-`):
- `references/decision-guide.md`

**Gotchas and Pitfalls** (`gotchas-`):
- `references/gotchas-pitfalls.md`

**Common Workflows** (`workflows-`):
- `references/workflows-common.md`

---

*4 reference files across 4 categories*