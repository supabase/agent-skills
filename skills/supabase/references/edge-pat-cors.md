---
title: CORS Configuration
impact: HIGH
impactDescription: Required for browser-based function invocation
tags: edge-functions, cors, browser, preflight
---

## CORS Configuration

Handle Cross-Origin Resource Sharing for browser-invoked Edge Functions. Always handle OPTIONS preflight requests and include CORS headers in all responses including errors.

**Incorrect:**

```typescript
// Missing OPTIONS handling and CORS headers in error response
Deno.serve(async (req) => {
  try {
    const { name } = await req.json(); // Fails on OPTIONS (no body)
    return new Response(`Hello ${name}`);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      // Missing CORS headers - browser can't read error!
    });
  }
});
```

**Correct:**

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();
    return new Response(JSON.stringify({ message: `Hello ${name}!` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

Store shared CORS headers in `_shared/cors.ts` and import across functions.

Reference: [CORS Guide](https://supabase.com/docs/guides/functions/cors)
