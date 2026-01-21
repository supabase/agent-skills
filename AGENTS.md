# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Copilot,
etc.) when working with code in this repository.

## Repository Overview

A collection of Postgres best practices skills for AI coding agents,
maintained by Supabase. Skills are packaged instructions that extend agent
capabilities for database optimization.

## Installation

```bash
npx skills add supabase/agent-skills
```

## Creating a New Rule

### Directory Structure

```
skills/
  postgres-best-practices/
    SKILL.md              # Required: skill definition
    AGENTS.md             # Generated: compiled rules
    metadata.json         # Required: version and metadata
    rules/
      _template.md        # Template for new rules
      _sections.md        # Section definitions
      _contributing.md    # Writing guidelines
      {prefix}-{name}.md  # Individual rule files

packages/
  postgres-best-practices-build/
    src/                  # Build system source
    package.json          # NPM scripts
```

### Naming Conventions

- **Rule files**: `{prefix}-{kebab-case-name}.md` (e.g.,
  `query-missing-indexes.md`)
- **Prefixes determine section**: `query-`, `conn-`, `schema-`, `lock-`,
  `security-`, `data-`, `monitor-`, `advanced-`
- **Special files**: Prefixed with `_` (e.g., `_template.md`, `_sections.md`)

### Rule File Format

````markdown
---
title: Clear, Action-Oriented Title
impact: CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
impactDescription: Quantified benefit (e.g., "10-100x faster")
tags: relevant, keywords
---

## [Title]

[1-2 sentence explanation]

**Incorrect (description):**

```sql
-- Comment explaining what's wrong
[Bad SQL example]
```
````

**Correct (description):**

```sql
-- Comment explaining why this is better
[Good SQL example]
```

**Supabase Note:** [Optional platform-specific guidance]

Reference: [Link](url)

````
### Best Practices for Context Efficiency

Skills are loaded on-demand. To minimize context usage:

- **Keep rules focused** - One optimization pattern per rule
- **Write specific titles** - Helps the agent know exactly when to apply
- **Use progressive disclosure** - Reference supporting files when needed
- **Self-contained examples** - Complete, runnable SQL
- **Quantify impact** - Include specific metrics (10x faster, 50% smaller)

### Build System

After creating or updating rules:

```bash
cd packages/postgres-best-practices-build
npm install
npm run validate  # Check rule format
npm run build     # Generate AGENTS.md
````

### Impact Levels

| Level       | Improvement | Examples                               |
| ----------- | ----------- | -------------------------------------- |
| CRITICAL    | 10-100x     | Missing indexes, connection exhaustion |
| HIGH        | 5-20x       | Wrong index types, poor partitioning   |
| MEDIUM-HIGH | 2-5x        | N+1 queries, RLS optimization          |
| MEDIUM      | 1.5-3x      | Redundant indexes, stale statistics    |
| LOW-MEDIUM  | 1.2-2x      | VACUUM tuning, config tweaks           |
| LOW         | Incremental | Advanced patterns, edge cases          |

### File Prefix to Section Mapping

| Prefix      | Section                  | Priority        |
| ----------- | ------------------------ | --------------- |
| `query-`    | Query Performance        | 1 (CRITICAL)    |
| `conn-`     | Connection Management    | 2 (CRITICAL)    |
| `schema-`   | Schema Design            | 3 (HIGH)        |
| `lock-`     | Concurrency & Locking    | 4 (MEDIUM-HIGH) |
| `security-` | Security & RLS           | 5 (MEDIUM-HIGH) |
| `data-`     | Data Access Patterns     | 6 (MEDIUM)      |
| `monitor-`  | Monitoring & Diagnostics | 7 (LOW-MEDIUM)  |
| `advanced-` | Advanced Features        | 8 (LOW)         |

