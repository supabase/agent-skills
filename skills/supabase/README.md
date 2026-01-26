# Supabase - Contributor Guide

This skill contains Supabase development guides optimized for AI agents and LLMs. It follows the [Agent Skills Open Standard](https://agentskills.io/specification).

## Quick Start for Contributors

```bash
# From repository root
npm install

# Validate existing references
npm run validate -- supabase

# Build AGENTS.md
npm run build -- supabase
```

## Creating a New Reference

1. **Choose a section prefix** based on the category (see `references/_sections.md`)

2. **Copy the template**:

   ```bash
   cp references/_template.md references/{prefix}-your-reference-name.md
   ```

3. **Fill in the content** following the template structure

4. **Validate and build**:

   ```bash
   npm run validate -- supabase
   npm run build -- supabase
   ```

5. **Review** the generated `AGENTS.md`

## Repository Structure

```
skills/supabase/
├── SKILL.md              # Agent-facing skill manifest (required)
├── AGENTS.md             # [GENERATED] Compiled references document
├── README.md             # This file
└── references/
    ├── _template.md      # Reference template
    ├── _sections.md      # Section definitions
    ├── _contributing.md  # Writing guidelines
    └── {prefix}-*.md     # Individual references
```

## Reference File Structure

See `references/_template.md` for the complete template. Key elements:

```markdown
---
title: Clear, Action-Oriented Title
impact: CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
impactDescription: Specific benefit (e.g., "Prevents credential exposure")
tags: relevant, keywords
---

## [Title]

[1-2 sentence explanation]

**Incorrect (description):**

\`\`\`typescript
// What not to do
\`\`\`

**Correct (description):**

\`\`\`typescript
// What to do instead
\`\`\`

Reference: [Link](url)
```

## Section Prefixes

| Section          | Prefix      | Examples                              |
| ---------------- | ----------- | ------------------------------------- |
| Getting Started  | `setup`     | `setup-project.md`, `setup-env.md`    |
| Auth             | `auth`      | `auth-nextjs.md`, `auth-rls.md`       |
| Database         | `database`  | `database-migrations.md`              |
| Storage          | `storage`   | `storage-upload.md`                   |
| Edge Functions   | `functions` | `functions-deploy.md`                 |
| Realtime         | `realtime`  | `realtime-subscribe.md`               |
| Client Libraries | `client`    | `client-setup.md`                     |
| CLI & Tools      | `cli`       | `cli-local-dev.md`                    |

## Writing Guidelines

See `references/_contributing.md` for detailed guidelines. Key principles:

1. **Show concrete patterns** - "Use X instead of Y", not abstract advice
2. **Error-first structure** - Show the problem before the solution
3. **Quantify impact** - Include specific benefits
4. **Self-contained examples** - Complete, runnable code
5. **Semantic naming** - Use meaningful variable names

## Impact Levels

| Level       | Use When                                               |
| ----------- | ------------------------------------------------------ |
| CRITICAL    | Security vulnerabilities, auth bypasses, data leaks    |
| HIGH        | Core functionality, performance issues, best practices |
| MEDIUM-HIGH | Integration patterns, common mistakes                  |
| MEDIUM      | Optimization, alternative approaches                   |
| LOW-MEDIUM  | Configuration tweaks, tooling setup                    |
| LOW         | Advanced patterns, edge cases                          |
