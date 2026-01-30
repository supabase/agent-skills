---
title: Getting Started with Supabase CLI Locally
impact: CRITICAL
impactDescription: Local development workflow guide using Supabase CLI with npx
tags: cli, local, development, setup, workflow, npx
---

## Getting Started with Supabase CLI Locally

Quick workflow guide for local Supabase development. References detailed command documentation.

**Incorrect:**

```bash
# Using installed CLI without consistency
supabase start  # Version may differ across team
```

**Correct:**

```bash
# Use npx for version consistency
npx supabase start
```

---

## Prerequisites

- Docker Desktop (7GB+ RAM)
- Node.js 18+ (for npx)

No global Supabase CLI installation needed when using npx.

---

## Quick Start Workflow

**1. Initialize project:**
```bash
npx supabase init
```
See [cli-project-commands.md](cli-project-commands.md#supabase-init) for details.

**2. Start local stack:**
```bash
npx supabase start
```
See [cli-project-commands.md](cli-project-commands.md#supabase-start) for flags and options.

**3. Get connection info:**
```bash
npx supabase status
```
See [cli-project-commands.md](cli-project-commands.md#supabase-status) for output formats.

---

## Development Workflow

### Schema Development

1. Create migration:
```bash
npx supabase migration new table_name
```

2. Apply locally:
```bash
npx supabase db reset
```

See [cli-migration-commands.md](cli-migration-commands.md) for migration workflow details.

### Type Generation

```bash
npx supabase gen types typescript --local > types/supabase.ts
```

See [cli-generation-commands.md](cli-generation-commands.md) for type generation options.

### Edge Functions

```bash
npx supabase functions new function-name
npx supabase functions serve
```

See [cli-functions-commands.md](cli-functions-commands.md) for function development details.

---

## Connecting to Remote

```bash
npx supabase login
npx supabase link --project-ref <project-id>
```

See [cli-project-commands.md](cli-project-commands.md#supabase-link) for remote operations.

---

## npx vs Global Install

**npx** (recommended):
- No installation needed
- Version consistency across team
- Works with npm 5.2+
- Always uses latest version

**Global install** (not recommended):
- Requires `npm install -g supabase` or `brew install supabase`
- Version drift across team members
- Manual updates needed

All commands in this skill use `npx` prefix.

---

## Common Tasks

```bash
# Daily development
npx supabase db reset          # Apply migrations
npx supabase gen types typescript --local

# Before committing
npx supabase db diff -f name   # Capture schema changes

# Deploying
npx supabase db push           # Push migrations
npx supabase functions deploy  # Deploy functions
```

---

## Decision Guide

Not sure which command to use? See [cli-decision-guide.md](cli-decision-guide.md).

Common pitfalls? See [cli-gotchas-pitfalls.md](cli-gotchas-pitfalls.md).

---

## References

- [cli-project-commands.md](cli-project-commands.md) - Init, start, stop, link
- [cli-database-commands.md](cli-database-commands.md) - DB operations
- [cli-migration-commands.md](cli-migration-commands.md) - Migration workflow
- [cli-functions-commands.md](cli-functions-commands.md) - Edge Functions
- [cli-generation-commands.md](cli-generation-commands.md) - Type generation
- [cli-decision-guide.md](cli-decision-guide.md) - Command selection
- [cli-gotchas-pitfalls.md](cli-gotchas-pitfalls.md) - Common issues
