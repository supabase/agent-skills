---
title: Build RAG Applications with Supabase
impact: HIGH
impactDescription: Complete architecture for retrieval-augmented generation
tags: rag, chunking, ingestion, context-window, retrieval
---

## Build RAG Applications with Supabase

RAG (Retrieval-Augmented Generation) retrieves relevant context from vectors before sending to an LLM.

## 1. Chunks Too Large for Context Window

Large chunks consume context budget and may exceed LLM limits.

**Incorrect:**

```typescript
// 2000 token chunks × 5 results = 10K tokens - too large
const chunks = chunkText(text, 2000)
```

**Correct:**

```typescript
// Size chunks based on context budget
// GPT-4: ~128K context, reserve 4K for response
// 5 chunks × 500 tokens = 2.5K tokens for context
const chunks = chunkText(text, 500, 50)  // 500 chars, 50 overlap
```

## 2. Not Preserving Chunk Metadata

Without metadata, you lose source information for citations.

**Incorrect:**

```typescript
// Lose source information
await supabase.from('chunks').insert({ content: chunk, embedding })
```

**Correct:**

```typescript
// Track source for citations
await supabase.from('document_chunks').insert({
  document_id: doc.id,
  chunk_index: idx,
  content: chunk,
  embedding,
  metadata: { page: pageNum, section: sectionName },
})
```

## Document Schema

```sql
create table documents (
  id bigint primary key generated always as identity,
  name text not null
);

create table document_chunks (
  id bigint primary key generated always as identity,
  document_id bigint references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding extensions.vector(1536),
  unique(document_id, chunk_index)
);

create index on document_chunks using hnsw (embedding vector_cosine_ops);
```

## RAG Query Pipeline

```typescript
// 1. Embed query
const queryEmbedding = await generateEmbedding(query)

// 2. Retrieve chunks
const { data: chunks } = await supabase.rpc('match_document_chunks', {
  query_embedding: queryEmbedding,
  match_count: 5,
})

// 3. Build context and generate response
const context = chunks.map(c => c.content).join('\n\n')
const response = await llm.chat([
  { role: 'system', content: `Answer based on:\n\n${context}` },
  { role: 'user', content: query }
])
```

## Related

- [embed-generation.md](embed-generation.md) - Generate embeddings
- [search-hybrid.md](search-hybrid.md) - Improve retrieval with hybrid search
- [Docs](https://supabase.com/docs/guides/ai/rag-with-permissions) - RAG with permissions
