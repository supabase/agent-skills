# Getting Started

Contributor guide for adding content to the Supabase Agent Skills.

## Quick Start

1. Create a reference file in `skills/supabase/references/`
2. Use `skills/supabase/references/_template.md` as your starting point
3. Update `skills/supabase/SKILL.md` to reference your new file
4. Run `npm run build && npm run check`

## Creating Reference Files

```bash
# Main topic
skills/supabase/references/{feature}.md

# Sub-topics (optional)
skills/supabase/references/{feature}/{subtopic}.md
```

**Examples:**

- `references/auth.md` - Authentication overview
- `references/auth/nextjs.md` - Auth setup for Next.js
- `references/storage.md` - Storage overview

## Writing Guidelines

Follow the [Agent Skills Open Standard](https://agentskills.io/) best practices:

1. **Concise is key** - Only include what Claude doesn't already know
2. **Show, don't tell** - Prefer code examples over explanations
3. **Progressive disclosure** - Keep SKILL.md lean, put details in reference files
4. **Concrete examples** - Include runnable code with real values
5. **Common mistakes first** - Help agents avoid pitfalls

**Good example** (~50 tokens):

```typescript
// Get user session
const { data: { session } } = await supabase.auth.getSession();
```

**Avoid** (~150 tokens):

```markdown
Sessions are a way to track authenticated users. When a user logs in,
a session is created. You can get the current session using the
getSession method which returns a promise...
```

## Update SKILL.md

Add your reference to the resources table:

```markdown
| Area         | Resource                | When to Use                    |
| ------------ | ----------------------- | ------------------------------ |
| Your Feature | `references/feature.md` | Brief description of use cases |
```

## Validate

```bash
npm run validate -- supabase   # Check files
npm run build -- supabase      # Generate AGENTS.md
npm run check                  # Format and lint
```
