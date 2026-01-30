---
title: JWT Verification and Authentication
impact: CRITICAL
impactDescription: Prevents unauthorized access and security vulnerabilities
tags: edge-functions, jwt, authentication, jose, security
---

## JWT Verification and Authentication

Secure Edge Functions with JWT verification. By default, the gateway validates JWTs. Use jose library for custom verification. Disable verification with `--no-verify-jwt` for webhooks.

**Incorrect:**

```typescript
// Old deprecated pattern using symmetric secret
import { verify } from "djwt";
const payload = await verify(token, JWT_SECRET, "HS256");
```

**Correct:**

```typescript
// Modern pattern using jose with JWKS endpoint
import * as jose from "jsr:@panva/jose@6";

const JWKS = jose.createRemoteJWKSet(
  new URL(Deno.env.get("SUPABASE_URL")! + "/auth/v1/.well-known/jwks.json")
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok"); // Skip auth for preflight

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { payload } = await jose.jwtVerify(authHeader.slice(7), JWKS, {
    issuer: Deno.env.get("SUPABASE_URL") + "/auth/v1",
  });

  return new Response(JSON.stringify({ userId: payload.sub }));
});
```

For webhooks (Stripe, GitHub), deploy with `supabase functions deploy fn-name --no-verify-jwt`.

Reference: [Securing Functions](https://supabase.com/docs/guides/functions/auth)
