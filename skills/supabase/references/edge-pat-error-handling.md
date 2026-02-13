---
title: Error Handling Patterns
impact: MEDIUM
impactDescription: Improves reliability and debugging experience
tags: edge-functions, errors, debugging, client-errors
---

## Error Handling Patterns

Handle errors gracefully and return meaningful responses. Include helpful error messages in the response body — never expose stack traces, but `error.message` is fine. Always include CORS headers in error responses.

**Incorrect:**

```typescript
// Exposes internal details, wrong status code, missing CORS
Deno.serve(async (req) => {
  try {
    const data = await riskyOperation();
    return Response.json(data);
  } catch (error) {
    return Response.json({
      error: error.message,
      stack: error.stack, // Leaks internal details!
    }); // Default 200 status for errors!
  }
});
```

**Correct:**

```typescript
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const data = await riskyOperation();
    return Response.json(data, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Internal error:", error); // Log internally

    return Response.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
```

Use appropriate status codes: 400 for validation errors, 401 for unauthorized, 404 for not found, 500 for server errors.

Reference: [Error Handling](https://supabase.com/docs/guides/functions/error-handling)
