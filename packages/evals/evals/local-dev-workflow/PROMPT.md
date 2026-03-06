I'm building a blog app. Users sign up with email/password and should only see their own posts.

A Supabase project is already initialized but it's not running locally.

Create a `posts` table with:

1. (Use `execute_sql` via the local MCP server to iterate on the schema:)
   - A `posts` table with columns: title (text), content (text), published (boolean)
   - Link posts to authenticated users (foreign key to `auth.users`)
   - Enable Row Level Security
   - RLS policies so users can only CRUD their own posts
   - Appropriate indexes
2. Check for security and performance issues of the project (get_advisors MCP call)
3. Commit the schema to a migration file (using `npx supabase db pull` with the `--local` flag)
4. Generate the TypeScript types (with `npx supabase gen types --local`)

(Do not use psql. Do not manually write migration files — use the iterate-then-commit workflow.)
