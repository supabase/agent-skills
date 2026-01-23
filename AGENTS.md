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

| Level       | Improvement                   | Use For                                                    |
| ----------- | ----------------------------- | ---------------------------------------------------------- |
| CRITICAL    | 10-100x or prevents failure   | Security vulnerabilities, data loss, breaking changes      |
| HIGH        | 5-20x or major quality gain   | Architecture decisions, core functionality, scalability    |
| MEDIUM-HIGH | 2-5x or significant benefit   | Design patterns, common anti-patterns, reliability         |
| MEDIUM      | 1.5-3x or noticeable gain     | Optimization, best practices, maintainability              |
| LOW-MEDIUM  | 1.2-2x or minor benefit       | Configuration, tooling, code organization                  |
| LOW         | Incremental or edge cases     | Advanced techniques, rare scenarios, polish                |
