# Scenario: collaborative-rooms-realtime

## Summary

The agent must create SQL migrations for a collaborative app with rooms (shared
spaces), membership with roles (owner, editor, viewer), and content sharing.
The migration must implement role-based RLS policies so users only see rooms
they belong to, enforce role-specific write permissions, configure Realtime
(publication + broadcast triggers), and set up RLS on `realtime.messages` so
only room members receive live updates.

## Real-World Justification

Why this is a common and important workflow:

1. **Room-based collaboration with membership is the canonical Realtime use
   case** -- The Supabase Realtime documentation uses rooms and room_users
   as its primary example for authorization policies, and the official
   `realtime.topic()` function is designed specifically for this pattern.
   - Source: https://supabase.com/docs/guides/realtime/authorization
   - Source: https://github.com/orgs/supabase/discussions/22484

2. **Realtime + RLS is the most common source of broken subscriptions** --
   GitHub issues show dozens of developers hitting CHANNEL_ERROR or silent
   failures when combining private channels with RLS policies. Getting the
   `realtime.messages` policies correct (checking `extension`, using
   `realtime.topic()`, matching private flag) is non-obvious and
   well-documented as a pain point.
   - Source: https://github.com/supabase/realtime/issues/1111
   - Source: https://github.com/supabase/supabase-js/issues/1733
   - Source: https://github.com/orgs/supabase/discussions/7630

3. **Broadcast from database triggers is the recommended pattern over Postgres
   Changes** -- The Supabase docs explicitly recommend
   `realtime.broadcast_changes()` for scalability, since Postgres Changes
   processes on a single thread and triggers per-subscriber RLS checks. Many
   developers still use the older pattern and hit scaling walls.
   - Source: https://supabase.com/docs/guides/realtime/broadcast
   - Source: https://supabase.com/blog/realtime-broadcast-from-database

4. **Role-based content access with multiple permission levels is a top RBAC
   question** -- The Supabase RBAC discussion and community guides show
   developers building exactly this pattern (owner/editor/viewer roles on
   shared resources) and struggling with correct policy structure.
   - Source: https://github.com/orgs/supabase/discussions/346
   - Source: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
   - Source: https://makerkit.dev/blog/tutorials/supabase-rls-best-practices

## Skill References Exercised

