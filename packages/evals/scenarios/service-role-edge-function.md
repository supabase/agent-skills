# Scenario: service-role-edge-function

## Summary

The agent must create a simple Edge Function that performs an admin operation
(listing all users' records) using the service role key server-side, while
a companion migration shows the table uses the anon key for browser access.
The trap is accidentally exposing the service role key or using it in
client-facing code.

## Real-World Justification

Why this is a common and important workflow:

1. **Dedicated troubleshooting entry** — The Supabase troubleshooting guide
   contains "Why is my service role key client getting RLS errors or not
   returning data?" — developers incorrectly use the service role key in
   contexts where it should not be used, or use the anon key where service role
   is needed.
   - Source: https://supabase.com/docs/guides/troubleshooting
2. **Most dangerous Supabase mistake** — Exposing the service role key in
   browser JavaScript bypasses all RLS and gives every visitor full database
   access. This appears in multiple Supabase blog posts and community warnings.
   - Source: https://supabase.com/docs/guides/api/api-keys
3. **Environment variable leakage** — The troubleshooting guide warns about
   "Inspecting edge function environment variables" as a debugging topic.
   Developers must use `Deno.env.get()` not hardcoded keys, and never use
   `NEXT_PUBLIC_` prefix for the service role key.
   - Source: https://supabase.com/docs/guides/troubleshooting

## Skill References Exercised

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/db-security-service-role.md` | Never expose service role key in browser, use env vars | `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` in edge function |
| `references/edge-fun-quickstart.md` | Edge function file structure and exports | Correct `index.ts` in `supabase/functions/` |
| `references/edge-db-supabase-client.md` | Creating supabase client in edge functions | `createClient` with service role for admin ops |
| `references/edge-pat-cors.md` | CORS headers for browser requests | CORS on the response |
| `references/edge-pat-error-handling.md` | Error responses | Proper error handling |

## Workspace Setup

- Empty workspace with a pre-initialized `supabase/config.toml`
- A migration creating a `reports` table already exists in `supabase/migrations/`

## Agent Task (PROMPT.md draft)

> Create an Edge Function called `admin-reports` that returns all rows from
> the `reports` table, bypassing RLS (it's an admin-only endpoint). The
> function should be in `supabase/functions/admin-reports/index.ts`. Use
> environment variables for any keys — do not hardcode them.

## Evaluation Criteria

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | edge function file exists | `supabase/functions/admin-reports/index.ts` exists | structure |
| 2 | uses Deno.env.get for service key | `Deno.env.get` used to retrieve the service role key | security |
| 3 | no hardcoded service role key | No JWT-like string literal (`eyJ`) as the service role value | security |
| 4 | createClient called with service role | `createClient` receives the service role env var as second arg | correctness |
| 5 | service role key not NEXT_PUBLIC prefixed | No `NEXT_PUBLIC_` prefix on service role variable name | security |
| 6 | CORS headers present | `Access-Control-Allow-Origin` in response headers | correctness |
| 7 | returns JSON response | `Response` with JSON body and content-type | correctness |

## Reasoning

1. **Baseline differentiator:** Agents without the skill sometimes hardcode a
   placeholder key string, forget CORS, or use the wrong env variable name
   pattern.
2. **Skill value:** `db-security-service-role.md` is explicit about env var
   naming rules and the `NEXT_PUBLIC_` anti-pattern. `edge-fun-quickstart.md`
   teaches the Deno.env.get pattern.
3. **Testability:** Checking for `eyJ` hardcoded strings and `NEXT_PUBLIC_`
   prefixes are reliable negative assertions. `Deno.env.get` is a positive
   string check.
4. **Realism:** Admin Edge Functions that bypass RLS are an extremely common
   pattern for dashboards and data exports.

## Difficulty

**Rating:** EASY

- Without skill: ~50% of assertions expected to pass (file exists, createClient
  present, but key handling likely wrong)
- With skill: ~93% of assertions expected to pass
- **pass_threshold:** 8
