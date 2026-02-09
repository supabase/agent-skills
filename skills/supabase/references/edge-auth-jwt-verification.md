---
title: JWT Verification and Authentication
impact: CRITICAL
impactDescription: Prevents unauthorized access and security vulnerabilities
tags: edge-functions, jwt, authentication, jose, security
---

## JWT Verification and Authentication

Secure Edge Functions with JWT verification. By default, the gateway validates JWTs. Use `supabase.auth.getClaims()` for most cases. Use jose library when building custom auth middleware. Disable verification with `--no-verify-jwt` for endpoints that handle auth independently (e.g., webhooks, WebSockets).

**Incorrect:**

```typescript
// Old deprecated pattern using symmetric secret
import { verify } from "djwt";
const payload = await verify(token, JWT_SECRET, "HS256");
```

**Correct:**

```typescript
// Simple: getClaims() verifies locally via JWKS (cached, no network request)
const token = req.headers.get("Authorization")?.replace("Bearer ", "");
const { data, error } = await supabase.auth.getClaims(token);
if (error) return new Response("Invalid JWT", { status: 401 });
const userId = data.claims.sub;
```

`getClaims()` is tied to the supabase-js client and returns a fixed set of claims. Use jose directly when you need full control over verification (custom issuer, audience, clock tolerance) or access to the complete raw JWT payload:

```typescript
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

  const issuer =
    Deno.env.get("SB_JWT_ISSUER") ?? Deno.env.get("SUPABASE_URL") + "/auth/v1";
  const { payload } = await jose.jwtVerify(authHeader.slice(7), JWKS, {
    issuer,
  });

  return new Response(JSON.stringify({ userId: payload.sub }));
});
```

Separately, the API gateway verifies JWTs before they reach your function. To disable this gateway-level check (e.g., for webhooks or WebSocket endpoints that handle auth themselves): `npx supabase functions deploy fn-name --no-verify-jwt`.

Reference: [Securing Functions](https://supabase.com/docs/guides/functions/auth)
