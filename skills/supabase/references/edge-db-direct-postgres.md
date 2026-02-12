---
title: Direct Postgres Connections
impact: MEDIUM
impactDescription: Enables complex queries and ORM usage
tags: edge-functions, postgres, drizzle, connection-pooling
---

## Direct Postgres Connections

Connect directly to Postgres for complex queries or ORM usage. Use port 6543 (transaction pooler) and disable prepared statements. Always release connections back to the pool.

**Incorrect:**

```typescript
// Wrong port, missing prepare:false, connection leak
import postgres from "postgres";

const client = postgres(connectionString); // Uses session mode port
const db = drizzle(client); // Prepared statements fail

Deno.serve(async () => {
  const data = await db.select().from(users);
  return Response.json(data);
  // Connection never released!
});
```

**Correct:**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

Deno.serve(async () => {
  // Disable prefetch for transaction pooler mode
  const client = postgres(Deno.env.get("SUPABASE_DB_URL")!, {
    prepare: false,
  });
  const db = drizzle(client);

  const data = await db.select().from(users);
  return Response.json(data);
});
```

Use `SUPABASE_DB_URL` (auto-injected) for the connection string. When using `deno.land/x/postgres` (not postgres-js), use a pool size of 1.

Reference: [Connect to Postgres](https://supabase.com/docs/guides/functions/connect-to-postgres)
