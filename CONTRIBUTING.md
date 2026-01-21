# CONTRIBUTING.md

Thank you for contributing to Supabase Agent Skills! Here's how to get started:

[1. Getting Started](#getting-started) [2. Issues](#issues)
[3. Pull Requests](#pull-requests)
[4. Contributing New Rules](#contributing-new-rules)
[5. Extending Existing Skills](#extending-existing-skills)

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

## Questions or Feedback?

- Open an Issue for bugs or suggestions
- Start a Discussion for broader topics or proposals
- Check existing Issues and Discussions before creating new ones

## License

By contributing to this repository, you agree that your contributions will be
licensed under the MIT License.
