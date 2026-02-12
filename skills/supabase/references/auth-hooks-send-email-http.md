---
title: Send Email Hook via HTTP (Edge Function)
impact: MEDIUM
impactDescription: Custom email hooks enable branded templates and third-party email providers
tags: auth, hooks, email, templates, resend, edge-functions, http
---

## Send Email Hook via HTTP (Edge Function)

Use a Supabase Edge Function as an HTTP endpoint to intercept and customize auth emails with your own templates and provider.

## When to Use

- **Custom email design**: Full control over HTML templates
- **Third-party providers**: Resend, SendGrid, Mailgun, Postmark
- **Localization**: Multi-language email support
- **Real-time delivery**: Emails sent immediately on auth events

## Setup

### Step 1: Create Edge Function

```typescript
// supabase/functions/send-email/index.ts
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend";

type EmailActionType =
  | "signup"
  | "recovery"
  | "magiclink"
  | "email_change"
  | "invite"
  | "reauthentication";

interface SendEmailPayload {
  user: {
    email: string;
    email_new?: string;
    user_metadata?: Record<string, any>;
  };
  email_data: {
    token: string;
    token_new: string;
    /**
     * Counterintuitive: token_hash is used with the NEW email address.
     * Do not assume the _new suffix refers to the new email.
     */
    token_hash: string;
    /**
     * Counterintuitive: token_hash_new is used with the CURRENT email address.
     * Do not assume the _new suffix refers to the new email.
     */
    token_hash_new: string;
    redirect_to: string;
    email_action_type: EmailActionType;
    site_url: string;
  };
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string).replace(
  "v1,whsec_",
  ""
);

const subjectMap: Record<EmailActionType, string> = {
  signup: "Confirm your email",
  recovery: "Reset your password",
  magiclink: "Your magic link",
  email_change: "Confirm email change",
  invite: "You've been invited",
  reauthentication: "Confirm your identity",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  try {
    const { user, email_data } = wh.verify(
      payload,
      headers
    ) as SendEmailPayload;

    const subject =
      subjectMap[email_data.email_action_type] ?? "Notification";

    const { error } = await resend.emails.send({
      from: "welcome <onboarding@yourapp.com>",
      to: [user.email],
      subject,
      html: `<p>Your code: <strong>${email_data.token}</strong></p>`,
    });

    if (error) throw error;
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code,
          message: error.message,
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
```

### Step 2: Deploy Function

```bash
supabase functions deploy send-email --no-verify-jwt
```

### Step 3: Set Secrets

```bash
supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_<base64_secret>"
supabase secrets set RESEND_API_KEY=re_xxxxx
```

### Step 4: Enable Hook

Dashboard: **Auth > Hooks > Send Email**

- Enabled: Yes
- URI: `https://<project-ref>.supabase.co/functions/v1/send-email`

CLI config (`config.toml`):

```toml
[auth.hook.send_email]
enabled = true
uri = "https://<project-ref>.supabase.co/functions/v1/send-email"
secrets = "v1,whsec_xxxxx"
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

- `token_hash_new` → use with the **current** email address (`user.email`) and `token`
- `token_hash` → use with the **new** email address (`user.email_new`) and `token_new`

Do **not** assume the `_new` suffix refers to the new email address.

**Secure email change enabled (two OTPs):**

- Send to current email (`user.email`): use `token` / `token_hash_new`
- Send to new email (`user.email_new`): use `token_new` / `token_hash`

**Secure email change disabled (one OTP):**

- Send a single email to the new address using whichever token/hash pair is populated

## Internationalization (Optional)

Ask the user if they want i18n support. If yes, use the user's locale from `user.user_metadata.i18n` (or a similar field) to select localized subjects and templates:

```typescript
const subjects: Record<string, Record<EmailActionType | "email_change_new", string>> = {
  en: {
    signup: "Confirm Your Email",
    recovery: "Reset Your Password",
    invite: "You have been invited",
    magiclink: "Your Magic Link",
    email_change: "Confirm Email Change",
    email_change_new: "Confirm New Email Address",
    reauthentication: "Confirm Reauthentication",
  },
  es: {
    signup: "Confirma tu correo electrónico",
    recovery: "Restablece tu contraseña",
    invite: "Has sido invitado",
    magiclink: "Tu enlace mágico",
    email_change: "Confirma el cambio de correo electrónico",
    email_change_new: "Confirma la Nueva Dirección de Correo",
    reauthentication: "Confirma la reautenticación",
  },
};

