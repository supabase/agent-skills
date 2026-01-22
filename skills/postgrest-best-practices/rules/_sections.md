# Section Definitions

This file defines the rule categories for PostgREST best practices. Rules are automatically assigned to sections based on their filename prefix.

---

## 1. Query Filtering (filter)
**Impact:** CRITICAL
**Description:** Filtering operators, logical combinations, negation, and efficient query patterns. The foundation for all data retrieval in PostgREST.

## 2. Resource Embedding (embed)
**Impact:** CRITICAL
**Description:** Relationships, joins, and N+1 prevention. Embedding related resources in a single request is essential for performance.

## 3. Column Selection (select)
**Impact:** HIGH
**Description:** Vertical filtering, JSON path extraction, column aliasing, and type casting. Controls what data is returned in responses.

## 4. Data Mutations (mutation)
**Impact:** HIGH
**Description:** INSERT, UPDATE, DELETE, and UPSERT operations. Safe patterns for modifying data through the API.

## 5. Functions/RPC (rpc)
**Impact:** MEDIUM-HIGH
**Description:** Calling stored procedures, parameter handling, and function result filtering. Extends PostgREST beyond CRUD operations.

## 6. Pagination & Ordering (pagination)
**Impact:** MEDIUM-HIGH
**Description:** Limit/offset, Range headers, cursor-based pagination, ordering, and counting. Essential for working with large datasets.

## 7. Response Handling (response)
**Impact:** MEDIUM
**Description:** Accept headers, Prefer headers, content negotiation, and response format control. Customizing API responses.

## 8. Authentication (auth)
**Impact:** MEDIUM
**Description:** JWT authentication, role-based access, RLS integration, and security patterns. Securing your API.

## 9. Performance (perf)
**Impact:** LOW-MEDIUM
**Description:** Indexing strategies, query plan debugging, computed columns, and views for complex queries. Optimizing PostgREST performance.
