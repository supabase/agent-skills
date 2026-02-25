# Scenario: edge-function-hello-world

## Summary

The agent must initialize a Supabase project, create a "hello-world" Edge
Function with proper project structure, CORS handling, error handling, and JSON
responses, plus a shared CORS utility in the `_shared/` folder. This tests the
fundamental Edge Function setup workflow that every Supabase developer
encounters first.

## Real-World Justification

Why this is a common and important workflow:

1. **Edge Function quickstart is the most common entry point** -- The Supabase
   Edge Functions quickstart guide is the canonical first step for developers
   adopting serverless functions. The CLI workflow (`supabase init`,
   `functions new`, `functions serve`) is documented as the primary onboarding
   path.
   - Source: https://supabase.com/docs/guides/functions/quickstart

2. **CORS is the number one pain point for Edge Function beginners** -- GitHub
   issues show CORS errors are the most frequently reported Edge Function
   problem. Developers forget to handle OPTIONS preflight requests, omit CORS
   headers from error responses, or fail to include `x-client-info` and
   `apikey` in allowed headers. Multiple issues spanning 2022-2025 document
   this.
   - Source: https://github.com/supabase/supabase/issues/6267
   - Source: https://github.com/orgs/supabase/discussions/29485
   - Source: https://supabase.com/docs/guides/functions/cors

3. **Shared code structure with `_shared/` is frequently misunderstood** --
   Developers put shared utilities in folders without the underscore prefix,
   causing them to be deployed as separate functions. The `_shared/` convention
   and `import_map.json` placement are Supabase-specific patterns not obvious
   from general Deno knowledge.
   - Source: https://github.com/orgs/supabase/discussions/8723
   - Source: https://supabase.com/docs/guides/functions/development-tips

## Skill References Exercised

Which reference files the agent should consult and what each teaches:

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/edge-fun-quickstart.md` | `Deno.serve()` handler, CLI workflow, JSON response with Content-Type header, error handling for JSON parsing | Use `Deno.serve()`, return JSON with proper Content-Type, wrap in try/catch |
| `references/edge-fun-project-structure.md` | `_shared/` folder convention, hyphenated function names, `import_map.json` placement | Create `_shared/cors.ts`, use hyphens in function name |
| `references/edge-pat-cors.md` | CORS headers object, OPTIONS preflight handling, CORS on error responses | Handle OPTIONS, include CORS headers in all responses including errors |
| `references/edge-pat-error-handling.md` | Proper error status codes, `console.error` for internal logging, CORS on errors, import from `_shared/cors.ts` | Return 400 for bad input, include CORS headers on error response |
| `references/dev-getting-started.md` | `npx supabase init`, project directory structure | Initialize supabase project correctly |

## Workspace Setup

What the workspace starts with before the agent runs:

- Empty workspace (no `supabase/` directory)
- The agent is expected to initialize the project and create all files

## Agent Task (PROMPT.md draft)

The prompt to give the agent. Written as a developer would ask it -- no hints
about best practices or what the tests check:

> I want to create my first Supabase Edge Function. Set up the project and
> create a "hello-world" function that:
>
> 1. Accepts a POST request with a JSON body containing a `name` field
> 2. Returns a JSON response like `{ "message": "Hello {name}!" }`
> 3. Works when called from a browser (frontend app)
> 4. Handles bad input gracefully
>
> I also want the project organized so I can add more functions later and share
> common code between them.

## Evaluation Criteria

What vitest should assert on the agent's output. Each assertion tests a
specific quality signal:

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | supabase project initialized | `supabase/config.toml` exists | structure |
| 2 | function directory exists | `supabase/functions/hello-world/` directory exists | structure |
| 3 | function index file exists | `supabase/functions/hello-world/index.ts` exists | structure |
| 4 | uses Deno.serve | Function code contains `Deno.serve` (not legacy `serve` import from std) | correctness |
| 5 | returns JSON response | Response includes `Content-Type: application/json` header or uses `Response.json` | correctness |
| 6 | handles OPTIONS preflight | Code checks for `req.method === "OPTIONS"` or equivalent | correctness |
| 7 | defines CORS headers | Code defines Access-Control-Allow-Origin header | security |
| 8 | CORS allows required headers | CORS config includes `authorization` and `apikey` in allowed headers | security |
| 9 | error response has CORS headers | Error/catch response also includes CORS headers | security |
| 10 | has try-catch for error handling | Function body wrapped in try/catch | correctness |
| 11 | returns proper error status code | Error response uses status 400 or 500 (not default 200) | correctness |
| 12 | shared CORS module exists | A `_shared/cors.ts` (or similar) file exists under `supabase/functions/` | structure |
| 13 | function imports from shared | Function code imports from `../_shared/` relative path | structure |
| 14 | function uses hyphenated name | Function directory uses hyphens not underscores | structure |

## Reasoning

Step-by-step reasoning for why this scenario is well-designed:

1. **Baseline differentiator:** An agent without the skill would likely: (a)
   use the deprecated `serve` import from `deno.land/std` instead of built-in
   `Deno.serve`, (b) forget to handle OPTIONS preflight requests entirely,
   (c) omit CORS headers from error responses while including them on success,
   (d) put shared code in a `shared/` folder without the underscore prefix,
   (e) miss including `apikey` and `x-client-info` in the
   Access-Control-Allow-Headers list, (f) return errors with status 200.

2. **Skill value:** The quickstart reference teaches `Deno.serve()` and proper
   JSON error handling. The CORS reference shows the exact headers needed and
   the OPTIONS handler pattern. The project structure reference teaches the
   `_shared/` convention. The error handling reference shows CORS on errors
   and proper status codes. Together these 5 references cover every
   assertion.

3. **Testability:** All assertions are file-existence checks or regex/string
   matches on TypeScript source code. No runtime execution needed.

4. **Realism:** Creating a first Edge Function with CORS support for a
   frontend app is the literal first thing every Supabase developer does when
   adopting Edge Functions. The Supabase quickstart guide documents exactly
   this workflow.

## Difficulty

**Rating:** EASY

- Without skill: ~45-60% of assertions expected to pass
- With skill: ~90-100% of assertions expected to pass
- **pass_threshold:** 13
