---
title: Implement Secure User Sign-Up
impact: CRITICAL
impactDescription: Foundation of user registration - mistakes lead to security vulnerabilities or broken flows
tags: auth, signup, registration, email-confirmation, user-metadata
---

## Implement Secure User Sign-Up

User registration with email/password, including confirmation flow and metadata handling.

## Quick Start

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123',
  options: {
    data: {
      full_name: 'John Doe',
    },
    emailRedirectTo: 'https://yourapp.com/auth/callback',
  },
})

// Check if email confirmation is required
if (data.user && !data.session) {
  // Email confirmation enabled - user must verify email
  console.log('Check your email for confirmation link')
}
```

## User Metadata

Store user-specific data at sign-up using `options.data`:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'Jane Smith',
      avatar_url: 'https://example.com/avatar.png',
      organization: 'Acme Inc',
    },
  },
})

// Access metadata later
const name = data.user?.user_metadata?.full_name
```

**Important:** `user_metadata` is user-modifiable. Never use it for authorization decisions like roles or permissions. Use `app_metadata` (set server-side only) for that.

## Common Mistakes

### 1. Not Handling Email Confirmation State

**Incorrect:**

```typescript
const { data, error } = await supabase.auth.signUp({ email, password })
if (data.user) {
  // Assumes user is logged in
  router.push('/dashboard')
}
```

**Correct:**

```typescript
const { data, error } = await supabase.auth.signUp({ email, password })
if (error) {
  showError(error.message)
} else if (data.user && !data.session) {
  // Email confirmation required
  showMessage('Please check your email to confirm your account')
} else if (data.session) {
  // Email confirmation disabled - user is logged in
  router.push('/dashboard')
}
```

### 2. Missing Redirect URL Configuration

**Incorrect:**

```typescript
// Redirect URL not in allowlist - will fail silently
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: 'https://myapp.com/welcome',
  },
})
```

**Correct:**

1. Add redirect URL to Dashboard: Auth > URL Configuration > Redirect URLs
2. Then use it in code:

```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: 'https://myapp.com/welcome', // Must be in allowlist
  },
})
```

### 3. Exposing Whether Email Exists

**Incorrect:**

```typescript
if (error?.message.includes('already registered')) {
  showError('This email is already taken')
}
```

**Correct:**

```typescript
// Show generic message to prevent email enumeration
if (error) {
  showError('Unable to create account. Please try again.')
}
// For legitimate users, they can use password reset
```

## Create User Profile on Sign-Up

Use a database trigger to auto-create profiles:

```sql
-- Create profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## Related

- [core-sessions.md](core-sessions.md) - Session management after sign-up
- [Docs: Sign Up](https://supabase.com/docs/reference/javascript/auth-signup)
- [Docs: Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
