---
title: Clear, Action-Oriented Title (e.g., "Set Up Authentication with Next.js")
impact: MEDIUM
impactDescription: Enables secure user authentication in minutes
tags: auth, nextjs, setup
---

## [Reference Title]

[1-2 sentence explanation of what this guide covers and why it matters.]

**Incorrect (describe the problem):**

```typescript
// Comment explaining what makes this problematic
const supabase = createClient("https://xxx.supabase.co", "hardcoded-key");
// Hardcoded credentials are a security risk
```

**Correct (describe the solution):**

```typescript
// Comment explaining why this is better
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// Environment variables keep credentials secure
```

[Optional: Additional context, setup steps, or configuration details]

Reference: [Supabase Docs](https://supabase.com/docs)
