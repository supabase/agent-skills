# Writing Guidelines for Supabase References

This document provides guidelines for creating effective Supabase development
guides that work well with AI agents and LLMs.

## Key Principles

### 1. Concrete Examples Over Abstract Advice

Show exact code patterns. Avoid philosophical guidance.

**Good:** "Use `createClient()` with environment variables"
**Bad:** "Configure your client properly"

### 2. Error-First Structure

Always show the problematic pattern first, then the solution. This trains agents
to recognize anti-patterns.

```markdown
**Incorrect (hardcoded credentials):** [bad example]

**Correct (environment variables):** [good example]
```

### 3. Quantified Impact

Include specific benefits. Helps agents prioritize recommendations.

**Good:** "Reduces bundle size by 40%", "Prevents credential exposure"
**Bad:** "Better", "More secure", "Recommended"

### 4. Self-Contained Examples

Examples should be complete and runnable. Include imports and setup when needed.

```typescript
// Include imports for clarity
import { createClient } from "@supabase/supabase-js";

// Show complete setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 5. Semantic Naming

Use meaningful variable/function names. Names carry intent for LLMs.

**Good:** `supabase`, `authClient`, `userProfile`, `bucketName`
**Bad:** `client1`, `data`, `result`, `x`

---

## Code Example Standards

### TypeScript Formatting

```typescript
// Use clear formatting and proper typing
const { data, error } = await supabase
  .from("users")
  .select("id, email, created_at")
  .eq("is_active", true);

// Not cramped
const { data, error } = await supabase.from("users").select("*").eq("is_active", true);
```

### Comments

- Explain _why_, not _what_
- Highlight security implications
- Point out common pitfalls

### Language Tags

- `typescript` - TypeScript/JavaScript code (preferred)
- `javascript` - Plain JavaScript when TS isn't appropriate
- `sql` - Database queries, RLS policies
- `bash` - CLI commands, environment setup

---

## Framework-Specific Guides

When creating guides for specific frameworks, include:

1. **Installation command** - `npm install @supabase/supabase-js`
2. **Environment variables** - Required `.env` configuration
3. **Client setup** - Framework-specific initialization
4. **Common mistakes** - Framework-specific pitfalls

### Supported Frameworks

Prefix reference files appropriately:

- `auth-nextjs.md` - Next.js App Router
- `auth-react.md` - React SPA
- `auth-remix.md` - Remix
- `client-nuxt.md` - Nuxt/Vue

---

## Impact Level Guidelines

| Level           | Use When                                              |
| --------------- | ----------------------------------------------------- |
| **CRITICAL**    | Security vulnerabilities, auth bypasses, data leaks   |
| **HIGH**        | Core functionality, performance issues, best practices|
| **MEDIUM-HIGH** | Integration patterns, common mistakes                 |
| **MEDIUM**      | Optimization, alternative approaches                  |
| **LOW-MEDIUM**  | Configuration tweaks, tooling setup                   |
| **LOW**         | Advanced patterns, edge cases                         |

---

## Reference Standards

**Primary Sources:**

- Supabase documentation (https://supabase.com/docs)
- Supabase GitHub examples
- Framework-specific documentation

**Format:**

```markdown
Reference: [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
```

---

## Review Checklist

Before submitting a reference:

- [ ] Title is clear and action-oriented
- [ ] Impact level matches the importance
- [ ] impactDescription includes specific benefit
- [ ] Explanation is concise (1-2 sentences)
- [ ] Has at least 1 **Incorrect** code example
- [ ] Has at least 1 **Correct** code example
- [ ] Code uses semantic naming
- [ ] Comments explain _why_, not _what_
- [ ] Trade-offs mentioned if applicable
- [ ] Reference links included
- [ ] `npm run validate` passes
- [ ] `npm run build` generates correct output
