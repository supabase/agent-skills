# Writing Guidelines for Supabase Rules

This document provides guidelines for creating effective Supabase best practice rules that work well with AI agents and LLMs.

## Key Principles

### 1. Concrete Transformation Patterns

Show exact code rewrites. Avoid philosophical advice.

**Good:** "Use `supabase.auth.getUser()` instead of `supabase.auth.getSession()` for server-side auth"
**Bad:** "Handle authentication properly"

### 2. Error-First Structure

Always show the problematic pattern first, then the solution. This trains agents to recognize anti-patterns.

```markdown
**Incorrect (client-side only):** [bad example]

**Correct (server-side validation):** [good example]
```

### 3. Quantified Impact

Include specific metrics when possible. Helps agents prioritize fixes.

**Good:** "Prevents unauthorized access", "Reduces latency by 50%", "Eliminates race conditions"
**Bad:** "Better", "More secure", "Faster"

### 4. Self-Contained Examples

Examples should be complete and runnable. Include imports and setup when needed.

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);

// Now show the pattern
const { data, error } = await supabase.from("users").select("*");
```

### 5. Semantic Naming

Use meaningful variable and table names. Names carry intent for LLMs.

**Good:** `users`, `posts`, `session`, `authUser`
**Bad:** `table1`, `data1`, `result`, `x`

---

## Code Example Standards

### TypeScript/JavaScript Formatting

```typescript
// Use clear formatting and meaningful names
const { data: users, error } = await supabase
  .from("users")
  .select("id, email, created_at")
  .eq("is_active", true);
```

### Comments

- Explain _why_, not _what_
- Highlight security implications
- Point out common pitfalls

### Language Tags

- `typescript` - TypeScript/JavaScript code
- `sql` - SQL queries
- `bash` - CLI commands

---

## Impact Level Guidelines

| Level | Improvement | Use When |
|-------|-------------|----------|
| **CRITICAL** | 10-100x or prevents failure | Security vulnerabilities, data exposure, breaking changes |
| **HIGH** | 5-20x | Architecture decisions, core functionality |
| **MEDIUM-HIGH** | 2-5x | Common anti-patterns, reliability issues |
| **MEDIUM** | 1.5-3x | Optimization, best practices |
| **LOW-MEDIUM** | 1.2-2x | Configuration, tooling |
| **LOW** | Incremental | Advanced patterns, edge cases |

---

## Reference Standards

**Primary Sources:**

- Official Supabase documentation
- Supabase GitHub examples
- Supabase blog posts

**Format:**

```markdown
Reference: [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
```

---

## Review Checklist

Before submitting a rule:

- [ ] Title is clear and action-oriented
- [ ] Impact level matches the severity
- [ ] impactDescription includes quantification
- [ ] Explanation is concise (1-2 sentences)
- [ ] Has at least 1 **Incorrect** code example
- [ ] Has at least 1 **Correct** code example
- [ ] Code uses semantic naming
- [ ] Comments explain _why_, not _what_
- [ ] Trade-offs mentioned if applicable
- [ ] Reference links included
- [ ] `npm run validate` passes
- [ ] `npm run build` generates correct output
