---
title: Generate Embeddings for Vector Search
impact: HIGH
impactDescription: Enables automatic embedding generation without external API calls
tags: embeddings, gte-small, openai, triggers, edge-functions
---

## Generate Embeddings for Vector Search

Generate embeddings using Supabase's built-in model, external APIs, or automatic triggers.

## 1. Blocking Inserts with Synchronous Embedding

Synchronous embedding generation blocks inserts and causes timeouts.

**Incorrect:**

```sql
-- Insert waits for embedding API - slow and timeout-prone
create trigger embed_sync before insert on documents
for each row execute function sync_embedding();
```

**Correct:**

```sql
-- Async with pg_net - insert completes immediately
create trigger embed_async after insert on documents
for each row execute function queue_embedding_job();
```

## 2. Not Handling Embedding Failures

Embedding APIs can fail; unhandled errors cause data loss.

**Incorrect:**

```typescript
// No error handling
const embedding = await session.run(content)
await supabase.from('docs').update({ embedding }).eq('id', id)
```

**Correct:**

```typescript
// Handle failures gracefully
try {
  const embedding = await session.run(content, { mean_pool: true, normalize: true })
  if (!embedding) throw new Error('Empty embedding')
  await supabase.from('docs').update({ embedding }).eq('id', id)
} catch (error) {
  console.error('Embedding failed:', error)
  // Queue for retry or mark as failed
}
```

## Built-in gte-small Model

```typescript
// Edge Function - no external API needed
const session = new Supabase.ai.Session('gte-small')

const embedding = await session.run(input, {
  mean_pool: true,
  normalize: true,
})
// Returns 384-dim vector, English only, max 512 tokens
```

## OpenAI Embeddings

```typescript
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: text,
})
const embedding = response.data[0].embedding  // 1536-dim
```

## Related

- [setup-pgvector.md](setup-pgvector.md) - Vector column setup
- [rag-patterns.md](rag-patterns.md) - Complete RAG architecture
- [Docs](https://supabase.com/docs/guides/ai/quickstarts/generate-text-embeddings) - Embeddings guide
