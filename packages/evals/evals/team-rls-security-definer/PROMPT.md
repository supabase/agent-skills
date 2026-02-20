I'm building a project management app where users can belong to multiple organizations. Each organization has projects that all members can view and edit.

The Supabase project is already initialized in the `supabase/` directory. Create a SQL migration with:

1. An `organizations` table (name, slug)
2. A `memberships` table linking users to organizations with a role column (owner, admin, member)
3. A `projects` table (name, description, status) belonging to an organization

Set up Row Level Security so:
- Users can only see organizations they belong to
- Users can only see and manage projects in their organizations
- Only org owners can delete projects

The migration should handle the case where a user is deleted from auth.
