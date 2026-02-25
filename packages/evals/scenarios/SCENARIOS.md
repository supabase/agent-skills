# Supabase Skills Eval Scenarios

| # | Scenario | Description |
|---|----------|-------------|
| 1 | [auth-rls-new-project](auth-rls-new-project.md) | Initialize a Supabase project and create a tasks table with RLS |
| 2 | [team-rls-security-definer](team-rls-security-definer.md) | Team-based RLS with security definer helper in a private schema |
| 3 | [storage-rls-user-folders](storage-rls-user-folders.md) | Storage buckets with RLS policies for user-isolated folders |
| 4 | [edge-function-hello-world](edge-function-hello-world.md) | Hello-world Edge Function with CORS and shared utilities |
| 5 | [collaborative-rooms-realtime](collaborative-rooms-realtime.md) | Collaborative rooms with role-based RLS, broadcast triggers, and Realtime authorization |
| 6 | [auth-fk-cascade-delete](auth-fk-cascade-delete.md) | Profiles table with auth.users FK cascade and auto-create trigger |
| 7 | [rls-update-needs-select](rls-update-needs-select.md) | Orders table where UPDATE silently fails without a matching SELECT policy |
| 8 | [extension-wrong-schema](extension-wrong-schema.md) | pgvector extension setup with correct schema placement, HNSW index, and user-scoped RLS |
| 9 | [connection-pooling-prisma](connection-pooling-prisma.md) | Fix Prisma schema to use Supabase transaction-mode pooler (port 6543, pgbouncer=true, directUrl) for serverless deployments |
| 10 | [cli-hallucinated-commands](cli-hallucinated-commands.md) | CLI cheat-sheet that must use only real Supabase CLI commands, avoiding hallucinated `supabase functions log` and `supabase db query` |
| 11 | [postgrest-schema-cache](postgrest-schema-cache.md) | Add columns and a view to an existing table, with NOTIFY pgrst to reload the PostgREST schema cache |
| 12 | [rls-user-metadata-role-check](rls-user-metadata-role-check.md) | Documents table with owner and admin RLS — must use app_metadata not user_metadata for role authorization |
| 13 | [service-role-edge-function](service-role-edge-function.md) | Admin Edge Function that bypasses RLS using the service role key via env vars, never hardcoded |
