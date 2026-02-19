I'm starting a new Supabase project from scratch for a task management app. Users should sign up with email/password, and each user should only see their own tasks.

Set up the project:

1. Initialize the Supabase project with the CLI (`npx supabase init`)
2. Start the local Supabase stack (`npx supabase start`)
3. Create a SQL migration for a tasks table with columns: title (text), description (text), status (text), and due_date

The migration must:

- Create the tasks table with proper column types
- Link tasks to authenticated users
- Enable Row Level Security
- Create policies so users can only CRUD their own tasks
- Add appropriate indexes
- Be idempotent (safe to run multiple times)
