# Using Supabase - Contributor Guide

This repository contains Supabase development patterns and best practices optimized for AI agents and LLMs.

## Quick Start

```bash
# From repository root
npm install

# Validate existing rules
npm run validate

# Build AGENTS.md
npm run build
```

## Creating a New Rule

1. **Choose a section prefix** based on the category (see `rules/_sections.md`)

2. **Copy the template**:
   ```bash
   cp rules/_template.md rules/{prefix}-your-rule-name.md
   ```

3. **Fill in the content** following the template structure

4. **Validate and build**:
   ```bash
   npm run validate
   npm run build
   ```

5. **Review** the generated `AGENTS.md`

## Repository Structure

```
skills/using-supabase/
├── SKILL.md           # Agent-facing skill manifest
├── AGENTS.md          # [GENERATED] Compiled rules document
├── README.md          # This file
├── metadata.json      # Version and metadata
├── PRODUCT_TEMPLATE.md # Template for product teams
├── references/        # Reference documentation
└── rules/
    ├── _template.md      # Rule template
    ├── _sections.md      # Section definitions
    ├── _contributing.md  # Writing guidelines
    └── *.md              # Individual rules
```

## Rule File Structure

See `rules/_template.md` for the complete template. Key elements:

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

```typescript
// Comment explaining what's wrong
[Bad code example]
```
````

**Correct (description):**

```typescript
// Comment explaining why this is better
[Good code example]
```

```
## Writing Guidelines

See `rules/_contributing.md` for detailed guidelines. Key principles:

1. **Show concrete transformations** - "Change X to Y", not abstract advice
2. **Error-first structure** - Show the problem before the solution
3. **Quantify impact** - Include specific metrics
4. **Self-contained examples** - Complete, runnable code
5. **Semantic naming** - Use meaningful names

## Impact Levels

| Level | Improvement | Examples |
|-------|-------------|----------|
| CRITICAL | 10-100x or prevents failure | Security vulnerabilities, data loss |
| HIGH | 5-20x | Architecture decisions, core functionality |
| MEDIUM-HIGH | 2-5x | Design patterns, common anti-patterns |
| MEDIUM | 1.5-3x | Optimization, best practices |
| LOW-MEDIUM | 1.2-2x | Configuration, tooling |
| LOW | Incremental | Advanced techniques, edge cases |
```
