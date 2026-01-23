# AGENTS.md

Guidance for AI coding agents working with this repository.

## Repository Structure

```
skills/
  {skill-name}/
    metadata.json         # Required: skill metadata
    AGENTS.md             # Generated: compiled rules
    rules/
      _sections.md        # Required: section definitions
      {prefix}-{name}.md  # Rule files

packages/
  skills-build/           # Generic build system for all skills
```

## Commands

```bash
npm run build                    # Build all skills
npm run build -- {skill-name}    # Build specific skill
npm run validate                 # Validate all skills
npm run validate -- {skill-name} # Validate specific skill
```

## Creating a New Skill

1. Create directory: `mkdir -p skills/{name}/rules`
2. Add `metadata.json` with version, organization, abstract
3. Add `rules/_sections.md` defining sections
4. Add rule files: `{prefix}-{rule-name}.md`
5. Run `npm run build`

## Rule File Format

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

| Level       | Improvement | Use For                    |
| ----------- | ----------- | -------------------------- |
| CRITICAL    | 10-100x     | Missing indexes, security  |
| HIGH        | 5-20x       | Schema design, partitions  |
| MEDIUM-HIGH | 2-5x        | Query patterns, N+1        |
| MEDIUM      | 1.5-3x      | Optimization, tuning       |
| LOW-MEDIUM  | 1.2-2x      | Config, maintenance        |
| LOW         | Incremental | Edge cases, advanced       |
