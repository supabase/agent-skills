---
title: Use Admin Auth API Securely
impact: CRITICAL
impactDescription: Admin API bypasses RLS - misuse exposes all data and enables account takeover
tags: auth, admin, service-role, server, security, user-management
---

## Use Admin Auth API Securely

The Admin Auth API (`supabase.auth.admin.*`) uses the service role key to bypass RLS for user management operations.

## When to Use

- Create users programmatically (invitations, imports)
- Delete users (admin panel, GDPR requests)
- Update user metadata that users can't modify (`app_metadata`)
- List all users (admin dashboards)
- Generate magic links server-side

## Setup

```typescript
import { createClient } from '@supabase/supabase-js'

// NEVER expose serviceRoleKey to client-side code
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

## Common Operations

### Create User

```typescript
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'newuser@example.com',
  password: 'securepassword123',
  email_confirm: true, // Skip email verification
  user_metadata: {
    full_name: 'John Doe',
  },
  app_metadata: {
    role: 'premium',
    organization_id: 'org-uuid',
  },
})
```

### Delete User

```typescript
const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
```

### Update User (Admin)

```typescript
const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
  email: 'newemail@example.com',
  email_confirm: true, // Confirm without sending email
  app_metadata: {
    role: 'admin',
  },
  ban_duration: 'none', // Unban user
})
```

### List Users

```typescript
const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
  page: 1,
  perPage: 50,
})
```

### Generate Magic Link

```typescript
const { data, error } = await supabaseAdmin.auth.admin.generateLink({
  type: 'magiclink',
  email: 'user@example.com',
  options: {
    redirectTo: 'https://yourapp.com/dashboard',
  },
})

// data.properties.action_link contains the magic link
// Send via your own email system
```

### Invite User

```typescript
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
  'newuser@example.com',
  {
    redirectTo: 'https://yourapp.com/set-password',
    data: {
      invited_by: adminUserId,
      role: 'team_member',
    },
  }
)
```

## Common Mistakes

### 1. Exposing Service Role Key to Client

**Incorrect:**

```typescript
// Client-side code
const supabase = createClient(url, process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!)
// DANGER: Key exposed in browser, anyone can access all data
```

**Correct:**

```typescript
// Server-side only (API route, server action)
const supabaseAdmin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
// Key never sent to browser
```

### 2. Using Admin Client for Regular Operations

**Incorrect:**

```typescript
// Server-side route
async function getUserPosts(userId: string) {
  // Using admin client when regular client would work
  const { data } = await supabaseAdmin.from('posts').select('*').eq('user_id', userId)
  return data
}
// Bypasses RLS unnecessarily - any bug could leak data
```

**Correct:**

```typescript
// Use user's authenticated client when possible
async function getUserPosts(req: Request) {
  const supabase = createServerClient(/* with user's session */)
  // RLS ensures user only sees their own posts
  const { data } = await supabase.from('posts').select('*')
  return data
}
```

### 3. Not Validating Admin Actions

**Incorrect:**

```typescript
// API route
export async function DELETE(req: Request) {
  const { userId } = await req.json()
  // No authorization check - anyone can delete any user!
  await supabaseAdmin.auth.admin.deleteUser(userId)
}
```

**Correct:**

```typescript
export async function DELETE(req: Request) {
  // Verify the requester is an admin
  const supabase = createServerClient(/* ... */)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Check admin status
  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!admin) {
    return new Response('Forbidden', { status: 403 })
  }

  // Now safe to perform admin action
  const { userId } = await req.json()
  await supabaseAdmin.auth.admin.deleteUser(userId)
}
```

### 4. Admin Client with User Session

**Incorrect:**

```typescript
// SSR: Creating admin client but also reading cookies
const supabaseAdmin = createServerClient(url, serviceRoleKey, {
  cookies: {
    getAll() { return cookieStore.getAll() },
    // ...
  },
})
// If user session exists, it uses user's permissions, NOT service role!
```

**Correct:**

```typescript
// Admin client should NOT use cookies
const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Separate user client for auth checking
const supabaseUser = createServerClient(url, anonKey, {
  cookies: { /* ... */ },
})
```

### 5. Hardcoding Service Role Key

**Incorrect:**

```typescript
const supabaseAdmin = createClient(url, 'eyJhbGciOiJIUzI1NiIs...')
// Key in source code - leaked in version control
```

**Correct:**

```typescript
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
// Key in environment variables
```

## Admin API Methods

| Method | Purpose |
|--------|---------|
| `createUser` | Create new user with optional auto-confirm |
| `deleteUser` | Permanently delete user |
| `updateUserById` | Update any user field including app_metadata |
| `listUsers` | Paginated list of all users |
| `getUserById` | Get specific user details |
| `inviteUserByEmail` | Send invitation email |
| `generateLink` | Create magic/recovery/invite links |

## Related

- [server-ssr.md](server-ssr.md) - Server-side auth for user operations
- [hooks-custom-claims.md](hooks-custom-claims.md) - Adding custom claims
- [../db/security-service-role.md](../db/security-service-role.md) - Service role security
- [Docs: Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
