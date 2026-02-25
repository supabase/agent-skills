I'm building an internal admin dashboard for my app. I need a Supabase Edge Function called `admin-reports` that returns all rows from the `reports` table — this is an admin-only endpoint so it needs to bypass Row Level Security.

Create the function at `supabase/functions/admin-reports/index.ts`. Use environment variables for any Supabase keys — do not hardcode them in the source code.

The function should:

1. Return all rows from the `reports` table as a JSON response
2. Work when called from a browser (handle CORS)
3. Handle errors gracefully
