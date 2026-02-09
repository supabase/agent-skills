---
title: CLI Secrets Commands
impact: MEDIUM
impactDescription: Commands for managing production environment variables
tags: cli, secrets, env, set, list
---

## CLI Secrets Commands

Commands for setting and listing production secrets for Edge Functions.

**Incorrect:**

```bash
# Committing secrets to version control
echo "STRIPE_KEY=sk_live_xxx" >> .env
git add .env  # Exposed in repo!
```

**Correct:**

```bash
# Use CLI for production secrets
supabase secrets set STRIPE_KEY=sk_live_xxx
# Or from gitignored file
supabase secrets set --env-file .env.production
```

---

## supabase secrets set

Set production environment variables.

```bash
supabase secrets set MY_KEY=value           # Single secret
supabase secrets set KEY1=val1 KEY2=val2    # Multiple
supabase secrets set --env-file .env        # From file
```

**Flags:** `--env-file`

**Built-in secrets** (auto-available in Edge Functions):
- `SUPABASE_URL` - Project API URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `SUPABASE_DB_URL` - Database connection URL

---

## supabase secrets list

List secret names (not values).

```bash
supabase secrets list
```

**Output:**
```text
NAME
STRIPE_KEY
MY_API_KEY
```

**Note:** Shows names only for security. Can't retrieve values via CLI.

---

## Local vs Production

| Environment | How to Set |
|-------------|------------|
| Local | `supabase/functions/.env` file (gitignored) |
| Production | `supabase secrets set` |

## Related

- [functions-commands.md](functions-commands.md) - Deploy functions
