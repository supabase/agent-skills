---
title: Database Access with supabase-js
impact: HIGH
impactDescription: Primary method for database operations with RLS support
tags: edge-functions, database, supabase-js, queries
---

## Database Access with supabase-js

Access Supabase Postgres using the official JavaScript client. Always handle errors and use `.select()` after insert/update to get returned data.

**Incorrect:**

```typescript
// Missing error handling and .select() after insert
const { data } = await supabase.from("posts").insert({ title: "Test" });
console.log(data); // null - no data returned!

// Using .single() when multiple rows might match
const { data } = await supabase
  .from("users")
  .select("*")
  .eq("role", "admin")
  .single(); // Crashes if multiple admins!
```

**Correct:**

```typescript
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  // Insert with .select() to get returned row
  const { data, error } = await supabase
    .from("posts")
    .insert({ title: "Test" })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
});
```

Use `.single()` only when expecting exactly one row (e.g., by primary key). For multiple rows, omit it.

Reference: [JavaScript Client](https://supabase.com/docs/reference/javascript/select)
