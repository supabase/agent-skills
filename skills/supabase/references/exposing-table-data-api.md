# Exposing a Table to the Data API

After creating a table that needs to be accessible via the Data API (PostgREST), follow these steps:

**Step 1 — Check existing privileges**

```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'your_table'
AND grantee IN ('anon', 'authenticated', 'service_role');
```

If the result is empty, the table has no API access. Proceed to step 2.

**Step 2 — Grant role privileges**

```sql
-- anon: read-only public access
GRANT SELECT ON public.your_table TO anon;
-- authenticated: full CRUD (RLS policies will restrict which rows)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO authenticated;
-- service_role: full access, bypasses RLS
GRANT ALL ON public.your_table TO service_role;
```

Only grant the roles the table actually needs (e.g. omit `anon` for user-private tables).

**Step 3 — Enable RLS**

Tables must never be publicly exposed without row-level access control.

```sql
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
```

**Step 4 — Write RLS policies**

Define policies appropriate to the table's access model (see https://supabase.com/docs/guides/database/postgres/row-level-security.md).

**Error recovery:** If a query fails with a permission error, read the `hint` field in the error response — it will indicate missing grants and allow you to self-correct.
