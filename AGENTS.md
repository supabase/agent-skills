# AGENTS.md

Guidance for AI coding agents working with this repository.

> **Note:** `CLAUDE.md` is a symlink to this file.

## Prerequisites

This project uses `pnpm` for dependency management and task execution. Use the
Node.js version declared in [`.node-version`](/Users/pedrorodrigues/supabase-agent-skills/.node-version),
then install dependencies with `pnpm install`.

## Repository Structure

```
skills/
  {skill-name}/
    SKILL.md
    references/ (optional)
```

## Commands

Run tasks with `pnpm`.

```bash
pnpm install                     # Install dependencies
pnpm test                        # Run tests
```

**Before completing any task**, run `pnpm test` to ensure CI passes.

## Releases

This repository uses Release Please on `main`.

- Merge conventional commits using `feat:` and `fix:` prefixes so Release Please can open or update the release PR.
- The release PR bumps the repo version, updates the changelog, and bumps `metadata.version` in every skill's `SKILL.md` automatically via `extra-files` in `release-please-config.json`. Do not bump skill versions manually.
- When the release PR is merged, GitHub Actions creates a semver GitHub release, uploads one `.tar.gz` per skill as release assets, and dispatches the sync workflow in `supabase-community/supabase-plugin` to update downstream skills immediately.

If you change shipped skill contents under `skills/`, make sure the change is represented with an appropriate conventional commit so it is included in the next release.

## Creating a New Skill

Skills follow the [Agent Skills Open Standard](https://agentskills.io/).

1. Create directory: `mkdir -p skills/{skill-name}/references`
2. Create `SKILL.md` following the format below
3. Add `references/_sections.md` defining sections
4. Add reference files: `{prefix}-{reference-name}.md`
5. Register the skill in `release-please-config.json` under `extra-files` so Release Please keeps its `metadata.version` in sync on every release:
   ```json
   {
     "type": "generic",
     "path": "skills/{skill-name}/SKILL.md",
     "expressions": ["version: \"([0-9]+\\.[0-9]+\\.[0-9]+)\""]
   }
   ```
6. Run `pnpm test`

---

## Writing SKILL.md Files

SKILL.md is the core of every skill. It consists of **YAML frontmatter**
followed by **Markdown instructions**.

### Frontmatter (Required)

```yaml
---
name: skill-name
description: What this skill does and when to use it.
---
```

| Field         | Required | Constraints                                                                     |
| ------------- | -------- | ------------------------------------------------------------------------------- |
| `name`        | Yes      | 1-64 chars. Lowercase alphanumeric and hyphens only. Must match directory name. |
| `description` | Yes      | 1-1024 chars. Describe what the skill does AND when to use it.                  |
| `license`     | No       | License name or reference to bundled license file.                              |
| `metadata`    | No       | Arbitrary key-value pairs (e.g., `author`, `version`).                          |

### Name Field Rules

- Lowercase letters, numbers, and hyphens only (`a-z`, `0-9`, `-`)
- Must not start or end with `-`
- Must not contain consecutive hyphens (`--`)
- Must match the parent directory name

```yaml
# Valid
name: pdf-processing
name: data-analysis

# Invalid
name: PDF-Processing # uppercase not allowed
name: -pdf # cannot start with hyphen
name: pdf--processing # consecutive hyphens not allowed
```

### Description Field (Critical)

The description is the **primary trigger mechanism**. Claude uses it to decide
when to activate the skill.

**Include both:**

1. What the skill does
2. Specific triggers/contexts for when to use it

```yaml
# Good - comprehensive and trigger-rich
description: >
  Supabase database best practices for schema design, RLS policies,
  indexing, and query optimization. Use when working with Supabase
  projects, writing PostgreSQL migrations, configuring Row Level Security,
  or optimizing database performance.

# Bad - too vague
description: Helps with databases.
```

**Do not put "when to use" in the body.** The body loads only after triggering,
so trigger context must be in the description.

### Body Content

The Markdown body contains instructions for using the skill. Write
concisely—Claude is already capable. Only add context Claude doesn't already
have.

**Guidelines:**

- Use imperative form ("Create the table", not "You should create the table")
- Keep under 500 lines; move detailed content to `references/`
- Prefer concise examples over verbose explanations
- Challenge each paragraph: "Does this justify its token cost?"

**Recommended structure:**

1. Quick start or core workflow
2. Key patterns with examples
3. Links to reference files for advanced topics

```markdown
## Quick Start

Create a table with RLS:

[concise code example]

## Common Patterns

### Authentication

[pattern with example]

## Advanced Topics

- **Complex policies**: See
  [references/rls-patterns.md](references/rls-patterns.md)
- **Performance tuning**: See
  [references/optimization.md](references/optimization.md)
```

### Progressive Disclosure

Skills use three loading levels:

1. **Metadata** (~100 tokens) - Always loaded for all skills
2. **Body** (<5k tokens recommended) - Loaded when skill triggers
3. **References** (as needed) - Loaded on demand by Claude

Keep SKILL.md lean. Move detailed reference material to separate files and link
to them.

---

## Reference File Format

Reference files in `references/` extend skills with detailed documentation.

```markdown
---
title: Action-Oriented Title
impact: CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
impactDescription: Quantified benefit
tags: keywords
---

## Title

1-2 sentence explanation.

**Incorrect:** \`\`\`sql -- bad example \`\`\`

**Correct:** \`\`\`sql -- good example \`\`\`
```

## What NOT to Include

Skills should only contain essential files. Do NOT create:

- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md

The skill should contain only what an AI agent needs to do the job.
