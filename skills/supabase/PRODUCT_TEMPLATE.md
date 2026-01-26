# Product Team Contribution Guide

This document provides step-by-step instructions for adding your product's content to the Supabase Agent Skills.

## Structure Overview

This skill follows the [Agent Skills Open Standard](https://agentskills.io/specification):

```
skills/supabase/
├── SKILL.md                    # Entry point (update when adding sections)
├── AGENTS.md                   # [GENERATED] Do not edit directly
└── references/
    ├── _sections.md            # Section definitions
    ├── _template.md            # Reference template
    ├── _contributing.md        # Writing guidelines
    └── {prefix}-{name}.md      # Your reference files
```

---

## Step 1: Setup Your Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/supabase-skill-{your-product}
```

---

## Step 2: Identify Your Section

Check `references/_sections.md` for your product's section and prefix:

| Product          | Section | Prefix      |
| ---------------- | ------- | ----------- |
| Getting Started  | 1       | `setup`     |
| Auth             | 2       | `auth`      |
| Database         | 3       | `database`  |
| Storage          | 4       | `storage`   |
| Edge Functions   | 5       | `functions` |
| Realtime         | 6       | `realtime`  |
| Client Libraries | 7       | `client`    |
| CLI & Tools      | 8       | `cli`       |

---

## Step 3: Create Your Reference Files

Copy the template and create reference files:

```bash
cp references/_template.md references/{prefix}-{topic}.md
```

**Example file names:**

- `auth-nextjs-setup.md` - Next.js authentication setup
- `auth-rls-policies.md` - Row Level Security patterns
- `storage-upload-files.md` - File upload guide
- `functions-deploy.md` - Edge Functions deployment

---

## Step 4: Fill In the Template

Each reference file must have:

### Required Frontmatter

```yaml
---
title: Set Up Authentication with Next.js
impact: HIGH
impactDescription: Enables secure user authentication in 5 minutes
tags: auth, nextjs, setup, authentication
---
```

### Required Content

```markdown
## Set Up Authentication with Next.js

Brief explanation of what this guide covers and why it matters.

**Incorrect (describe the problem):**

\`\`\`typescript
// Bad pattern with explanation
\`\`\`

**Correct (describe the solution):**

\`\`\`typescript
// Good pattern with explanation
\`\`\`

Reference: [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
```

---

## Step 5: Content Guidelines

### DO:

- Use concrete TypeScript/JavaScript examples
- Show **Incorrect** vs **Correct** patterns
- Include error messages developers might encounter
- Keep examples under 30 lines each
- Add comments explaining _why_, not _what_

### DON'T:

- Duplicate official documentation verbatim
- Include time-sensitive content (versions, dates)
- Assume prior Supabase knowledge
- Use placeholder names like `foo`, `bar`, `data`

---

## Step 6: Validate and Build

```bash
# Validate your reference files
npm run validate -- supabase

# Build AGENTS.md
npm run build -- supabase

# Run formatting
npm run check
```

Fix any validation errors before proceeding.

---

## Step 7: Open Pull Request

```bash
git add skills/supabase/references/
git commit -m "feat(skill): add {your-product} references"
git push origin feature/supabase-skill-{your-product}
```

Open PR with:

- Summary of references added
- List of files created
- Any cross-references to other products

---

## Step 8: Review Process

1. Product team member reviews for technical accuracy
2. AI team reviews for skill format compliance
3. CI validates and builds
4. Merge to main

---

## Impact Level Guidelines

Choose the appropriate impact level:

| Level       | Use For                                                |
| ----------- | ------------------------------------------------------ |
| CRITICAL    | Security issues, auth bypasses, data exposure          |
| HIGH        | Core setup, essential patterns, breaking changes       |
| MEDIUM-HIGH | Common mistakes, integration gotchas                   |
| MEDIUM      | Best practices, optimization tips                      |
| LOW-MEDIUM  | Configuration options, tooling tips                    |
| LOW         | Advanced patterns, edge cases                          |

---

## Example Reference

Here's a complete example reference file:

```markdown
---
title: Configure Supabase Client for Next.js App Router
impact: HIGH
impactDescription: Enables type-safe Supabase access in Server and Client Components
tags: nextjs, app-router, client, setup
---

## Configure Supabase Client for Next.js App Router

Next.js App Router requires separate client configurations for Server Components and Client Components due to different execution environments.

**Incorrect (single client for both environments):**

\`\`\`typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// This client won't work correctly in Server Components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
\`\`\`

**Correct (separate clients for server and browser):**

\`\`\`typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
}

// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
\`\`\`

Reference: [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
```
