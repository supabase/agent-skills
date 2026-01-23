# CONTRIBUTING.md

Thank you for contributing to Supabase Agent Skills! Here's how to get started:

[1. Getting Started](#getting-started) | [2. Issues](#issues) |
[3. Pull Requests](#pull-requests) | [4. Contributing New Rules](#contributing-new-rules) |
[5. Creating a New Skill](#creating-a-new-skill)

## Getting Started

To ensure a positive and inclusive environment, please read our
[code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md)
before contributing.

## Issues

If you find a typo, have a suggestion for a new skill/rule, or want to improve
existing skills/rules, please create an Issue.

- Please search
  [existing Issues](https://github.com/supabase/agent-skills/issues) before
  creating a new one.
- Please include a clear description of the problem or suggestion.
- Tag your issue appropriately (e.g., `bug`, `question`, `enhancement`,
  `new-rule`, `new-skill`, `documentation`).

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

Before submitting your PR, please run these checks:

```bash
npm run validate  # Check rule format and structure
npm run build     # Generate AGENTS.md from rules
```

Both commands must complete successfully.

## Contributing New Rules

To add a rule to an existing skill:

1. Navigate to `skills/{skill-name}/rules/`
2. Copy `_template.md` to `{prefix}-{your-rule-name}.md`
3. Fill in the frontmatter (title, impact, tags)
4. Write explanation and examples (Incorrect/Correct)
5. Run validation and build:

```bash
npm run validate
npm run build
```

## Creating a New Skill

To create an entirely new skill:

### 1. Create the directory structure

```bash
mkdir -p skills/my-skill/rules
```

### 2. Create metadata.json

```json
{
  "version": "1.0.0",
  "organization": "Your Org",
  "date": "January 2026",
  "abstract": "Brief description of this skill."
}
```

### 3. Create rules/_sections.md

```markdown
## 1. First Category (first)
**Impact:** HIGH
**Description:** What this category covers.

## 2. Second Category (second)
**Impact:** MEDIUM
**Description:** What this category covers.
```

### 4. Create rule files

Name files as `{prefix}-{rule-name}.md` where prefix matches a section.

Example: `first-example-rule.md` for section "First Category"

### 5. Build

```bash
npm run build
```

The build system auto-discovers skills. No configuration needed.

## Questions or Feedback?

- Open an Issue for bugs or suggestions
- Start a Discussion for broader topics or proposals
- Check existing Issues and Discussions before creating new ones

## License

By contributing to this repository, you agree that your contributions will be
licensed under the MIT License.
