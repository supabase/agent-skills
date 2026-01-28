---
title: MCP Schema Inspection Tools
impact: MEDIUM
impactDescription: Schema inspection and type generation for development workflow
tags: mcp, list-tables, list-extensions, generate-types
---

## MCP Schema Inspection Tools

Use `list_tables`, `list_extensions`, and `generate_types` to inspect database schema and generate client types. Always regenerate types after schema changes to prevent runtime errors from type mismatches. These tools work in both local and hosted MCP environments.

**Incorrect:**

```typescript
// After adding 'is_draft' column via migration
// Types not regenerated
const { data } = await supabase
  .from('posts')
  .select('id, title, is_draft');
// TypeScript error: Property 'is_draft' does not exist
// Runtime works but types are wrong
```

Not regenerating types after schema changes causes type mismatches.

**Correct:**

```typescript
// After adding column, regenerate types:
// supabase gen types typescript --linked > database.types.ts

// Now types include new column
const { data } = await supabase
  .from('posts')
  .select('id, title, is_draft');
// TypeScript recognizes is_draft column
```

Always regenerate types after any schema change.

## Available Tools

| Tool | Purpose | Read-only? |
|------|---------|------------|
| `list_tables(schemas)` | List tables and columns | Yes |
| `list_extensions()` | List installed/available extensions | Yes |
| `list_migrations()` | View migration history | Yes |
| `generate_types()` | Generate TypeScript types | Yes |

## Type Generation Commands

Local: `supabase gen types typescript --local > types.ts`

Hosted: `supabase gen types typescript --linked > types.ts`

## Related

- [db-execute-vs-migrate.md](db-execute-vs-migrate.md) - Query vs migration tools
- [workflow-hosted.md](workflow-hosted.md) - Hosted development workflow
