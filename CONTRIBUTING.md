# CONTRIBUTING.md

Thank you for contributing to Supabase Agent Skills! Here's how to get started:

[1. Getting Started](#getting-started) | [2. Issues](#issues) |
[3. Pull Requests](#pull-requests) | [4. Contributing New References](#contributing-new-references) |
[5. Creating a New Skill](#creating-a-new-skill)

## Getting Started

To ensure a positive and inclusive environment, please read our
[code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md)
before contributing.

### Setup

This project uses [mise](https://mise.jdx.dev/) to manage tool versions,
environment variables, and project tasks. Install mise, then run from the
repository root:

```bash
mise install        # Install Node.js (version defined in mise.toml)
mise run install    # Install all npm dependencies
```

For LLM evals, copy the env example and add your API keys:

```bash
cp packages/evals/.env.example packages/evals/.env
# Edit packages/evals/.env with your ANTHROPIC_API_KEY and OPENAI_API_KEY
```

mise automatically loads `.env` files defined in `mise.toml`.

## Issues

If you find a typo, have a suggestion for a new skill/reference, or want to improve
existing skills/references, please create an Issue.

- Please search
  [existing Issues](https://github.com/supabase/agent-skills/issues) before
  creating a new one.
- Please include a clear description of the problem or suggestion.
- Tag your issue appropriately (e.g., `bug`, `question`, `enhancement`,
  `new-reference`, `new-skill`, `documentation`).

## Pull Requests

We actively welcome your Pull Requests! Here's what to keep in mind:

- If you're fixing an Issue, make sure someone else hasn't already created a PR
  for it. Link your PR to the related Issue(s).
- We will always try to accept the first viable PR that resolves the Issue.
- If you're new, we encourage you to take a look at issues tagged with
  [good first issue](https://github.com/supabase/agent-skills/labels/good%20first%20issue).
- If you're proposing a significant new skill or major changes, please open a
  [Discussion](https://github.com/orgs/supabase/discussions/new/choose) first to
  gather feedback before investing time in implementation.

### Pre-Flight Checks

Before submitting your PR, make sure you have the right tooling and run these
checks:

```bash
mise install       # Ensure correct Node.js version
mise run check     # Format and lint (auto-fix)
mise run validate  # Check reference format and structure
mise run build     # Generate AGENTS.md from references
```

All commands must complete successfully.

## Contributing New References

To add a reference to an existing skill:

1. Navigate to `skills/{skill-name}/references/`
2. Copy `_template.md` to `{prefix}-{your-reference-name}.md`
3. Fill in the frontmatter (title, impact, tags)
4. Write explanation and examples (Incorrect/Correct)
5. Run validation and build:

```bash
mise run validate
mise run build
```

## Creating a New Skill

Skills follow the [Agent Skills Open Standard](https://agentskills.io/).

### 1. Create the directory structure

```bash
mkdir -p skills/my-skill/references
```

### 2. Create SKILL.md

```yaml
---
name: my-skill
description: Brief description of what this skill does and when to use it.
license: MIT
metadata:
  author: your-org
  version: "1.0.0"
  organization: Your Org
  date: January 2026
  abstract: Detailed description of this skill for the compiled AGENTS.md.
---

# My Skill

Instructions for agents using this skill.

## References

- https://example.com/docs
```

### 3. Create references/_sections.md

```markdown
## 1. First Category (first)
**Impact:** HIGH
**Description:** What this category covers.

## 2. Second Category (second)
**Impact:** MEDIUM
**Description:** What this category covers.
```

### 4. Create reference files

Name files as `{prefix}-{reference-name}.md` where prefix matches a section.

Example: `first-example-reference.md` for section "First Category"

### 5. Build

```bash
mise run build
```

The build system auto-discovers skills by looking for `SKILL.md` files.

## Questions or Feedback?

- Open an Issue for bugs or suggestions
- Start a Discussion for broader topics or proposals
- Check existing Issues and Discussions before creating new ones

## License

By contributing to this repository, you agree that your contributions will be
licensed under the MIT License.
