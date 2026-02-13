---
title: Project Structure and Organization
impact: HIGH
impactDescription: Proper organization reduces cold starts and improves maintainability
tags: edge-functions, structure, shared, organization
---

## Project Structure and Organization

Organize Edge Functions with shared code in `_shared/` folder (underscore prefix excludes from deployment). Use hyphens for function names. Combine related functionality into "fat functions" to minimize cold starts.

**Incorrect:**

```bash
# Underscores cause URL issues, missing underscore on shared
supabase/functions/
  shared/                 # Will be deployed as function!
    cors.ts
  hello_world/           # Underscores problematic in URLs
    index.ts
```

**Correct:**

```bash
# Hyphens for functions, underscore prefix for shared
supabase/functions/
  import_map.json        # Top-level import map
  _shared/               # Excluded from deployment
    cors.ts
    supabaseClient.ts
  hello-world/           # Use hyphens
    index.ts
```

For VSCode/Cursor, create `.vscode/settings.json`:

```json
{
  "deno.enablePaths": ["./supabase/functions"],
  "deno.importMap": "./supabase/functions/import_map.json"
}
```

Reference: [Development Tips](https://supabase.com/docs/guides/functions/development-tips)
