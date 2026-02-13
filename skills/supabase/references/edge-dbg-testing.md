---
title: Testing Edge Functions
impact: MEDIUM
impactDescription: Ensures reliability before production deployment
tags: edge-functions, testing, deno, unit-tests
---

## Testing Edge Functions

Test Edge Functions locally using Deno's built-in test runner. Run `npx supabase start` first, then `npx supabase functions serve` before running tests.

**Incorrect:**

```typescript
// Running tests without serving functions
deno test --allow-all tests/ // Connection refused!

// Using production credentials
const supabase = createClient(
  "https://prod.supabase.co", // Never hardcode production!
  "prod-key"
);

// Not cleaning up test data
Deno.test("creates user", async () => {
  await supabase.from("users").insert({ email: "test@test.com" });
  // Test data accumulates!
});
```

**Correct:**

```typescript
// supabase/functions/tests/hello-world-test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@std/dotenv/load";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!, // From .env
  Deno.env.get("SUPABASE_ANON_KEY")!
);

Deno.test("hello-world returns greeting", async () => {
  const { data, error } = await supabase.functions.invoke("hello-world", {
    body: { name: "Test" },
  });

  assertEquals(error, null);
  assertEquals(data.message, "Hello Test!");
});

// Cleanup test data
Deno.test("creates and cleans up user", async () => {
  const { data } = await supabase.from("users").insert({ email: "test@test.com" }).select().single();
  // ... assertions ...
  await supabase.from("users").delete().eq("id", data.id);
});
```

Run: `npx supabase start && npx supabase functions serve &` then `deno test --allow-all supabase/functions/tests/`

Reference: [Testing Guide](https://supabase.com/docs/guides/functions/unit-test)
