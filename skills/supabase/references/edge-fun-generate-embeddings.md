---
title: Generate Text Embeddings (Edge Function)
tags: edge-functions, ai, embeddings, deno
---

## Generate Text Embeddings (Edge Functions)

Generate high-quality text embeddings using Supabase Edge Functions with the built-in AI inference API (no external embedding provider required).

### Overview

1. Create an inference session once per function instance.
2. Accept a POST request with JSON `{ "input": "..." }`.
3. Run `session.run(input)` to produce an embedding.

The `gte-small` (https://huggingface.co/Supabase/gte-small) text embedding model is supported in Supabase's Edge Runtime.

### Common Mistake

**Incorrect:**

```typescript
// Creating the session on every request (wasteful)
Deno.serve(async (req) => {
  const session = new Supabase.ai.Session("gte-small");
  const { input } = await req.json();
  const embedding = await session.run(input);
  return new Response(JSON.stringify({ embedding }));
});
```

**Correct:**

```typescript
// ./supabase/functions/embed/index.ts
const session = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  // Extract input string from JSON body
  const { input } = await req.json();

  // Generate the embedding from the user input
  const embedding = await session.run(input, {
    mean_pool: true,
    normalize: true,
  });

  // Return the embedding
  return new Response(JSON.stringify({ embedding }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Build the Edge Function

1. Initialize Supabase locally:

```shell
supabase init
supabase start
```

2. Create the Edge Function (example name: `embed`):

```shell
supabase functions new embed
```

3. Replace `./supabase/functions/embed/index.ts` with the handler above.

### Test it locally

Start a local functions server, then invoke the endpoint:

```shell
supabase functions serve
```

```shell
curl --request POST 'http://localhost:54321/functions/v1/embed' \
  --header 'Authorization: Bearer ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{ "input": "hello world" }'
```

Replace `ANON_KEY` with your project's anonymous key (get it with `supabase status`).

Reference: [Generate Embeddings](https://supabase.com/docs/guides/ai/quickstarts/generate-text-embeddings)

