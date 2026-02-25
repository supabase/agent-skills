I'm building a task management app. Users sign up with email/password and should only see their own tasks.

A Supabase project is already initialized and running locally. The `supabase/` directory and `config.toml` are already set up — do not run `supabase init` or `supabase start`.

Create a SQL migration for a tasks table:

1. Create a new migration file with `npx supabase migration new`
2. Write the migration SQL with:
   - A `tasks` table with columns: title (text), description (text), status (text), due_date (timestamptz)
   - Link tasks to authenticated users (foreign key to `auth.users`)
   - Enable Row Level Security
   - RLS policies so users can only CRUD their own tasks
   - Appropriate indexes
   - Idempotent (safe to run multiple times)
3. Apply the migration with `npx supabase db push`
