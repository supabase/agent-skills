---
title: Generate TypeScript Types
impact: HIGH
impactDescription: Enables compile-time type safety for all database operations
tags: typescript, types, codegen, supabase-cli, database.types.ts
---

## Generate TypeScript Types

Generate types from your database schema using the Supabase CLI.

**Incorrect:**

```typescript
// No types - no compile-time safety
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)
const { data } = await supabase.from('users').select()
// data is 'any' - typos and wrong columns not caught
```

**Correct:**

```typescript
// With generated types - full type safety
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(url, key)
const { data } = await supabase.from('users').select('id, name')
// data is { id: number; name: string }[] | null
```

## Generate Types with CLI

```bash
# Login first
npx supabase login

# Generate from remote project
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > database.types.ts

# Generate from local development database
npx supabase gen types typescript --local > database.types.ts
```

## Use Types with Client

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
)

// Queries are now type-safe
const { data } = await supabase.from('users').select('id, name')
// data: { id: number; name: string }[] | null
```

## Generated Type Structure

```typescript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {           // SELECT result type
          id: number
          name: string
          created_at: string
        }
        Insert: {        // INSERT payload type
          id?: never     // Generated columns must not be supplied
          name: string   // Required
          created_at?: string
        }
        Update: {        // UPDATE payload type
          id?: never
          name?: string
          created_at?: string
        }
      }
    }
    Enums: {
      status: 'active' | 'inactive'
    }
  }
}
```

## Regenerate After Schema Changes

Run type generation after any migration:

```bash
# After applying migrations
npx supabase db push
npx supabase gen types typescript --local > database.types.ts
```

## CI/CD Integration

Add to your build pipeline:

```yaml
- name: Generate types
  run: npx supabase gen types typescript --project-id $PROJECT_REF > database.types.ts

- name: Check for uncommitted type changes
  run: git diff --exit-code database.types.ts
```

## Related

- [ts-usage.md](ts-usage.md)
- [query-crud.md](query-crud.md)
