---
description: Guided Supabase skill development with documentation research and spec compliance
argument-hint: Supabase product name (e.g., Auth, Storage, Edge Functions)
---

# Supabase Skill Development

You are helping create a new Supabase agent skill. Follow a systematic approach: research documentation deeply, design skill architecture following the spec, implement, then review for quality.

## Core Principles

- **Research before writing**: Gather comprehensive Supabase documentation and kiro-powers workflows first
- **Follow the spec**: All skills must comply with Agent Skills Open Standard (see `AGENTS.md`)
- **Concise is key**: Only include what Claude doesn't already know
- **Progressive disclosure**: SKILL.md body <5k tokens, details in reference files
- **Ask clarifying questions**: If product scope is unclear, ask before researching

---

## Phase 1: Discovery

**Goal**: Understand what Supabase product the skill covers

Target product: $ARGUMENTS

**Actions**:
1. If product unclear or too broad, ask user to clarify:
   - Which specific Supabase product? (Auth, Storage, Database, Edge Functions, Realtime, etc.)
   - Any specific aspects to focus on?
   - Target audience? (beginners, advanced users, specific frameworks?)
2. Confirm understanding with user before proceeding

---

## Phase 2: Documentation Research

**Goal**: Gather comprehensive information about the Supabase product

**Actions**:
1. Launch 2-3 docs-researcher agents in parallel. Each agent should:
   - Target different aspects (core concepts, API reference, common patterns, edge cases)
   - Use `mcp__claude_ai_Supabase__search_docs` for official documentation
   - Fetch relevant kiro-powers from GitHub (extract workflows, ignore Kiro params)
   - Return key findings and code examples

   **Example agent prompts**:
   - "Research core concepts and quick start for Supabase [product]"
   - "Find API reference and common methods for Supabase [product]"
   - "Identify common pitfalls and Supabase-specific considerations for [product]"
   - "Fetch kiro-power workflows for [product] from GitHub"

2. Review all findings and consolidate into comprehensive research summary
3. Present summary to user and ask if any areas need deeper research

---

## Phase 3: Skill Architecture

**Goal**: Design the reference files structure for the Supabase product

**Actions**:
1. Read `AGENTS.md` to ensure spec compliance
2. Read existing `skills/supabase/SKILL.md` to understand current structure
3. Launch 1-2 skill-architect agents with the research findings. Each should:
   - Design reference directory structure: `references/{product}/`
   - Plan reference files with content distribution
   - Specify file names, sections, and content outlines

4. Review architecture proposals and select the best approach
5. Present to user:
   - Proposed directory: `references/{product}/`
   - Reference files plan (titles, impact levels, content)
   - New entry for SKILL.md resources table
   - Ask for approval before implementing

---

## Phase 4: Implementation

**Goal**: Create the reference files and update SKILL.md

**DO NOT START WITHOUT USER APPROVAL**

**Actions**:
1. Wait for explicit user approval of architecture
2. Read `GETTING_STARTED.md` for contribution workflow
3. Create product directory: `skills/supabase/references/{product}/`
4. Create `_sections.md` in the product subdirectory with section definitions:
   ```markdown
   ## 1. Section Title (prefix)
   **Impact:** CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
   **Description:** Brief description of what this section covers
   ```
5. Create reference files following the naming convention `{prefix}-{name}.md`:
   - The prefix must match a section defined in `_sections.md`
   - YAML frontmatter: title, impact, impactDescription, tags
   - Brief explanation (1-2 sentences)
   - Incorrect example with explanation
   - Correct example with explanation
6. Update `skills/supabase/SKILL.md` resources table with new entries
   - Use paths like `references/{product}/{prefix}-*.md` for wildcard references
7. Follow writing guidelines:
   - Imperative form
   - Concise examples over explanations
   - Common mistakes first

---

## Phase 5: Validation

**Goal**: Ensure references meet spec and quality standards

**Actions**:
1. Run validation commands:
   ```bash
   npm run validate -- supabase
   npm run build -- supabase
   npm run check
   ```
2. Fix any validation errors
3. Launch 2 skill-reviewer agents in parallel with different focuses:
   - Spec compliance and reference file structure
   - Content quality and Supabase accuracy

4. Consolidate findings and present to user
5. Address issues based on user decision

---

## Phase 6: Summary

**Goal**: Document what was created

**Actions**:
1. Summarize:
   - Product directory created: `references/{product}/`
   - Reference files created (list with titles and impact levels)
   - SKILL.md resources table entries added
   - Key Supabase-specific considerations included
   - Any gaps or future improvements suggested
2. Remind user to run `npm run build -- supabase` before committing

---

## Phase 7: PR Description

**Goal**: Generate a comprehensive PR description

**Actions**:
1. Launch the **pr-writer** agent to create the PR description
2. The agent will:
   - Analyze the changes made during this workflow
   - Document the high-level structure (not individual files)
   - List all sources consulted (Supabase docs, kiro-powers, etc.)
   - Capture architectural decisions and their rationale
3. Present the PR description to the user for review
4. Make any adjustments based on user feedback

**Agent prompt**:
> Create a PR description for the Supabase [product] skill references just created.
>
> Sources consulted: [list from research phase]
>
> Key decisions made:
> - [decision 1 and rationale]
> - [decision 2 and rationale]
>
> Reference structure: [summary from architecture phase]

---
