# Supabase Skill - Contributor Guide

This skill contains Supabase development references optimized for AI agents and LLMs. It follows the [Agent Skills Open Standard](https://agentskills.io/).

## Quick Start

```bash
# From repository root
npm install

# Validate existing references
npm run validate

# Build AGENTS.md
npm run build
```

## Creating a New Reference

1. **Copy the template**:
   ```bash
   cp references/_template.md references/your-reference-name.md
   ```

2. **Fill in the content** following the template structure

3. **Validate and build**:
   ```bash
   npm run validate
   npm run build
   ```

4. **Review** the generated `AGENTS.md`

## Skill Structure

```
skills/supabase/
├── SKILL.md           # Agent-facing skill manifest (Agent Skills spec)
├── AGENTS.md          # [GENERATED] Compiled references document
├── GETTING_STARTED.md # Quick start guide
├── README.md          # This file
└── references/
    ├── _template.md      # Reference template
    ├── _sections.md      # Section definitions
    └── *.md              # Individual references
```

## Reference File Structure

See `references/_template.md` for the complete template. Key elements:

```markdown
---
title: Clear, Action-Oriented Title
tags: relevant, keywords
---

# [Feature/Topic Name]

Brief description of what this feature does and when to use it.

## Quick Setup

[Installation and basic usage]

## Common Patterns

[Code examples for typical use cases]

## Common Mistakes

[Pitfalls to avoid]
```

## Writing Guidelines

1. **Show concrete examples** - Include runnable code snippets
2. **Reference official docs** - Use `curl -H "Accept: text/markdown"` for fetching docs
3. **Common mistakes first** - Help agents avoid pitfalls
4. **Self-contained examples** - Complete, working code
5. **Link to resources** - Point to official documentation and related references
