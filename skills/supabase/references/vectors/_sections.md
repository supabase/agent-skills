# Section Definitions

Reference files are grouped by prefix. Claude loads specific files based on user
queries.

---

## 1. Setup (setup)

**Impact:** HIGH
**Description:** pgvector extension setup, vector column types (vector, halfvec, bit), dimension configuration, and Supabase-specific schema patterns.

## 2. Indexing (index)

**Impact:** CRITICAL
**Description:** HNSW and IVFFlat index creation, parameter tuning (m, ef_construction, ef_search, lists, probes), operator classes, and concurrent index builds.

## 3. Search (search)

**Impact:** CRITICAL
**Description:** Semantic search with match_documents functions, hybrid search combining vectors with full-text, RRF scoring, metadata filtering, and RLS integration.

## 4. Embeddings (embed)

**Impact:** HIGH
**Description:** Embedding generation using gte-small built-in model, OpenAI integration, automatic embeddings with triggers, and Edge Function patterns.

## 5. RAG (rag)

**Impact:** HIGH
**Description:** Retrieval-Augmented Generation patterns including document ingestion, chunking strategies, query pipelines, and Edge Function architectures.

## 6. Performance (perf)

**Impact:** CRITICAL
**Description:** Vector search optimization, index pre-warming, compute sizing for vector workloads, batch operations, and query monitoring.
