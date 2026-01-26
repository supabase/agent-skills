# AGENTS.md

Guidance for AI coding agents working with this repository.

> **Note:** `CLAUDE.md` is a symlink to this file.

## Repository Structure

```
skills/
  {skill-name}/
    SKILL.md              # Required: skill manifest (Agent Skills spec)
    AGENTS.md             # Generated: compiled references
    references/
      _sections.md        # Required: section definitions
      {prefix}-{name}.md  # Reference files

packages/
  skills-build/           # Generic build system for all skills
```

## Commands

```bash
npm run build                    # Build all skills
npm run build -- {skill-name}    # Build specific skill
npm run validate                 # Validate all skills
npm run validate -- {skill-name} # Validate specific skill
npm run check                    # Format and lint (auto-fix)
```

**Before completing any task**, run `npm run check` and `npm run build` to ensure CI passes.

## Creating a New Skill

Skills follow the [Agent Skills Open Standard](https://agentskills.io/).

1. Create directory: `mkdir -p skills/{skill-name}/references`
2. Create `SKILL.md` with required frontmatter:
   ```yaml
   ---
   name: skill-name
   description: What this skill does and when to use it.
   license: MIT
   metadata:
     author: your-org
     version: "1.0.0"
   ---
   ```
3. Add `references/_sections.md` defining sections
4. Add reference files: `{prefix}-{reference-name}.md`
5. Run `npm run build`

## SKILL.md Format (Agent Skills Spec)

```yaml
---
name: skill-name                    # Required: must match directory name
description: Description of skill.  # Required: what it does and when to use
license: MIT                        # Optional: license
metadata:                           # Optional: arbitrary key-value pairs
  author: your-org
  version: "1.0.0"
---
```

## Reference File Format

```markdown
---
title: Action-Oriented Title
impact: CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
impactDescription: Quantified benefit
tags: keywords
---

## Title

1-2 sentence explanation.

**Incorrect:**
\`\`\`sql
-- bad example
\`\`\`

**Correct:**
\`\`\`sql
-- good example
\`\`\`
```

## Impact Levels

| Level       | Improvement                   | Use For                                                    |
| ----------- | ----------------------------- | ---------------------------------------------------------- |
| CRITICAL    | 10-100x or prevents failure   | Security vulnerabilities, data loss, breaking changes      |
| HIGH        | 5-20x or major quality gain   | Architecture decisions, core functionality, scalability    |
| MEDIUM-HIGH | 2-5x or significant benefit   | Design patterns, common anti-patterns, reliability         |
| MEDIUM      | 1.5-3x or noticeable gain     | Optimization, best practices, maintainability              |
| LOW-MEDIUM  | 1.2-2x or minor benefit       | Configuration, tooling, code organization                  |
| LOW         | Incremental or edge cases     | Advanced techniques, rare scenarios, polish                |
