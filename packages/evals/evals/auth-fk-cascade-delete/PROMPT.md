I'm building a Supabase app and need to set up a `profiles` table. Every user who signs up should automatically get a profile row containing their `id`, `email`, and `full_name` (pulled from signup metadata).

Please create a SQL migration in `supabase/migrations/` that:

1. Creates the `profiles` table linked to Supabase Auth users
2. Sets up a trigger so a profile row is created automatically whenever a new user signs up
3. Enables Row Level Security so users can only read and update their own profile
