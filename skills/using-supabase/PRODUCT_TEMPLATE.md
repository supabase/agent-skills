# Product Team Contribution Guide

This document provides step-by-step instructions for adding your product's content to the Supabase Agent Skills.

---

## Step 1: Setup Your Branch

```bash
git checkout feature/supabase-skill
git pull origin feature/supabase-skill
git checkout -b feature/supabase-skill-{your-product}
```

---

## Step 2: Create Your Hub File

Create a hub file at `skills/using-supabase/references/supabase-{your-product}.md`:

```markdown
# Supabase {Your Product} Guide

Brief description of what this product does and when to use it.

## Quick Start

Basic setup/usage example.

## Core Concepts

Key concepts developers need to understand.

## Common Patterns

Link to sub-resources for detailed patterns:
- [Pattern 1](./supabase-{your-product}/pattern-1.md)
- [Pattern 2](./supabase-{your-product}/pattern-2.md)

## Common Mistakes

What to avoid and why.

## Related Resources

Links to other Supabase products that integrate with this one.
```

---

## Step 3: Create Sub-Resources (Optional)

For detailed patterns, create a subdirectory:

```
skills/using-supabase/references/
├── supabase-{your-product}.md          # Hub file
└── supabase-{your-product}/            # Sub-resources
    ├── pattern-1.md
    ├── pattern-2.md
    └── common-mistakes.md
```

---

## Step 4: Content Guidelines

**DO:**
- Use concrete code examples (TypeScript/JavaScript)
- Show incorrect patterns with explanations
- Include error messages developers might see
- Link to related Supabase products
- Keep files focused (one concept per file)

**DON'T:**
- Duplicate official documentation verbatim
- Include overly long examples (keep under 50 lines)
- Assume prior Supabase knowledge
- Include time-sensitive content (versions, dates)

---

## Step 5: Reference File Format

Each reference file should follow this structure:

```markdown
# Title

One-paragraph description of this pattern/concept.

## When to Use

Describe the use case.

## Example

**Setup:**
\`\`\`typescript
// Setup code
\`\`\`

**Usage:**
\`\`\`typescript
// Usage example
\`\`\`

## Common Mistakes

**Incorrect:**
\`\`\`typescript
// What not to do
\`\`\`

**Correct:**
\`\`\`typescript
// What to do instead
\`\`\`

## Related

- [Related Resource 1](./path-to-resource.md)
- [Official Docs](https://supabase.com/docs/...)
```

---

## Step 6: Open Pull Request

```bash
git add skills/using-supabase/references/
git commit -m "feat(skill): add {your-product} references"
git push origin feature/supabase-skill-{your-product}
```

Open PR targeting `feature/supabase-skill` with:
- Summary of content added
- List of files created
- Any cross-references to other products

---

## Step 7: Review Process

1. Product team member reviews for technical accuracy
2. AI team reviews for skill format compliance
3. Merge to `feature/supabase-skill`
