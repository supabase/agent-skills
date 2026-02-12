---
title: Regional Invocations
impact: LOW-MEDIUM
impactDescription: Optimizes latency for region-specific workloads
tags: edge-functions, regions, latency, performance
---

## Regional Invocations

Execute Edge Functions in specific regions to minimize latency to your database. Regional invocations don't auto-failover during outages.

**Incorrect:**

```typescript
// Assumes automatic failover (it doesn't)
const { data } = await supabase.functions.invoke("fn", {
  region: FunctionRegion.EuWest1,
}); // If EU down, this fails

// Function close to user but far from database
// User in Tokyo, database in US East
await supabase.functions.invoke("db-heavy-fn", {
  region: FunctionRegion.ApNortheast1, // High latency to US database!
});
```

**Correct:**

```typescript
import { createClient, FunctionRegion } from "@supabase/supabase-js";

// Match function region to database region for db-heavy operations
const DB_REGION = FunctionRegion.UsEast1; // Same as your database

const { data } = await supabase.functions.invoke("db-heavy-fn", {
  body: { query: "..." },
  region: DB_REGION,
});

// Implement explicit fallback
async function invokeWithFallback(name: string, body: object) {
  try {
    return await supabase.functions.invoke(name, {
      body,
      region: FunctionRegion.EuWest1,
    });
  } catch {
    return await supabase.functions.invoke(name, { body }); // Default region
  }
}
```

Available regions: us-east-1, us-west-1, us-west-2, eu-west-1, eu-west-2, eu-west-3, eu-central-1, ap-northeast-1, ap-northeast-2, ap-south-1, ap-southeast-1, ap-southeast-2, ca-central-1, sa-east-1.

Reference: [Regional Invocations](https://supabase.com/docs/guides/functions/regional-invocation)
