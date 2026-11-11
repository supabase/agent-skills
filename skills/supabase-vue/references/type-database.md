---
title: Generate and Use Supabase Database Types
impact: HIGH
impactDescription: Keeps Vue data access aligned with database nullability, relationships, and writes
tags: typescript, generated-types, database, query, vue
---

## Make the database schema the source of truth

Generate types from the project schema with the installed Supabase CLI; commit the output and regenerate it after schema changes. Current CLI documentation uses `--remote` for a linked/remote database and local generation by default. Confirm flags with the installed CLI’s help when versions differ.

```sh
# Local database is the CLI default
supabase gen types typescript --schema public > src/types/database.types.ts

# Remote project; use the installed CLI's documented --remote syntax
supabase gen types typescript --remote="$PROJECT_REF" --schema public > src/types/database.types.ts
```

Initialize the sole project client with `createClient<Database>()`. Infer select results from the query itself, especially for joins and selected subsets; use generated `Tables<'profiles'>`, `TablesInsert<'profiles'>`, and `TablesUpdate<'profiles'>` helpers where suitable.

```ts
import { createClient, type QueryData } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export const supabase = createClient<Database>(url, publishableKey)

const profileQuery = supabase
  .from('profiles')
  .select('id, display_name, organizations(id, name)')
  .eq('id', profileId)

type ProfileResult = QueryData<typeof profileQuery>
type ProfileRow = Tables<'profiles'>
type ProfileInsert = TablesInsert<'profiles'>
type ProfileUpdate = TablesUpdate<'profiles'>

const { data, error } = await profileQuery
if (error) throw error
// data and nested organization cardinality are inferred from Database.
```

Let generated nullability remain visible: nullable columns must be handled as nullable, and generated `Insert`/`Update` types reflect defaults and required columns. Do not duplicate the schema with hand-authored interfaces, use `any`, or use casts to silence genuine type errors. Types do not validate API/form input at runtime.

When types appear stale, inspect migrations/current database schema, regenerate using the correct local or remote target, review the generated diff, then fix code against that schema. Do not patch generated declarations by hand or invent a temporary shape to hide drift. For complex relationships, infer with `QueryData<typeof query>` rather than copying a nested type.

Vite only transpiles TypeScript; run `vue-tsc --noEmit` or the project’s configured SFC type checker.

References: [Supabase TypeScript support](https://supabase.com/docs/reference/javascript/typescript-support), [CLI gen types](https://supabase.com/docs/reference/cli/supabase-gen-types), [Vue TypeScript](https://vuejs.org/guide/typescript/overview.html).
