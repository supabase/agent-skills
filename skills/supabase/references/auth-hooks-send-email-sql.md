---
title: Send Email Hook via SQL (PostgreSQL Function)
impact: MEDIUM
impactDescription: Queue-based email sending with PostgreSQL for batch processing and reliability
tags: auth, hooks, email, postgresql, pg_cron, sql, queue
---

## Send Email Hook via SQL (PostgreSQL Function)

Use a PostgreSQL function to intercept auth emails. Instead of sending immediately, messages are queued in a table and sent in periodic intervals via `pg_cron` and an Edge Function.

## When to Use

- **Batch processing**: Send emails in periodic intervals instead of real-time
- **Queue reliability**: Messages persisted in the database before sending
- **No external dependencies at hook time**: The hook itself is a pure SQL function
- **Audit trail**: Full record of all email sends in your database

## Setup

### Step 1: Create the Messages Table

```sql
create table public.email_queue (
  id bigint primary key generated always as identity,
  receiver jsonb not null,       -- { "email": "user@example.com" }
  subject text not null,
  body text not null,
  data jsonb,                    -- additional template data
  created_at timestamptz default now(),
  sent_at timestamptz
);
```

### Step 2: Create the Hook Function

```sql
create or replace function public.custom_send_email(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  receiver jsonb;
  action_type text;
  token text;
  token_hash text;
  token_new text;
  token_hash_new text;
  site_url text;
  redirect_to text;
  subject text;
  body text;
begin
  receiver := event -> 'user' -> 'email';
  action_type := event -> 'email_data' ->> 'email_action_type';
  token := event -> 'email_data' ->> 'token';
  token_new := event -> 'email_data' ->> 'token_new';
  site_url := event -> 'email_data' ->> 'site_url';
  redirect_to := event -> 'email_data' ->> 'redirect_to';

  -- Counterintuitive naming (backward compatibility):
  -- token_hash_new → use with CURRENT email and token
  -- token_hash → use with NEW email and token_new
  token_hash := event -> 'email_data' ->> 'token_hash';
  token_hash_new := event -> 'email_data' ->> 'token_hash_new';

  case action_type
    when 'signup' then
      subject := 'Confirm your email';
      body := format(
        '<h2>Confirm your email</h2><p>Your confirmation code: <strong>%s</strong></p>',
        token
      );
    when 'recovery' then
      subject := 'Reset your password';
      body := format(
        '<h2>Reset password</h2><p>Your reset code: <strong>%s</strong></p>',
        token
      );
    when 'magiclink' then
      subject := 'Your magic link';
      body := format(
        '<h2>Magic Link</h2><p>Your login code: <strong>%s</strong></p>',
        token
      );
    when 'email_change' then
      subject := 'Confirm email change';
      body := format(
        '<h2>Email Change</h2><p>Your confirmation code: <strong>%s</strong></p>',
        token
      );
    when 'invite' then
      subject := 'You have been invited';
      body := format(
        '<h2>Invitation</h2><p>Your invite code: <strong>%s</strong></p>',
        token
      );
    when 'reauthentication' then
      subject := 'Confirm your identity';
      body := format(
        '<h2>Reauthentication</h2><p>Your code: <strong>%s</strong></p>',
        token
      );
    else
      subject := 'Notification';
      body := format('<p>Your code: <strong>%s</strong></p>', token);
  end case;

  insert into public.email_queue (receiver, subject, body, data)
  values (
    jsonb_build_object('email', receiver),
    subject,
    body,
    event -> 'email_data'
  );

  return jsonb_build_object();
end;
$$;

-- Grant execute to supabase_auth_admin and revoke from public roles
grant execute on function public.custom_send_email(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_send_email(jsonb) from authenticated, anon, public;
```

### Step 3: Create the Sender Edge Function

```typescript
// supabase/functions/send-queued-emails/index.ts
import { Resend } from "npm:resend";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // Fetch unsent messages
  const { data: messages, error } = await supabase
    .from("email_queue")
    .select("*")
    .is("sent_at", null)
    .order("created_at")
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  let sent = 0;
  for (const msg of messages ?? []) {
    const { error: sendError } = await resend.emails.send({
      from: "noreply <noreply@yourapp.com>",
      to: [msg.receiver.email],
      subject: msg.subject,
      html: msg.body,
    });

    if (!sendError) {
      await supabase
        .from("email_queue")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", msg.id);
      sent++;
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Step 4: Schedule with pg_cron

```sql
-- Enable pg_cron if not already enabled
create extension if not exists pg_cron;

-- Run every minute (adjust interval as needed — see crontab.guru)
select cron.schedule(
  'send-queued-emails',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-queued-emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
```

### Step 5: Enable Hook

Dashboard: **Auth > Hooks > Send Email**

- Enabled: Yes
- Type: PostgreSQL Function
- Schema: `public`
- Function: `custom_send_email`

CLI config (`config.toml`):

```toml
[auth.hook.send_email]
enabled = true
uri = "pg-functions://postgres/public/custom_send_email"
```

## Email Action Types

| Type | Trigger |
|------|---------|
| `signup` | New user signs up with email |
| `recovery` | Password reset requested |
| `magiclink` | Magic link sign-in |
| `email_change` | User changes email address |
| `invite` | User invited to project |
| `reauthentication` | Reauthentication required |

## Secure Email Change (Counterintuitive Field Naming)

The token hash field names are **reversed** due to backward compatibility:

- `token_hash_new` → use with the **current** email address and `token`
- `token_hash` → use with the **new** email address and `token_new`

Do **not** assume the `_new` suffix refers to the new email address.

## Common Mistakes

### Forgetting Permission Grants

**Incorrect:**

```sql
-- Function created but no grants — auth hook fails silently
create or replace function public.custom_send_email(event jsonb) ...
```

**Correct:**

```sql
grant execute on function public.custom_send_email(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_send_email(jsonb) from authenticated, anon, public;
```

### Not Returning an Empty JSON Object

The hook expects a `jsonb` return. Returning `null` or nothing causes the auth flow to fail.

**Incorrect:**

```sql
-- Missing return
return null;
```

**Correct:**

```sql
return jsonb_build_object();
```

## Behavior Matrix

| Email Provider | Auth Hook | Result |
|---|---|---|
| Enabled | Enabled | Hook handles sending |
| Enabled | Disabled | SMTP handles sending |
| Disabled | Enabled | Email signups disabled |
| Disabled | Disabled | Email signups disabled |

## Related

- [auth-hooks-send-email-http.md](auth-hooks-send-email-http.md) - HTTP (Edge Function) approach
- [Docs: Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- [Docs: Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
