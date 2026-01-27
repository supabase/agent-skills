---
title: Routing and Multi-Route Functions
impact: MEDIUM-HIGH
impactDescription: Reduces cold starts and simplifies API architecture
tags: edge-functions, routing, hono, url-pattern
---

## Routing and Multi-Route Functions

Handle multiple routes in a single Edge Function to minimize cold starts. Use Hono framework for clean routing. Remember to set basePath matching the function name.

**Incorrect:**

```typescript
// Many separate functions = many cold starts
// supabase/functions/create-user/index.ts
// supabase/functions/get-user/index.ts
// supabase/functions/update-user/index.ts

// Also wrong: missing basePath causes route mismatches
import { Hono } from "npm:hono";
const app = new Hono();
app.get("/users", handler); // Won't match /functions/v1/api/users
```

**Correct:**

```typescript
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";

// Single function handling all user operations
const app = new Hono().basePath("/api"); // Must match function name!

app.use("*", cors());

app.get("/users", (c) => c.json({ users: [] }));
app.get("/users/:id", (c) => c.json({ id: c.req.param("id") }));
app.post("/users", async (c) => c.json(await c.req.json(), 201));
app.delete("/users/:id", (c) => c.json({ deleted: c.req.param("id") }));
app.all("*", (c) => c.json({ error: "Not found" }, 404));

Deno.serve(app.fetch);
```

Invoke as `https://PROJECT.supabase.co/functions/v1/api/users/123`.

Reference: [Routing Guide](https://supabase.com/docs/guides/functions/routing)
