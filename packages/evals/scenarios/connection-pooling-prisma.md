# Scenario: connection-pooling-prisma

## Summary

The agent must produce a `DATABASE_URL` configuration and Prisma schema setup
that correctly uses Supabase's transaction-mode pooler (port 6543) with the
`?pgbouncer=true` parameter to disable prepared statements. Without this, Prisma
throws "prepared statement already exists" errors in serverless environments.

## Real-World Justification

Why this is a common and important workflow:

1. **Top troubleshooting entry** — "Error: prepared statement XXX already exists"
   is listed in the Supabase troubleshooting guide under Database Issues as a
   direct consequence of using transaction-mode pooling without disabling
   prepared statements.
   - Source: https://supabase.com/docs/guides/troubleshooting
2. **Serverless deployment reality** — Vercel and other serverless platforms
   are the most popular Supabase deployment targets. Each function invocation
   creates a new connection, making transaction-mode pooling mandatory. The
   Prisma + Supabase combination is the most-searched configuration pairing.
   - Source: https://supabase.com/docs/guides/database/connecting-to-postgres
3. **Connection exhaustion** — Using session mode (port 5432) in serverless
   leads to "remaining connection slots are reserved" errors — another top
   troubleshooting entry. The fix requires switching to port 6543.
   - Source: https://supabase.com/docs/guides/troubleshooting

## Skill References Exercised

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/db-conn-pooling.md` | Transaction mode port 6543, pgbouncer=true for Prisma | Correct DATABASE_URL with port 6543 and ?pgbouncer=true |
| `references/db-migrations-idempotent.md` | Migration file conventions and naming | Migration file in supabase/migrations/ |
| `references/db-schema-auth-fk.md` | Schema best practices for user-linked tables | Proper FK patterns if schema is involved |

## Workspace Setup

- A workspace with `supabase/config.toml` already initialized
- A `prisma/schema.prisma` starter file with a placeholder `DATABASE_URL` using
  direct connection (port 5432, no pgbouncer flag)

## Agent Task (PROMPT.md draft)

> I'm deploying my Supabase app on Vercel using Prisma. I keep getting
> "prepared statement already exists" errors in production. My current
> `DATABASE_URL` in `prisma/schema.prisma` uses the direct connection string.
> Fix the Prisma configuration so it works correctly with Supabase's connection
> pooler.

## Evaluation Criteria

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | prisma schema references pooler port | `DATABASE_URL` or connection hint references port `6543` | correctness |
| 2 | pgbouncer=true param present | `?pgbouncer=true` or `pgbouncer=true` in the connection URL or env comment | correctness |
| 3 | DIRECT_URL provided for migrations | A separate `directUrl` or `DIRECT_URL` variable defined for Prisma migrations | correctness |
| 4 | connection limit set to 1 | `connection_limit=1` in the pooler URL or Prisma datasource | performance |
| 5 | explanation distinguishes port 6543 vs 5432 | Output or comments distinguish transaction mode (6543) from direct (5432) | correctness |

## Reasoning

1. **Baseline differentiator:** An agent without the skill typically updates
   the port or adds pgbouncer but forgets `DIRECT_URL` for migrations, or sets
   `max` connections too high, or uses session mode instead of transaction mode.
2. **Skill value:** `db-conn-pooling.md` provides the exact pattern: port 6543,
   `?pgbouncer=true`, `max: 1` per serverless instance.
3. **Testability:** Port numbers and query parameters are directly readable as
   string patterns in the output files.
4. **Realism:** "Prisma prepared statement already exists on Supabase" is one
   of the most-searched Supabase error messages on Stack Overflow and GitHub.

## Difficulty

**Rating:** MEDIUM

- Without skill: ~30% of assertions expected to pass (agent may change port but
  likely misses pgbouncer param and DIRECT_URL)
- With skill: ~90% of assertions expected to pass
- **pass_threshold:** 7