Which reference files the agent should consult and what each teaches:

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/db-rls-mandatory.md` | RLS must be enabled on all public tables | Enable RLS on rooms, room_members, and content tables |
| `references/db-rls-common-mistakes.md` | Missing TO clause, missing SELECT policy for UPDATE | Always use `TO authenticated`, provide SELECT policies alongside UPDATE |
| `references/db-rls-performance.md` | Wrap auth.uid() in SELECT, use security_definer for joins | Use `(select auth.uid())` form, helper function for membership lookups |
| `references/db-security-functions.md` | security_definer in private schema with search_path = '' | Create membership helper in private schema |
| `references/db-schema-auth-fk.md` | FK to auth.users with ON DELETE CASCADE | Reference auth.users with cascade on room_members |
| `references/db-schema-timestamps.md` | Use timestamptz not timestamp | All time columns use timestamptz |
| `references/db-schema-realtime.md` | Tables need PKs for Realtime, enable publication, replica identity | Add table to supabase_realtime publication, set replica identity full |
| `references/db-perf-indexes.md` | Index columns used in RLS policy lookups | Index user_id and room_id on membership table |
| `references/db-migrations-idempotent.md` | IF NOT EXISTS for safe reruns | Idempotent DDL throughout |
| `references/realtime-setup-auth.md` | Private channels require RLS on realtime.messages | Create RLS policies on realtime.messages with extension checks |
| `references/realtime-broadcast-database.md` | Use realtime.broadcast_changes() from triggers | Create trigger using realtime.broadcast_changes for content changes |
| `references/realtime-setup-channels.md` | Topic naming convention scope:id:entity | Trigger topic should follow room:{id} pattern |

## Workspace Setup

What the workspace starts with before the agent runs:

- Pre-initialized Supabase project (`supabase/config.toml` exists)
- Empty `supabase/migrations/` directory
- The agent creates migration files within this structure

## Agent Task (PROMPT.md draft)

The prompt to give the agent:

> Build a collaborative app where users can create rooms (shared spaces for
> group work), invite other users to join their rooms, and share content within
> them. Users should only see rooms they've been invited to or created. Room
> owners can manage members, editors can create and modify content, and viewers
> can only read. All changes should appear in real-time.

## Evaluation Criteria

What vitest should assert on the agent's output. Each assertion tests a
specific quality signal:

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | migration file exists | A `.sql` file exists in `supabase/migrations/` | structure |
| 2 | creates rooms table | SQL contains `CREATE TABLE` for rooms | correctness |
| 3 | creates room_members table | SQL contains `CREATE TABLE` for room_members/memberships | correctness |
| 4 | creates content table | SQL contains `CREATE TABLE` for content/items | correctness |
| 5 | room_members has role column | The membership table includes a role column (owner/editor/viewer) | correctness |
| 6 | enables RLS on all tables | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for all application tables | security |
| 7 | FK to auth.users with ON DELETE CASCADE | room_members references `auth.users` with cascade | correctness |
| 8 | room_id FK on content | content references rooms | correctness |
| 9 | policies use (select auth.uid()) | Subselect form in all policies referencing auth.uid() | performance |
| 10 | policies use TO authenticated | All policies scoped to authenticated role | security |
| 11 | private schema for helper function | A `CREATE SCHEMA ... private` and security_definer helper with `SET search_path = ''` | security |
| 12 | role-based write policies | Content INSERT/UPDATE restricted to owner/editor roles | security |
| 13 | viewer read-only enforcement | Viewer role can SELECT but not INSERT/UPDATE/DELETE content | security |
| 14 | indexes on membership lookup columns | `CREATE INDEX` on user_id and/or room_id in room_members | performance |
| 15 | uses timestamptz | No plain `timestamp` for time columns | correctness |
| 16 | idempotent DDL | Uses `IF NOT EXISTS` or `DROP ... IF EXISTS` patterns | idempotency |
| 17 | realtime publication enabled | `ALTER PUBLICATION supabase_realtime ADD TABLE` for content table | realtime |
| 18 | broadcast trigger for content changes | A trigger using `realtime.broadcast_changes()` or `realtime.send()` on content | realtime |
| 19 | trigger function is security definer | The broadcast trigger function uses `SECURITY DEFINER` and `SET search_path = ''` | security |
| 20 | RLS on realtime.messages | At least one policy on `realtime.messages` for authenticated users | realtime |
| 21 | realtime policy checks extension | The realtime.messages policy references the `extension` column (broadcast/presence) | realtime |
| 22 | overall quality score | At least 14 of 18 best-practice signals present | overall |

## Reasoning

Step-by-step reasoning for why this scenario is well-designed:

1. **Baseline differentiator:** An agent without the skill would likely: (a) use
   Postgres Changes instead of broadcast triggers for realtime, (b) omit RLS on
   `realtime.messages` entirely, (c) not know about `realtime.topic()` or the
   `extension` column check, (d) use bare `auth.uid()` instead of the subselect
   form, (e) put helper functions in the public schema, and (f) forget that
   broadcast trigger functions need `SECURITY DEFINER` with `SET search_path =
   ''`. These are all patterns that require reading multiple specific reference
   files.

2. **Skill value:** This scenario exercises 12+ reference files spanning
   database, security, and realtime sections. The skill teaches: (a) broadcast
   triggers over Postgres Changes for scalability, (b) `realtime.messages` RLS
   with extension checks, (c) private schema for security_definer functions,
   (d) `(select auth.uid())` caching, (e) role-based policy patterns, and (f)
   publication configuration. No single reference file is sufficient -- the
   agent must synthesize knowledge across sections.

3. **Testability:** Every assertion checks for specific SQL patterns via regex.
   The realtime-specific patterns (publication, broadcast_changes/send, trigger
   creation, realtime.messages policies, extension column) are all highly
   distinctive strings that reliably differentiate skill-guided output. The
   role-based policies (owner/editor/viewer) are checkable via string matching
   in policy definitions.

4. **Realism:** This is exactly what developers build with Supabase Realtime --
   collaborative rooms with membership. The Supabase authorization docs use
   `room_users` as the primary example. GitHub has dozens of issues from
   developers trying to combine private channels with RLS policies for room-
   based apps (chat apps, Figma clones, shared whiteboards, collaborative
   editors).

## Difficulty

**Rating:** HARD

- Without skill: ~25-40% of assertions expected to pass
- With skill: ~80-90% of assertions expected to pass
- **pass_threshold:** 17