const templates: Record<string, Record<EmailActionType | "email_change_new", string>> = {
  en: {
    signup: `<h2>Confirm your email</h2><p>Follow this link to confirm your email:</p><p><a href="{{confirmation_url}}">Confirm your email address</a></p><p>Alternatively, enter the code: {{token}}</p>`,
    recovery: `<h2>Reset password</h2><p>Follow this link to reset the password for your user:</p><p><a href="{{confirmation_url}}">Reset password</a></p><p>Alternatively, enter the code: {{token}}</p>`,
    invite: `<h2>You have been invited</h2><p>You have been invited to create a user on {{site_url}}. Follow this link to accept the invite:</p><p><a href="{{confirmation_url}}">Accept the invite</a></p><p>Alternatively, enter the code: {{token}}</p>`,
    magiclink: `<h2>Magic Link</h2><p>Follow this link to login:</p><p><a href="{{confirmation_url}}">Log In</a></p><p>Alternatively, enter the code: {{token}}</p>`,
    email_change: `<h2>Confirm email address change</h2><p>Follow this link to confirm the update of your email address from {{old_email}} to {{new_email}}:</p><p><a href="{{confirmation_url}}">Change email address</a></p><p>Alternatively, enter the codes: {{token}} and {{new_token}}</p>`,
    email_change_new: `<h2>Confirm New Email Address</h2><p>Follow this link to confirm your new email address:</p><p><a href="{{confirmation_url}}">Confirm new email address</a></p><p>Alternatively, enter the code: {{new_token}}</p>`,
    reauthentication: `<h2>Confirm reauthentication</h2><p>Enter the code: {{token}}</p>`,
  },
  // Add more locales as needed (es, fr, etc.)
};

// Resolve the user's language, defaulting to "en"
const language = user.user_metadata?.i18n || "en";
const subject = subjects[language]?.[email_data.email_action_type] || subjects.en[email_data.email_action_type];
```

## Common Mistakes

### Not Verifying Webhook Signature

**Incorrect:**

```typescript
Deno.serve(async (req) => {
  const data = await req.json();
  // Directly using unverified data - DANGEROUS
  await sendEmail(data.user.email, data.email_data);
});
```

**Correct:**

```typescript
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

Deno.serve(async (req) => {
  const payload = await req.text();
  const wh = new Webhook(HOOK_SECRET);

  try {
    const data = wh.verify(payload, Object.fromEntries(req.headers));
    await sendEmail(data.user.email, data.email_data);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
});
```

### Swapping Token Hash Fields for Email Change

**Incorrect:**

```typescript
// WRONG: assuming _new suffix means the new email
const currentEmailHash = email_data.token_hash;
const newEmailHash = email_data.token_hash_new;
```

**Correct:**

```typescript
// token_hash_new → current email address
// token_hash → new email address
const currentEmailHash = email_data.token_hash_new;
const newEmailHash = email_data.token_hash;
```

## Behavior Matrix

| Email Provider | Auth Hook | Result |
|---|---|---|
| Enabled | Enabled | Hook handles sending |
| Enabled | Disabled | SMTP handles sending |
| Disabled | Enabled | Email signups disabled |
| Disabled | Disabled | Email signups disabled |

## Related

- [auth-hooks-send-email-sql.md](auth-hooks-send-email-sql.md) - SQL (PostgreSQL) approach
- [Docs: Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- [Docs: Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
