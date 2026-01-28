![Supabase Agent Skills](assets/og.png)

# Supabase Agent Skills


Agent Skills to help developers using AI agents with Supabase. Agent Skills are
folders of instructions, scripts, and resources that agents like Claude Code,
Cursor, Github Copilot, etc... can discover and use to do things more accurately
and efficiently.

The skills in this repo follow the [Agent Skills](https://agentskills.io/)
format.

## Installation

```bash
npx skills add supabase/agent-skills
```

### Claude Code Plugin

You can also install the skills in this repo as Claude Code plugins

```bash
/plugin marketplace add supabase/agent-skills
/plugin install postgres-best-practices@supabase-agent-skills
```

## Available Skills

<details>
<summary><strong>supabase-postgres-best-practices</strong></summary>

Postgres performance optimization guidelines from Supabase. Contains references
across 8 categories, prioritized by impact.

**Use when:**

- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Working with Row-Level Security (RLS)

**Categories covered:**

- Query Performance (Critical)
- Connection Management (Critical)
- Schema Design (High)
- Concurrency & Locking (Medium-High)
- Security & RLS (Medium-High)
- Data Access Patterns (Medium)
- Monitoring & Diagnostics (Low-Medium)
- Advanced Features (Low)

</details>

<details>
<summary><strong>postgrest-best-practices</strong></summary>

PostgREST API best practices for Supabase. Contains rules across 9 categories covering query syntax, filtering operators, resource embedding, mutations, RPC calls, and performance optimization.

**Use when:**

- Using supabase-js or any Supabase client library
- Writing PostgREST or Supabase API queries
- Using filtering operators and logical combinations
- Implementing resource embedding for related data
- Performing mutations (INSERT, UPDATE, DELETE, UPSERT)
- Calling stored functions via RPC

**Categories covered:**

- Query Filtering (Critical)
- Resource Embedding (Critical)
- Column Selection (High)
- Data Mutations (High)
- Functions/RPC (Medium-High)
- Pagination & Ordering (Medium-High)
- Response Handling (Medium)
- Authentication (Medium)
- Performance (Low-Medium)

</details>

## Usage

Skills are automatically available once installed. The agent will use them when
relevant tasks are detected.

**Examples:**

```
Optimize this Postgres query
```

```
Review my schema for performance issues
```

```
Help me add proper indexes to this table
```

```
How do I filter by multiple conditions in supabase-js?
```

```
Show me how to embed related data in a single query
```

## Skill Structure

Each skill follows the [Agent Skills Open Standard](https://agentskills.io/):

- `SKILL.md` - Required skill manifest with frontmatter (name, description, metadata)
- `AGENTS.md` - Compiled references document (generated)
- `references/` - Individual reference files

## License

MIT
