---
title: Action-Oriented Title
tags: relevant, keywords
---

# Feature Name

One-sentence description of what this does and when to use it.

## Quick Start

```typescript
// Minimal working example with real code
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, key);

// Core operation
const { data, error } = await supabase.from("table").select("*");
```

## Common Patterns

### Pattern Name

```typescript
// Concrete example - prefer this over explanations
const { data } = await supabase.from("users").select("id, email").eq("active", true);
```

## Common Mistakes

**Mistake**: Brief description of what goes wrong.

```typescript
// Incorrect
const data = await supabase.from("users").select(); // Missing error handling

// Correct
const { data, error } = await supabase.from("users").select("*");
if (error) throw error;
```

## Related

- [subtopic.md](subtopic.md) - For advanced X patterns
- [Docs](https://supabase.com/docs/guides/feature) - Official guide
