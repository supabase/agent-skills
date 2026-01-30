---
title: CLI Generation Commands
impact: HIGH
impactDescription: Commands for generating TypeScript types from database schema
tags: cli, gen, types, typescript, codegen
---

## CLI Generation Commands

Commands for generating code from database schema.

**Incorrect:**

```bash
# Generating types without specifying source
supabase gen types typescript  # Error: must specify --local or --linked
```

**Correct:**

```bash
# Always specify source
supabase gen types typescript --local > types.ts     # From local
supabase gen types typescript --linked > types.ts    # From remote
```

---

## supabase gen types

Generate TypeScript types from database schema.

```bash
supabase gen types typescript --local > types.ts        # From local database
supabase gen types typescript --linked > types.ts       # From linked remote
supabase gen types typescript --project-id REF > types.ts  # From specific project
```

**Flags:** `--local`, `--linked`, `--project-id`, `--schema`

**vs MCP generate_typescript_types:**
| CLI `gen types` | MCP `generate_typescript_types` |
|-----------------|--------------------------------|
| Local or remote | Remote only |
| Output to file directly | Returns in response |
| Required for local | Use when MCP connected |

Use CLI for local types, MCP for remote when connected.

---

## CI Integration

```yaml
- name: Verify types current
  run: |
    supabase gen types typescript --local > types.gen.ts
    if ! git diff --exit-code types.gen.ts; then
      echo "Types out of date!"
      exit 1
    fi
```

## Related

- [database-commands.md](database-commands.md) - Schema changes before types
- [migration-commands.md](migration-commands.md) - Migrations before types
