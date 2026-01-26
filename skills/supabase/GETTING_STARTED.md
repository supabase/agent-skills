# Getting Started

Welcome! This guide walks you through adding your product's content to the Supabase Agent Skills.

## Quick Start

After creating your branch, follow these steps:

### 1. Create Your Reference File

Create a new markdown file in `references/`:

```bash
# Main topic file
references/{product-name}.md

# Sub-topics (optional)
references/{product-name}/{subtopic}.md
```

**Examples:**

- `references/auth.md` - Main auth documentation
- `references/auth/nextjs-setup.md` - Auth setup for Next.js
- `references/storage.md` - Storage overview
- `references/storage/upload-files.md` - File upload guide

### 2. Write Your Content

Use `references/_template.md` as your starting point. Include:

1. **Title** - Clear heading describing the topic
2. **Overview** - Brief explanation of what this covers
3. **Code examples** - Show how to use the feature
4. **Common patterns** - Real-world usage scenarios
5. **Documentation links** - Link to official docs

### 3. Update SKILL.md

Add your reference to the resources table in `SKILL.md`:

```markdown
| Area           | Resource                  | When to Use              |
| -------------- | ------------------------- | ------------------------ |
| Your Feature   | `references/feature.md`   | Description of when      |
```

### 4. Validate and Build

```bash
npm run validate -- supabase   # Check your files
npm run build -- supabase      # Generate AGENTS.md
npm run check                  # Format code
```

## Writing Guidelines

- **Be practical** - Show real code, not abstract concepts
- **Be complete** - Include imports and full setup when helpful
- **Use semantic names** - `userProfile`, `bucketName`, not `data`, `x`
- **Link to docs** - Reference official documentation
- **Show patterns** - Demonstrate common use cases

## Existing References

Check the `references/` directory for examples of existing content.

## Questions?

Open an issue or reach out to the AI team.
