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

This project uses `pnpm` for dependency management and task execution. Use the
Node.js version declared in [`.node-version`](/Users/pedrorodrigues/supabase-agent-skills/.node-version),
then run from the repository root:

```bash
pnpm install        # Install all npm dependencies
```

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
pnpm test         # Run the test suite
```

All commands must complete successfully.

### Releases

Releases are automated via [Release Please](https://github.com/googleapis/release-please). It tracks commits on `main` and opens a release PR when there are releasable changes.

- Use conventional commit prefixes — `fix:` for a patch bump, `feat:` for a minor bump — so Release Please can determine the next version.
- Release Please opens a release PR on `main` that bumps the repo version, updates the changelog, and bumps `metadata.version` in every skill's `SKILL.md` automatically. You do not need to bump skill versions manually.
- Merging the release PR triggers GitHub Actions to:
  1. Create a GitHub release and git tag (e.g. `v0.2.0`)
  2. Package each directory under `skills/` into its own `.tar.gz` and upload them as release assets
  3. Dispatch the sync workflow in the Supabase plugin repo so downstream skills are updated immediately

#### Adding a new skill

When you add a new skill, register its `SKILL.md` in `release-please-config.json` under `extra-files` so Release Please keeps its `metadata.version` in sync. Without this, the tarball will still be built and shipped but the skill's version will never be bumped.

```json
{
  "type": "generic",
  "path": "skills/my-skill/SKILL.md",
  "expressions": ["version: \"([0-9]+\\.[0-9]+\\.[0-9]+)\""]
}
```

#### Troubleshooting

> **Release PR in a bad state?** Close it and re-run the workflow from the [Actions tab](https://github.com/supabase/agent-skills/actions/workflows/release-please.yml) → **Run workflow**. Release Please will recreate the PR from scratch.

> **Dispatch to supabase-plugin missed?** This can happen if the release workflow fails partway through. The sync workflow in supabase-plugin runs on a weekly schedule as a fallback, or you can trigger it manually from its [Actions tab](https://github.com/supabase-community/supabase-plugin/actions/workflows/sync-agent-skills.yml) → **Run workflow** and supply the release tag.

## Contributing New References

To add a reference to an existing skill:

1. Navigate to `skills/{skill-name}/references/`
2. Copy `_template.md` to `{prefix}-{your-reference-name}.md`
3. Fill in the frontmatter (title, impact, tags)
4. Write explanation and examples (Incorrect/Correct)
5. Run the tests:
   ```bash
   pnpm test
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

## Questions or Feedback?

- Open an Issue for bugs or suggestions
- Start a Discussion for broader topics or proposals
- Check existing Issues and Discussions before creating new ones

## License

By contributing to this repository, you agree that your contributions will be
licensed under the MIT License.
