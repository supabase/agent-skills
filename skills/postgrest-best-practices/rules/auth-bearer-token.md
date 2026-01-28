---
title: Authenticate Requests with Bearer JWT
impact: MEDIUM
impactDescription: Secure API access with JSON Web Tokens
tags: authentication, jwt, bearer, authorization, security
---

## Authenticate Requests with Bearer JWT

Pass a JWT in the `Authorization` header as a Bearer token to authenticate requests. PostgREST validates the token and extracts the role for authorization.

**Incorrect (no authentication):**

```bash
# Anonymous request - limited access
curl "http://localhost:3000/users"
# Uses anonymous role - may be restricted by RLS

# API key without JWT
curl "http://localhost:3000/users" \
  -H "apikey: your-api-key"
# Still anonymous unless JWT provided
```

**Correct (Bearer token authentication):**

```bash
# Authenticated request with JWT
curl "http://localhost:3000/users" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# With Supabase - both apikey and JWT
curl "https://project.supabase.co/rest/v1/users" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer user-jwt-token"

# For mutations
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{"title": "My Post"}'
```

**supabase-js:**

```typescript
// supabase-js handles auth automatically after sign in
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
// JWT is automatically included in subsequent requests

// Authenticated query
const { data } = await supabase
  .from('posts')
  .select('*')
// Authorization header sent automatically

// Manual token (for server-side or custom auth)
const supabaseWithAuth = createClient(url, anonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${customJwt}`
    }
  }
})
```

**JWT structure:**

```javascript
// JWT payload (decoded)
{
  "sub": "user-uuid-here",
  "role": "authenticated",  // Role used for DB permissions
  "email": "user@example.com",
  "iat": 1704067200,
  "exp": 1704153600,
  // Custom claims
  "user_metadata": { "name": "John" }
}
```

**How PostgREST uses JWT:**
1. Validates signature with configured secret/JWKS
2. Checks expiration (`exp` claim)
3. Extracts role from configured claim (default: `role`)
4. Sets PostgreSQL role: `SET ROLE authenticated`
5. Makes claims available via `current_setting('request.jwt.claims')`

**Common errors:**

| Error | Cause |
|-------|-------|
| 401 PGRST301 | Malformed JWT |
| 401 PGRST302 | JWT expired |
| 401 PGRST303 | Invalid signature |

Reference: [PostgREST JWT Authentication](https://postgrest.org/en/stable/references/auth.html)
