# Postgrest Best Practices

**Version 1.0.0**
Supabase
January 2026

> This document is optimized for AI agents and LLMs. Rules are prioritized by performance impact.

---

## Abstract

Comprehensive PostgREST API best practices guide for developers using Supabase and PostgREST. Contains rules across 9 categories covering query filtering, resource embedding, column selection, mutations, RPC calls, pagination, response handling, authentication, and performance optimization. Each rule includes detailed explanations with curl commands and supabase-js examples.

---

## Table of Contents

1. [Query Filtering](#query-filtering) - **CRITICAL**
   - 1.1 [Combine Filters with AND and OR Operators](#11-combine-filters-with-and-and-or-operators)
   - 1.2 [Filter Array Columns with Containment Operators](#12-filter-array-columns-with-containment-operators)
   - 1.3 [Filter Boolean Values with IS Operator](#13-filter-boolean-values-with-is-operator)
   - 1.4 [Filter JSONB Columns with Containment Operator](#14-filter-jsonb-columns-with-containment-operator)
   - 1.5 [Filter NULL Values with IS Operator](#15-filter-null-values-with-is-operator)
   - 1.6 [Filter Range Types with Range Operators](#16-filter-range-types-with-range-operators)
   - 1.7 [Negate Filters with NOT Prefix](#17-negate-filters-with-not-prefix)
   - 1.8 [Simplify Repeated Conditions with ANY and ALL Modifiers](#18-simplify-repeated-conditions-with-any-and-all-modifiers)
   - 1.9 [Use Full-Text Search Operators for Text Queries](#19-use-full-text-search-operators-for-text-queries)
   - 1.10 [Use Pattern Matching Operators for Text Search](#110-use-pattern-matching-operators-for-text-search)
   - 1.11 [Use PostgREST Comparison Operators for Filtering](#111-use-postgrest-comparison-operators-for-filtering)
   - 1.12 [Use the IN Operator for Multiple Values](#112-use-the-in-operator-for-multiple-values)

2. [Resource Embedding](#resource-embedding) - **CRITICAL**
   - 2.1 [Disambiguate Multiple Foreign Keys with Hint Syntax](#21-disambiguate-multiple-foreign-keys-with-hint-syntax)
   - 2.2 [Embed Many-to-Many Relationships Through Junction Tables](#22-embed-many-to-many-relationships-through-junction-tables)
   - 2.3 [Embed Many-to-One Relationships (Parent Records)](#23-embed-many-to-one-relationships-parent-records)
   - 2.4 [Embed One-to-Many Relationships (Child Records)](#24-embed-one-to-many-relationships-child-records)
   - 2.5 [Embed Related Resources Using Foreign Keys](#25-embed-related-resources-using-foreign-keys)
   - 2.6 [Filter and Order Within Embedded Resources](#26-filter-and-order-within-embedded-resources)
   - 2.7 [Filter Parent by Child Using Inner Join Embedding](#27-filter-parent-by-child-using-inner-join-embedding)
   - 2.8 [Flatten Embedded Objects with Spread Syntax](#28-flatten-embedded-objects-with-spread-syntax)
   - 2.9 [Nest Embeddings for Multi-Level Relationships](#29-nest-embeddings-for-multi-level-relationships)
   - 2.10 [Use Embedding to Avoid N+1 Query Problems](#210-use-embedding-to-avoid-n1-query-problems)

3. [Column Selection](#column-selection) - **HIGH**
   - 3.1 [Access Array Elements by Index](#31-access-array-elements-by-index)
   - 3.2 [Alias Columns for Cleaner API Responses](#32-alias-columns-for-cleaner-api-responses)
   - 3.3 [Cast Column Types in Response](#33-cast-column-types-in-response)
   - 3.4 [Extract JSON Fields with Arrow Operators](#34-extract-json-fields-with-arrow-operators)
   - 3.5 [Select Only Required Columns for Better Performance](#35-select-only-required-columns-for-better-performance)
   - 3.6 [Use Computed Columns for Derived Values](#36-use-computed-columns-for-derived-values)

4. [Data Mutations](#data-mutations) - **HIGH**
   - 4.1 [Always Filter DELETE Requests](#41-always-filter-delete-requests)
   - 4.2 [Always Filter UPDATE Requests](#42-always-filter-update-requests)
   - 4.3 [Bulk Insert from CSV Data](#43-bulk-insert-from-csv-data)
   - 4.4 [Bulk Insert with JSON Arrays](#44-bulk-insert-with-json-arrays)
   - 4.5 [Insert Single Rows with POST](#45-insert-single-rows-with-post)
   - 4.6 [Restrict Writable Columns with Columns Parameter](#46-restrict-writable-columns-with-columns-parameter)
   - 4.7 [Return Affected Rows with Prefer Header](#47-return-affected-rows-with-prefer-header)
   - 4.8 [Skip Duplicates with Ignore Resolution](#48-skip-duplicates-with-ignore-resolution)
   - 4.9 [Specify Conflict Columns for Non-PK Upserts](#49-specify-conflict-columns-for-non-pk-upserts)
   - 4.10 [Upsert with Merge Duplicates](#410-upsert-with-merge-duplicates)

5. [Functions/RPC](#functionsrpc) - **MEDIUM-HIGH**
   - 5.1 [Call Stored Functions via RPC Endpoint](#51-call-stored-functions-via-rpc-endpoint)
   - 5.2 [Call Variadic Functions with Arrays or Repeated Parameters](#52-call-variadic-functions-with-arrays-or-repeated-parameters)
   - 5.3 [Filter and Embed Results from Table Functions](#53-filter-and-embed-results-from-table-functions)
   - 5.4 [Pass Complex Parameters as JSON Body](#54-pass-complex-parameters-as-json-body)
   - 5.5 [Use GET for Read-Only Functions, POST for Others](#55-use-get-for-read-only-functions-post-for-others)
   - 5.6 [Use Query Parameters for Simple GET Requests](#56-use-query-parameters-for-simple-get-requests)
   - 5.7 [Use Single JSON Parameter for Flexible Input](#57-use-single-json-parameter-for-flexible-input)

6. [Pagination & Ordering](#pagination-ordering) - **MEDIUM-HIGH**
   - 6.1 [Choose the Right Count Method for Performance](#61-choose-the-right-count-method-for-performance)
   - 6.2 [Control NULL Ordering with Nulls First/Last](#62-control-null-ordering-with-nulls-firstlast)
   - 6.3 [Implement Cursor-Based Pagination for Large Datasets](#63-implement-cursor-based-pagination-for-large-datasets)
   - 6.4 [Order Results with the Order Parameter](#64-order-results-with-the-order-parameter)
   - 6.5 [Paginate Within Embedded Resources](#65-paginate-within-embedded-resources)
   - 6.6 [Use Limit and Offset for Simple Pagination](#66-use-limit-and-offset-for-simple-pagination)
   - 6.7 [Use Range Headers for HTTP-Standard Pagination](#67-use-range-headers-for-http-standard-pagination)

7. [Response Handling](#response-handling) - **MEDIUM**
   - 7.1 [Control Response Behavior with Prefer Header](#71-control-response-behavior-with-prefer-header)
   - 7.2 [Request Single Object Instead of Array](#72-request-single-object-instead-of-array)
   - 7.3 [Request Specific Response Formats with Accept Header](#73-request-specific-response-formats-with-accept-header)
   - 7.4 [Set Response Timezone with Prefer Header](#74-set-response-timezone-with-prefer-header)
   - 7.5 [Test Mutations with Transaction Rollback](#75-test-mutations-with-transaction-rollback)
   - 7.6 [Use Column Defaults for Missing Values](#76-use-column-defaults-for-missing-values)

8. [Authentication](#authentication) - **MEDIUM**
   - 8.1 [Access JWT Claims in SQL for Custom Logic](#81-access-jwt-claims-in-sql-for-custom-logic)
   - 8.2 [Authenticate Requests with Bearer JWT](#82-authenticate-requests-with-bearer-jwt)
   - 8.3 [Combine PostgREST with Row-Level Security](#83-combine-postgrest-with-row-level-security)
   - 8.4 [Configure Anonymous Access Appropriately](#84-configure-anonymous-access-appropriately)
   - 8.5 [Configure JWT Role Claim for Authorization](#85-configure-jwt-role-claim-for-authorization)

9. [Performance](#performance) - **LOW-MEDIUM**
   - 9.1 [Create Expression Indexes for JSONB Paths](#91-create-expression-indexes-for-jsonb-paths)
   - 9.2 [Debug Queries with EXPLAIN Plan Header](#92-debug-queries-with-explain-plan-header)
   - 9.3 [Index Columns Used in PostgREST Filters](#93-index-columns-used-in-postgrest-filters)
   - 9.4 [Index Foreign Keys for Faster Embedding](#94-index-foreign-keys-for-faster-embedding)
   - 9.5 [Use Views for Complex Queries](#95-use-views-for-complex-queries)

---

## 1. Query Filtering

**Impact: CRITICAL**

Filtering operators, logical combinations, negation, and efficient query patterns. The foundation for all data retrieval in PostgREST.

### 1.1 Combine Filters with AND and OR Operators

**Impact: CRITICAL (Enables complex filtering logic in single request)**

Multiple query parameters are ANDed by default. Use `or=()` for OR logic and `and=()` for explicit grouping. Operators can be nested for complex logic.

**Incorrect (multiple requests instead of logical operators):**

```bash
# Making separate requests for OR conditions - inefficient
curl "http://localhost:3000/users?role=eq.admin"
curl "http://localhost:3000/users?role=eq.moderator"
# Then combining results client-side
```

**Correct (use or/and operators):**

```bash
# Basic OR - users who are admin OR moderator
curl "http://localhost:3000/users?or=(role.eq.admin,role.eq.moderator)"

# Implicit AND - active users in sales department
curl "http://localhost:3000/users?is_active=is.true&department=eq.sales"

# Explicit AND with OR - (active AND admin) OR (active AND moderator)
curl "http://localhost:3000/users?is_active=is.true&or=(role.eq.admin,role.eq.moderator)"

# Nested logic - (A AND B) OR (C AND D)
curl "http://localhost:3000/products?or=(and(category.eq.electronics,price.lt.100),and(category.eq.books,price.lt.20))"

# Complex: active AND (premium OR (verified AND score > 90))
curl "http://localhost:3000/users?is_active=is.true&or=(is_premium.is.true,and(is_verified.is.true,score.gt.90))"
```

**supabase-js:**

```typescript
// Basic OR
const { data } = await supabase
  .from('users')
  .select('*')
  .or('role.eq.admin,role.eq.moderator')

// AND with OR
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('is_active', true)
  .or('role.eq.admin,role.eq.moderator')

// Nested conditions
const { data } = await supabase
  .from('products')
  .select('*')
  .or('and(category.eq.electronics,price.lt.100),and(category.eq.books,price.lt.20)')
```

**Filtering on embedded resources:**

```typescript
# Filter parent by child conditions with OR
curl "http://localhost:3000/authors?select=*,books(*)&books.or=(genre.eq.fiction,genre.eq.mystery)"
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .or('genre.eq.fiction,genre.eq.mystery', { referencedTable: 'books' })
```

**Common patterns:**

```bash
# Date range (between)
curl "http://localhost:3000/events?and=(date.gte.2024-01-01,date.lte.2024-12-31)"

# Multiple status values (prefer in. over or)
curl "http://localhost:3000/orders?status=in.(pending,processing)"  # Better than or

# Exclude multiple values
curl "http://localhost:3000/orders?status=not.in.(cancelled,refunded)"
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#logical-operators

---

### 1.2 Filter Array Columns with Containment Operators

**Impact: HIGH (Query array data efficiently using PostgreSQL array operators)**

Use `cs` (contains), `cd` (contained by), and `ov` (overlap) to filter PostgreSQL array columns. Array values use curly brace syntax `{val1,val2}`.

**Incorrect (treating arrays like scalars):**

```bash
# eq doesn't work for partial array matching
curl "http://localhost:3000/posts?tags=eq.javascript"        # Won't work
curl "http://localhost:3000/posts?tags=eq.{javascript}"      # Exact match only

# LIKE doesn't work on arrays
curl "http://localhost:3000/posts?tags=like.*script*"        # Won't work
```

**Correct (use array containment operators):**

```bash
# cs (contains @>) - array contains these elements
curl "http://localhost:3000/posts?tags=cs.{javascript}"           # Has 'javascript'
curl "http://localhost:3000/posts?tags=cs.{javascript,react}"     # Has BOTH tags

# cd (contained by <@) - array is subset of these elements
curl "http://localhost:3000/posts?tags=cd.{javascript,typescript,react}"  # Only these tags

# ov (overlap &&) - arrays share at least one element
curl "http://localhost:3000/posts?tags=ov.{javascript,python,rust}"  # Has ANY of these

# Combine with other filters
curl "http://localhost:3000/posts?tags=cs.{featured}&status=eq.published"
```

**supabase-js:**

```typescript
// Contains - has this tag
const { data } = await supabase
  .from('posts')
  .select('*')
  .contains('tags', ['javascript'])

// Contains multiple - has ALL these tags
const { data } = await supabase
  .from('posts')
  .select('*')
  .contains('tags', ['javascript', 'react'])

// Contained by - only has these tags (subset)
const { data } = await supabase
  .from('posts')
  .select('*')
  .containedBy('tags', ['javascript', 'typescript', 'react'])

// Overlaps - has ANY of these tags
const { data } = await supabase
  .from('posts')
  .select('*')
  .overlaps('tags', ['javascript', 'python', 'rust'])
```

**Negating array operators:**

```typescript
# Does NOT contain tag
curl "http://localhost:3000/posts?tags=not.cs.{spam}"

# No overlap with blocked tags
curl "http://localhost:3000/posts?tags=not.ov.{spam,nsfw,blocked}"
// NOT contains
const { data } = await supabase
  .from('posts')
  .select('*')
  .not('tags', 'cs', '{spam}')
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#operators

---

### 1.3 Filter Boolean Values with IS Operator

**Impact: HIGH (Correctly filters true/false/unknown boolean states)**

Use `is.true`, `is.false`, and `is.unknown` for boolean columns. While `eq.true` works, `is` is the standard SQL approach and handles tri-state booleans (true/false/null).

**Incorrect (inconsistent boolean handling):**

```bash
# These work but are inconsistent with NULL handling
curl "http://localhost:3000/users?active=eq.true"
curl "http://localhost:3000/users?active=eq.false"

# This won't catch NULL values
curl "http://localhost:3000/users?verified=neq.true"  # Misses NULL rows!
```

**Correct (use is.true, is.false, is.unknown):**

```bash
# Filter for TRUE values
curl "http://localhost:3000/users?is_active=is.true"

# Filter for FALSE values
curl "http://localhost:3000/users?is_active=is.false"

# Filter for NULL/UNKNOWN values (nullable boolean)
curl "http://localhost:3000/users?email_verified=is.unknown"

# Combine boolean filters
curl "http://localhost:3000/users?is_active=is.true&is_admin=is.false"
```

**supabase-js:**

```typescript
// Filter for true
const { data } = await supabase
  .from('users')
  .select('*')
  .is('is_active', true)

// Filter for false
const { data } = await supabase
  .from('users')
  .select('*')
  .is('is_active', false)

// Combined filters
const { data } = await supabase
  .from('users')
  .select('*')
  .is('is_active', true)
  .is('is_admin', false)
```

**Handling nullable booleans (tri-state):**

```typescript
# Find users who have NOT verified (false or null)
curl "http://localhost:3000/users?email_verified=not.is.true"

# Find users with unknown verification status
curl "http://localhost:3000/users?email_verified=is.unknown"
// NOT true (includes false AND null)
const { data } = await supabase
  .from('users')
  .select('*')
  .not('email_verified', 'is', true)
```

Note: Boolean values are case-insensitive (`is.TRUE`, `is.True`, `is.true` all work).

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#operators

---

### 1.4 Filter JSONB Columns with Containment Operator

**Impact: HIGH (Query nested JSON data using PostgreSQL JSONB operators)**

Use `cs` (contains `@>`) to filter JSONB columns by checking if they contain specific key-value pairs. For simple value extraction, use arrow operators in the column path.

**Incorrect (string comparison on JSON):**

```bash
# These won't work as expected
curl "http://localhost:3000/products?metadata=eq.{\"color\":\"red\"}"   # String comparison
curl "http://localhost:3000/products?metadata=like.*red*"               # Text search on JSON
```

**Correct (JSONB containment with cs):**

```bash
# Contains key-value pair
curl 'http://localhost:3000/products?metadata=cs.{"color":"red"}'

# Contains nested object
curl 'http://localhost:3000/products?metadata=cs.{"dimensions":{"width":100}}'

# Contains multiple keys
curl 'http://localhost:3000/products?metadata=cs.{"color":"red","size":"large"}'

# Contains array element
curl 'http://localhost:3000/products?metadata=cs.{"tags":["featured"]}'
```

**Using arrow operators for simple value filtering:**

```bash
# Extract and compare text value (->>)
curl "http://localhost:3000/products?metadata->>color=eq.red"

# Extract nested value
curl "http://localhost:3000/products?metadata->dimensions->>width=eq.100"

# Numeric comparison (cast if needed)
curl "http://localhost:3000/products?metadata->dimensions->>width=gt.50"

# Combine with other operators
curl "http://localhost:3000/products?metadata->>color=in.(red,blue,green)"
```

**supabase-js:**

```typescript
// JSONB containment
const { data } = await supabase
  .from('products')
  .select('*')
  .contains('metadata', { color: 'red' })

// Nested containment
const { data } = await supabase
  .from('products')
  .select('*')
  .contains('metadata', { dimensions: { width: 100 } })

// Using arrow operator path
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('metadata->color', 'red')  // Note: returns JSON type

// Text extraction with ->>
const { data } = await supabase
  .from('products')
  .select('*')
  .filter('metadata->>color', 'eq', 'red')
```

**Key differences: `->` vs `->>`:**

```bash
# -> returns JSON (for numeric comparison, need proper handling)
curl "http://localhost:3000/products?metadata->price=gt.100"      # Compares as JSON number

# ->> returns text (string comparison)
curl "http://localhost:3000/products?metadata->>color=eq.red"     # String comparison
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#json-columns

---

### 1.5 Filter NULL Values with IS Operator

**Impact: HIGH (Correctly handles NULL comparisons that eq/neq cannot)**

Use `is.null` and `is.not_null` to filter NULL values. The `eq` operator cannot match NULL because NULL is not equal to anything, including itself.

**Incorrect (eq.null doesn't work as expected):**

```bash
# This does NOT work - eq cannot match NULL
curl "http://localhost:3000/users?deleted_at=eq.null"    # Wrong!
curl "http://localhost:3000/users?deleted_at=neq.null"   # Wrong!

# Empty string is not NULL
curl "http://localhost:3000/users?deleted_at=eq."        # Matches empty string, not NULL
```

**Correct (use is.null and is.not_null):**

```bash
# Find rows where column IS NULL
curl "http://localhost:3000/users?deleted_at=is.null"

# Find rows where column IS NOT NULL
curl "http://localhost:3000/users?deleted_at=is.not_null"

# Combine with other filters
curl "http://localhost:3000/users?deleted_at=is.null&status=eq.active"

# Multiple nullable columns
curl "http://localhost:3000/profiles?avatar_url=is.null&bio=is.not_null"
```

**supabase-js:**

```typescript
// IS NULL
const { data } = await supabase
  .from('users')
  .select('*')
  .is('deleted_at', null)

// IS NOT NULL
const { data } = await supabase
  .from('users')
  .select('*')
  .not('deleted_at', 'is', null)

// Combined with other filters
const { data } = await supabase
  .from('users')
  .select('*')
  .is('deleted_at', null)
  .eq('status', 'active')
```

**Common use cases:**

```bash
# Find active (non-deleted) records
curl "http://localhost:3000/posts?deleted_at=is.null"

# Find records missing required data
curl "http://localhost:3000/profiles?email=is.null"

# Find completed tasks (has completion date)
curl "http://localhost:3000/tasks?completed_at=is.not_null"
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#operators

---

### 1.6 Filter Range Types with Range Operators

**Impact: MEDIUM (Query PostgreSQL range columns (daterange, int4range, etc.))**

Use specialized operators for PostgreSQL range types (int4range, numrange, tsrange, daterange, etc.): `ov` (overlap), `sl`/`sr` (strictly left/right), `nxl`/`nxr` (not extending), `adj` (adjacent).

**Incorrect (using comparison operators on ranges):**

```bash
# These won't work correctly on range types
curl "http://localhost:3000/events?date_range=eq.[2024-01-01,2024-01-31]"  # Wrong syntax
curl "http://localhost:3000/rooms?booking=gt.2024-01-15"                     # Not for ranges
```

**Correct (range-specific operators):**

```bash
# ov (overlap &&) - ranges overlap
curl "http://localhost:3000/events?date_range=ov.[2024-01-15,2024-01-20]"

# sl (strictly left <<) - range is completely before
curl "http://localhost:3000/events?date_range=sl.[2024-02-01,2024-02-28]"

# sr (strictly right >>) - range is completely after
curl "http://localhost:3000/events?date_range=sr.[2024-01-01,2024-01-10]"

# nxl (not extending left &<) - doesn't extend to left of
curl "http://localhost:3000/events?date_range=nxl.[2024-01-01,2024-01-31]"

# nxr (not extending right &>) - doesn't extend to right of
curl "http://localhost:3000/events?date_range=nxr.[2024-01-01,2024-01-31]"

# adj (adjacent -|-) - ranges are adjacent (touch but don't overlap)
curl "http://localhost:3000/events?date_range=adj.[2024-01-31,2024-02-28]"
```

**supabase-js:**

```typescript
// Overlaps - find events during a date range
const { data } = await supabase
  .from('events')
  .select('*')
  .overlaps('date_range', '[2024-01-15,2024-01-20]')

// Using filter for other range operators
const { data } = await supabase
  .from('events')
  .select('*')
  .filter('date_range', 'sl', '[2024-02-01,2024-02-28]')

// Adjacent ranges
const { data } = await supabase
  .from('events')
  .select('*')
  .filter('date_range', 'adj', '[2024-01-31,2024-02-28]')
```

**Range syntax:**

```bash
# Inclusive bounds [ ]
[2024-01-01,2024-01-31]   # Jan 1 to Jan 31 inclusive

# Exclusive upper bound [ )
[2024-01-01,2024-02-01)   # Jan 1 to Jan 31 (Feb 1 excluded)

# Numeric ranges
[1,100]                    # 1 to 100 inclusive
(0,100]                    # 1 to 100 (0 excluded)
```

**Common use cases:**

```bash
# Room availability - no overlapping bookings
curl "http://localhost:3000/bookings?room_id=eq.5&date_range=ov.[2024-03-01,2024-03-05]"

# Events before a date
curl "http://localhost:3000/events?date_range=sl.[2024-06-01,infinity]"

# Price ranges that include a value (use containment)
curl "http://localhost:3000/products?price_range=cs.50"
```

Reference: https://www.postgresql.org/docs/current/rangetypes.html

---

### 1.7 Negate Filters with NOT Prefix

**Impact: HIGH (Enables inverse filtering for any operator)**

Prefix any operator with `not.` to negate it. This works with all operators including `eq`, `like`, `in`, `is`, and array operators.

**Incorrect (using wrong negation approach):**

```bash
# Don't use neq when you need to negate complex operators
curl "http://localhost:3000/products?tags=neq.{electronics}"  # Wrong for arrays!

# Double negation is invalid
curl "http://localhost:3000/users?status=not.not.eq.active"  # Error!
```

**Correct (not. prefix works with any operator):**

```bash
# NOT equals (same as neq)
curl "http://localhost:3000/products?status=not.eq.discontinued"

# NOT like - exclude pattern
curl "http://localhost:3000/users?email=not.like.*@spam.com"
curl "http://localhost:3000/users?email=not.ilike.*test*"

# NOT in - exclude from list
curl "http://localhost:3000/orders?status=not.in.(cancelled,refunded)"

# NOT is - for booleans/null
curl "http://localhost:3000/users?deleted_at=not.is.null"
curl "http://localhost:3000/users?is_active=not.is.false"

# NOT contains (array)
curl "http://localhost:3000/posts?tags=not.cs.{spam}"

# NOT full-text search
curl "http://localhost:3000/articles?content=not.fts.prohibited"
```

**supabase-js:**

```typescript
// NOT equals
const { data } = await supabase
  .from('products')
  .select('*')
  .neq('status', 'discontinued')

// NOT like
const { data } = await supabase
  .from('users')
  .select('*')
  .not('email', 'like', '%@spam.com')

// NOT in
const { data } = await supabase
  .from('orders')
  .select('*')
  .not('status', 'in', '(cancelled,refunded)')

// NOT is null
const { data } = await supabase
  .from('users')
  .select('*')
  .not('deleted_at', 'is', null)
```

**Negating logical operators:**

```bash
# NOT (A AND B) = NOT A OR NOT B
curl "http://localhost:3000/products?not.and=(price.gt.100,in_stock.is.true)"

# NOT (A OR B) = NOT A AND NOT B
curl "http://localhost:3000/products?not.or=(status.eq.sold,status.eq.reserved)"
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#operators

---

### 1.8 Simplify Repeated Conditions with ANY and ALL Modifiers

**Impact: MEDIUM (Cleaner syntax for multiple OR/AND conditions on same column)**

Use `(any)` and `(all)` modifiers to apply an operator against multiple values without verbose OR/AND syntax. These work with `eq`, `like`, `ilike`, `gt`, `gte`, `lt`, `lte`, `match`, `imatch`.

**Incorrect (verbose OR syntax):**

```bash
# Multiple OR conditions - verbose and hard to read
curl "http://localhost:3000/users?or=(name.like.A*,name.like.B*,name.like.C*)"

# Multiple conditions on same column
curl "http://localhost:3000/products?or=(price.gt.100,price.gt.200,price.gt.300)"
```

**Correct (use any/all modifiers):**

```bash
# any - matches if ANY value satisfies the condition (OR logic)
curl "http://localhost:3000/users?name=like(any).{A*,B*,C*}"

# Starts with any of these letters
curl "http://localhost:3000/products?name=like(any).{Phone*,Tablet*,Laptop*}"

# Case-insensitive any
curl "http://localhost:3000/users?email=ilike(any).{*@gmail.com,*@yahoo.com}"

# all - matches if ALL values satisfy condition (AND logic)
curl "http://localhost:3000/products?price=gt(all).{10,20}"   # price > 10 AND price > 20

# Equals any value (similar to IN but with any operator)
curl "http://localhost:3000/products?status=eq(any).{active,pending}"
```

**supabase-js:**

```typescript
// Using filter for any modifier
const { data } = await supabase
  .from('users')
  .select('*')
  .filter('name', 'like(any)', '{A%,B%,C%}')

// Using filter for all modifier
const { data } = await supabase
  .from('products')
  .select('*')
  .filter('price', 'gt(all)', '{10,20}')

// Note: For simple OR cases, .in() is cleaner
const { data } = await supabase
  .from('products')
  .select('*')
  .in('status', ['active', 'pending'])
```

**When to use what:**

```bash
# Use in. for simple value lists
curl "http://localhost:3000/products?status=in.(active,pending)"

# Use like(any) for multiple patterns
curl "http://localhost:3000/users?email=like(any).{*@company1.com,*@company2.com}"

# Use gt(all) when value must exceed all thresholds
curl "http://localhost:3000/products?stock=gt(all).{min_threshold,safety_stock}"
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#operators

---

### 1.9 Use Full-Text Search Operators for Text Queries

**Impact: HIGH (Efficient text search using PostgreSQL FTS instead of LIKE)**

PostgREST supports PostgreSQL full-text search with `fts` (basic), `plfts` (plain), `phfts` (phrase), and `wfts` (websearch). These are faster and more powerful than `like` for text search.

**Incorrect (using LIKE for text search):**

```bash
# LIKE is slow on large tables and limited in functionality
curl "http://localhost:3000/articles?content=like.*database*"      # No ranking, slow
curl "http://localhost:3000/articles?title=ilike.*postgresql*"     # Case insensitive but slow
```

**Correct (use FTS operators):**

```bash
# fts - basic full-text search (requires tsvector column or to_tsvector)
curl "http://localhost:3000/articles?content=fts.database"

# fts with language - specify dictionary
curl "http://localhost:3000/articles?content=fts(english).database"

# plfts - plain text search (handles quotes, operators)
curl "http://localhost:3000/articles?content=plfts.database+optimization"

# phfts - phrase search (words must be adjacent)
curl "http://localhost:3000/articles?content=phfts(english).full+text+search"

# wfts - websearch syntax (Google-like)
curl 'http://localhost:3000/articles?content=wfts(english).postgres -mysql "full text"'
```

**FTS operators and queries:**

```bash
# For boolean operators in tsquery, use plfts or wfts instead of fts
# plfts automatically ANDs multiple words
curl "http://localhost:3000/articles?content=plfts.postgres%20database"

# wfts (websearch) supports intuitive syntax: quotes, minus, OR
curl 'http://localhost:3000/articles?content=wfts.postgres%20-mysql%20%22full%20text%22'
# Searches: postgres AND NOT mysql AND "full text" phrase

# Negation with not. prefix
curl "http://localhost:3000/articles?content=not.fts.deprecated"
```

**Note:** When using `fts` directly, tsquery boolean operators (`&`, `|`, `!`) must be URL-encoded
and passed within the search term. For complex queries, prefer `wfts` (websearch syntax) which
handles this more intuitively.

**supabase-js:**

```typescript
// Basic text search
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'database')

// With language config
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'database', { config: 'english' })

// Plain text search
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'database optimization', { type: 'plain' })

// Phrase search
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'full text search', { type: 'phrase' })

// Websearch syntax
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'postgres -mysql "full text"', { type: 'websearch' })
```

**FTS Operator Reference:**

```sql
ALTER TABLE articles ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX articles_content_fts ON articles USING GIN (content_tsv);
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#full-text-search

---

### 1.10 Use Pattern Matching Operators for Text Search

**Impact: HIGH (Enables flexible text filtering with wildcards and regex)**

PostgREST provides `like`, `ilike` (case-insensitive), and `match`/`imatch` (regex) for text pattern matching. Use `*` as the wildcard character (converted to `%` internally).

**Incorrect (SQL LIKE syntax won't work):**

```bash
# SQL LIKE syntax is NOT supported
curl "http://localhost:3000/users?name LIKE '%john%'"     # Won't work
curl "http://localhost:3000/users?name LIKE 'john%'"      # Won't work
```

**Correct (PostgREST pattern operators with * wildcard):**

```bash
# LIKE - case-sensitive pattern matching (use * for wildcard)
curl "http://localhost:3000/users?name=like.*john*"      # Contains 'john'
curl "http://localhost:3000/users?name=like.john*"       # Starts with 'john'
curl "http://localhost:3000/users?name=like.*smith"      # Ends with 'smith'

# ILIKE - case-insensitive pattern matching
curl "http://localhost:3000/users?name=ilike.*JOHN*"     # Contains 'john' (any case)
curl "http://localhost:3000/users?email=ilike.*@gmail.com"

# MATCH - POSIX regex (case-sensitive)
curl "http://localhost:3000/users?name=match.^[A-Z]"     # Starts with uppercase

# IMATCH - POSIX regex (case-insensitive)
curl "http://localhost:3000/users?email=imatch.^[a-z]+@"
```

**supabase-js:**

```typescript
// LIKE - contains pattern
const { data } = await supabase
  .from('users')
  .select('*')
  .like('name', '%john%')  // Note: supabase-js uses % not *

// ILIKE - case-insensitive
const { data } = await supabase
  .from('users')
  .select('*')
  .ilike('email', '%@gmail.com')

// Starts with
const { data } = await supabase
  .from('users')
  .select('*')
  .like('name', 'john%')

// Regex matching (via filter)
const { data } = await supabase
  .from('users')
  .select('*')
  .filter('name', 'match', '^[A-Z]')
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#operators

---

### 1.11 Use PostgREST Comparison Operators for Filtering

**Impact: CRITICAL (Enables precise data filtering, foundation of all queries)**

PostgREST uses dot-notation operators for filtering. Use `eq`, `neq`, `gt`, `gte`, `lt`, `lte` instead of SQL symbols.

**Incorrect (SQL-style operators won't work):**

```bash
# These SQL-style operators are NOT supported
curl "http://localhost:3000/products?price > 100"      # Won't work
curl "http://localhost:3000/products?status = active"  # Won't work
curl "http://localhost:3000/products?price >= 50"      # Won't work
```

**Correct (PostgREST dot-notation operators):**

```bash
# Equals
curl "http://localhost:3000/products?status=eq.active"

# Not equals
curl "http://localhost:3000/products?status=neq.deleted"

# Greater than / Greater than or equal
curl "http://localhost:3000/products?price=gt.100"
curl "http://localhost:3000/products?price=gte.100"

# Less than / Less than or equal
curl "http://localhost:3000/products?price=lt.50"
curl "http://localhost:3000/products?price=lte.50"

# Combine multiple filters (implicit AND)
curl "http://localhost:3000/products?price=gte.10&price=lte.100&status=eq.active"
```

**supabase-js:**

```typescript
// Equals
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('status', 'active')

// Greater than
const { data } = await supabase
  .from('products')
  .select('*')
  .gt('price', 100)

// Chained filters (AND)
const { data } = await supabase
  .from('products')
  .select('*')
  .gte('price', 10)
  .lte('price', 100)
  .eq('status', 'active')
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#operators

---

### 1.12 Use the IN Operator for Multiple Values

**Impact: HIGH (Single filter instead of multiple OR conditions)**

Use `in.(val1,val2,val3)` to filter by a list of values instead of chaining multiple OR conditions.

**Incorrect (multiple separate requests or complex OR):**

```bash
# Making separate requests for each status - inefficient
curl "http://localhost:3000/orders?status=eq.pending"
curl "http://localhost:3000/orders?status=eq.processing"
curl "http://localhost:3000/orders?status=eq.shipped"

# Or using verbose OR syntax
curl "http://localhost:3000/orders?or=(status.eq.pending,status.eq.processing,status.eq.shipped)"
```

**Correct (single IN operator):**

```bash
# Single request with IN operator
curl "http://localhost:3000/orders?status=in.(pending,processing,shipped)"

# Works with numbers too
curl "http://localhost:3000/products?category_id=in.(1,2,3,4)"

# Works with UUIDs
curl "http://localhost:3000/users?id=in.(a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11,b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22)"
```

**supabase-js:**

```typescript
// IN with array of values
const { data } = await supabase
  .from('orders')
  .select('*')
  .in('status', ['pending', 'processing', 'shipped'])

// IN with numbers
const { data } = await supabase
  .from('products')
  .select('*')
  .in('category_id', [1, 2, 3, 4])
```

**Handling values with special characters:**

```bash
# Values containing commas must be double-quoted
curl 'http://localhost:3000/products?name=in.("Item, Large","Item, Small")'

# Values with parentheses need quoting
curl 'http://localhost:3000/products?name=in.("Widget (A)","Widget (B)")'
```

**Negating IN:**

```typescript
# NOT IN - exclude these values
curl "http://localhost:3000/orders?status=not.in.(cancelled,refunded)"
// supabase-js NOT IN
const { data } = await supabase
  .from('orders')
  .select('*')
  .not('status', 'in', '(cancelled,refunded)')
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#operators

---

## 2. Resource Embedding

**Impact: CRITICAL**

Relationships, joins, and N+1 prevention. Embedding related resources in a single request is essential for performance.

### 2.1 Disambiguate Multiple Foreign Keys with Hint Syntax

**Impact: HIGH (Resolves ambiguity when multiple FKs exist to same table)**

When a table has multiple foreign keys to the same table, PostgREST cannot automatically determine which relationship to use. Use the `!foreign_key_name` hint syntax to specify.

**Incorrect (ambiguous relationship error):**

```bash
# Error: "Could not embed because more than one relationship was found"
curl "http://localhost:3000/orders?select=*,users(*)"
# orders has both billing_user_id and shipping_user_id pointing to users!
```

**Correct (use FK name hint):**

```bash
# Specify which FK to use with !fk_name syntax
curl "http://localhost:3000/orders?select=*,billing_user:users!billing_user_id(*)"
curl "http://localhost:3000/orders?select=*,shipping_user:users!shipping_user_id(*)"

# Both in one query
curl "http://localhost:3000/orders?select=*,billing_user:users!billing_user_id(name,email),shipping_user:users!shipping_user_id(name,address)"

# Using FK constraint name (if named)
curl "http://localhost:3000/orders?select=*,users!orders_billing_user_fkey(*)"
```

**supabase-js:**

```typescript
// Disambiguate with FK hint
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    billing_user:users!billing_user_id(name, email),
    shipping_user:users!shipping_user_id(name, address)
  `)
```

**Result structure:**

```json
{
  "id": 1,
  "total": 99.99,
  "billing_user": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "shipping_user": {
    "name": "Jane Smith",
    "address": "123 Main St"
  }
}
```

**Schema pattern:**

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  billing_user_id INTEGER REFERENCES users(id),   -- First FK to users
  shipping_user_id INTEGER REFERENCES users(id),  -- Second FK to users
  total DECIMAL
);
```

**Finding FK names:**

```sql
-- Query to find foreign key constraint names
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'orders';
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html#disambiguation

---

### 2.2 Embed Many-to-Many Relationships Through Junction Tables

**Impact: HIGH (Join through junction tables automatically via foreign keys)**

PostgREST can traverse junction (pivot) tables automatically when both foreign keys are part of a composite primary key or unique constraint.

**Incorrect (manual junction table traversal):**

```bash
# Get actor
curl "http://localhost:3000/actors?id=eq.1"

# Get their film_ids from junction table
curl "http://localhost:3000/films_actors?actor_id=eq.1"

# Get each film separately
curl "http://localhost:3000/films?id=in.(1,2,3)"
```

**Correct (automatic M2M embedding):**

```bash
# Embed films through junction table (actors <-> films_actors <-> films)
curl "http://localhost:3000/actors?select=name,films(title,year)&id=eq.1"

# Reverse direction works too
curl "http://localhost:3000/films?select=title,actors(name)"

# With additional filters
curl "http://localhost:3000/actors?select=name,films(title,year)&films.year=gt.2020"
```

**supabase-js:**

```typescript
// Actor with their films
const { data } = await supabase
  .from('actors')
  .select('name, films(title, year)')
  .eq('id', 1)
  .single()

// Film with its actors
const { data } = await supabase
  .from('films')
  .select('title, actors(name)')
  .eq('id', 1)
  .single()
```

**Result structure:**

```json
{
  "name": "Tom Hanks",
  "films": [
    { "title": "Forrest Gump", "year": 1994 },
    { "title": "Cast Away", "year": 2000 },
    { "title": "Toy Story", "year": 1995 }
  ]
}
```

**Schema pattern:**

```sql
-- Junction table with composite primary key
CREATE TABLE films_actors (
  film_id INTEGER REFERENCES films(id),
  actor_id INTEGER REFERENCES actors(id),
  PRIMARY KEY (film_id, actor_id)  -- Both FKs in PK enables M2M detection
);

-- Or with unique constraint
CREATE TABLE films_actors (
  id SERIAL PRIMARY KEY,
  film_id INTEGER REFERENCES films(id),
  actor_id INTEGER REFERENCES actors(id),
  UNIQUE (film_id, actor_id)  -- Unique constraint also works
);
```

**Accessing junction table data:**

```typescript
# If junction table has extra columns (e.g., role, billing)
curl "http://localhost:3000/actors?select=name,films_actors(role,films(title))"
// Include junction table columns
const { data } = await supabase
  .from('actors')
  .select('name, films_actors(role, films(title))')
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html#many-to-many-relationships

---

### 2.3 Embed Many-to-One Relationships (Parent Records)

**Impact: HIGH (Fetch parent record as nested object via foreign key)**

When a table has a foreign key to another table, you can embed the parent record. The result is a single nested object (not an array).

**Incorrect (separate request for parent):**

```bash
# Get order
curl "http://localhost:3000/orders?id=eq.1"
# Returns: {"id": 1, "customer_id": 42, "total": 99.99}

# Separate request for customer
curl "http://localhost:3000/customers?id=eq.42"
```

**Correct (embed parent via foreign key):**

```bash
# Embed customer in order (many-to-one: many orders -> one customer)
curl "http://localhost:3000/orders?select=id,total,customer:customers(id,name,email)&id=eq.1"

# Multiple many-to-one relationships
curl "http://localhost:3000/orders?select=*,customer:customers(name),product:products(name),shipper:shippers(name)"
```

**supabase-js:**

```typescript
// Embed parent record
const { data } = await supabase
  .from('orders')
  .select('id, total, customer:customers(id, name, email)')
  .eq('id', 1)
  .single()

// Result shape - customer is an object, not an array
// { id: 1, total: 99.99, customer: { id: 42, name: "John", email: "john@example.com" } }
```

**Result structure (M2O returns object):**

```json
{
  "id": 1,
  "total": 99.99,
  "customer": {
    "id": 42,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Schema pattern:**

```sql
-- orders.customer_id references customers.id (many-to-one)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),  -- FK creates the relationship
  total DECIMAL
);
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html

---

### 2.4 Embed One-to-Many Relationships (Child Records)

**Impact: HIGH (Fetch child records as nested array via reverse foreign key)**

When other tables have foreign keys pointing to your table, you can embed those child records. The result is an array of related records.

**Incorrect (separate request for children):**

```bash
# Get author
curl "http://localhost:3000/authors?id=eq.1"

# Separate request for their books
curl "http://localhost:3000/books?author_id=eq.1"
```

**Correct (embed children via reverse FK):**

```bash
# Embed books in author (one-to-many: one author -> many books)
curl "http://localhost:3000/authors?select=id,name,books(id,title,published_date)&id=eq.1"

# All authors with their books
curl "http://localhost:3000/authors?select=*,books(title,isbn)"

# Multiple one-to-many relationships
curl "http://localhost:3000/users?select=*,posts(title),comments(text),orders(total)"
```

**supabase-js:**

```typescript
// Embed child records
const { data } = await supabase
  .from('authors')
  .select('id, name, books(id, title, published_date)')
  .eq('id', 1)
  .single()

// Result shape - books is an array
// { id: 1, name: "Jane Author", books: [{ id: 1, title: "Book 1" }, { id: 2, title: "Book 2" }] }
```

**Result structure (O2M returns array):**

```json
{
  "id": 1,
  "name": "Jane Author",
  "books": [
    { "id": 1, "title": "First Book", "published_date": "2023-01-15" },
    { "id": 2, "title": "Second Book", "published_date": "2023-06-20" },
    { "id": 3, "title": "Third Book", "published_date": "2024-02-01" }
  ]
}
```

**Schema pattern:**

```sql
-- books.author_id references authors.id (one-to-many from authors perspective)
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES authors(id),  -- FK on child table
  title TEXT
);
```

**Ordering and limiting children:**

```bash
# Latest 5 books per author
curl "http://localhost:3000/authors?select=*,books(title)&books.order=published_date.desc&books.limit=5"
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html

---

### 2.5 Embed Related Resources Using Foreign Keys

**Impact: CRITICAL (Join related tables in a single request using PostgREST's automatic relationship detection)**

PostgREST automatically detects relationships via foreign keys. Include related tables in the `select` parameter using the syntax `related_table(columns)`.

**Incorrect (no embedding - requires multiple requests):**

```bash
# First request: get posts
curl "http://localhost:3000/posts?select=id,title,author_id"

# Second request: get author details separately
curl "http://localhost:3000/users?id=eq.123"
```

**Correct (embed related resources):**

```bash
# Single request with embedded author
curl "http://localhost:3000/posts?select=id,title,author:users(id,name,email)"

# Embed all columns from related table
curl "http://localhost:3000/posts?select=*,author:users(*)"

# Multiple embeddings
curl "http://localhost:3000/posts?select=*,author:users(name),category:categories(name)"

# Without alias (uses table name)
curl "http://localhost:3000/posts?select=*,users(name)"
```

**supabase-js:**

```typescript
// Embed with alias
const { data } = await supabase
  .from('posts')
  .select('id, title, author:users(id, name, email)')

// Embed all columns
const { data } = await supabase
  .from('posts')
  .select('*, author:users(*)')

// Multiple embeddings
const { data } = await supabase
  .from('posts')
  .select('*, author:users(name), category:categories(name)')
```

**Result structure:**

```json
[
  {
    "id": 1,
    "title": "My Post",
    "author": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html

---

### 2.6 Filter and Order Within Embedded Resources

**Impact: HIGH (Apply filters, ordering, and limits to embedded collections)**

Apply filters, ordering, and pagination to embedded resources using dot-notation on query parameters.

**Incorrect (filtering all at top level):**

```bash
# This filters top-level, not the embedded resource
curl "http://localhost:3000/authors?select=*,books(*)&status=eq.published"  # Wrong! Filters authors
```

**Correct (dot-notation for embedded resource filters):**

```bash
# Filter embedded books (not authors)
curl "http://localhost:3000/authors?select=*,books(*)&books.status=eq.published"

# Order embedded books by date
curl "http://localhost:3000/authors?select=*,books(*)&books.order=published_date.desc"

# Limit embedded books
curl "http://localhost:3000/authors?select=*,books(*)&books.limit=5"

# Combine filter, order, limit on embedded resource
curl "http://localhost:3000/authors?select=*,books(*)&books.status=eq.published&books.order=published_date.desc&books.limit=5"
```

**supabase-js:**

```typescript
// Filter embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .eq('books.status', 'published')

// Order embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .order('published_date', { referencedTable: 'books', ascending: false })

// Limit embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .limit(5, { referencedTable: 'books' })

// Combined
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .eq('books.status', 'published')
  .order('published_date', { referencedTable: 'books', ascending: false })
  .limit(5, { referencedTable: 'books' })
```

**Multiple embedded resources with different filters:**

```typescript
# Different filters for different embeddings
curl "http://localhost:3000/users?select=*,posts(*),comments(*)&posts.status=eq.published&comments.order=created_at.desc&comments.limit=10"
const { data } = await supabase
  .from('users')
  .select('*, posts(*), comments(*)')
  .eq('posts.status', 'published')
  .order('created_at', { referencedTable: 'comments', ascending: false })
  .limit(10, { referencedTable: 'comments' })
```

**Filtering nested embeddings:**

```bash
# Filter at nested level
curl "http://localhost:3000/categories?select=*,products(name,reviews(*))&products.reviews.rating=gte.4"
```

**Offset for pagination within embeddings:**

```bash
# Page 2 of books (5 per page)
curl "http://localhost:3000/authors?select=*,books(*)&books.limit=5&books.offset=5"
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html#embedded-filters

---

### 2.7 Filter Parent by Child Using Inner Join Embedding

**Impact: HIGH (Filter top-level results based on embedded resource conditions)**

Use `!inner` to convert an embedding to an INNER JOIN, filtering out parent rows that have no matching children or don't match child filters.

**Incorrect (filtering doesn't affect parent results):**

```bash
# This returns ALL authors, with filtered books array (may be empty)
curl "http://localhost:3000/authors?select=*,books(*)&books.genre=eq.fiction"
# Returns authors with empty books arrays too!
```

**Correct (use !inner to filter parents):**

```bash
# Only authors who have fiction books
curl "http://localhost:3000/authors?select=*,books!inner(*)&books.genre=eq.fiction"

# Only orders with items over $100
curl "http://localhost:3000/orders?select=*,items!inner(*)&items.price=gt.100"

# Only users with verified email (via profile)
curl "http://localhost:3000/users?select=*,profile!inner(*)&profile.email_verified=is.true"
```

**supabase-js:**

```typescript
// Only authors with fiction books
const { data } = await supabase
  .from('authors')
  .select('*, books!inner(*)')
  .eq('books.genre', 'fiction')

// Only orders with expensive items
const { data } = await supabase
  .from('orders')
  .select('*, items!inner(*)')
  .gt('items.price', 100)
```

**Comparison - with vs without !inner:**

```bash
# WITHOUT !inner - all authors, some with empty books
curl "http://localhost:3000/authors?select=*,books(*)&books.year=gt.2020"
# Result: [
#   { "name": "Author A", "books": [{ "title": "New Book" }] },
#   { "name": "Author B", "books": [] },  <- included but empty
#   { "name": "Author C", "books": [] }   <- included but empty
# ]

# WITH !inner - only authors with matching books
curl "http://localhost:3000/authors?select=*,books!inner(*)&books.year=gt.2020"
# Result: [
#   { "name": "Author A", "books": [{ "title": "New Book" }] }
# ]  <- Only authors with books published after 2020
```

**Use cases:**

```bash
# Products that are in stock (have inventory records)
curl "http://localhost:3000/products?select=*,inventory!inner(*)"

# Users who have made at least one order
curl "http://localhost:3000/users?select=*,orders!inner(id)"

# Categories with published posts
curl "http://localhost:3000/categories?select=*,posts!inner(*)&posts.status=eq.published"
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html#inner-joins

---

### 2.8 Flatten Embedded Objects with Spread Syntax

**Impact: MEDIUM (Lift embedded columns to parent level for flatter response structure)**

Use spread syntax `...table(columns)` to lift embedded columns to the parent level, creating a flatter response structure. Works only with to-one relationships.

**Incorrect (nested structure when flat is preferred):**

```bash
# Returns nested object
curl "http://localhost:3000/orders?select=id,total,customer:customers(name,email)"
# Result: { "id": 1, "total": 99, "customer": { "name": "John", "email": "john@ex.com" } }
```

**Correct (spread to flatten):**

```bash
# Spread columns to top level
curl "http://localhost:3000/orders?select=id,total,...customers(name,email)"
# Result: { "id": 1, "total": 99, "name": "John", "email": "john@ex.com" }

# Spread with aliases to avoid conflicts
curl "http://localhost:3000/orders?select=id,total,...customers(customer_name:name,customer_email:email)"
# Result: { "id": 1, "total": 99, "customer_name": "John", "customer_email": "john@ex.com" }

# Multiple spreads
curl "http://localhost:3000/orders?select=id,...customers(customer_name:name),...products(product_name:name)"
```

**supabase-js:**

```typescript
// Spread embedding
const { data } = await supabase
  .from('orders')
  .select('id, total, ...customers(name, email)')

// Result shape is flat:
// { id: 1, total: 99, name: "John", email: "john@ex.com" }

// With aliases
const { data } = await supabase
  .from('orders')
  .select('id, total, ...customers(customer_name:name, customer_email:email)')
```

**Combining spread and nested:**

```json
# Spread customer, keep items nested
curl "http://localhost:3000/orders?select=id,...customers(customer_name:name),items(product_name,quantity)"
{
  "id": 1,
  "customer_name": "John",
  "items": [
    { "product_name": "Widget", "quantity": 2 },
    { "product_name": "Gadget", "quantity": 1 }
  ]
}
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html#spread-embedded-resource

---

### 2.9 Nest Embeddings for Multi-Level Relationships

**Impact: HIGH (Traverse multiple relationship levels in single request)**

Embed resources within embedded resources to traverse multiple levels of relationships in a single request.

**Incorrect (multiple requests for each level):**

```bash
# Get post
curl "http://localhost:3000/posts?id=eq.1"

# Get author
curl "http://localhost:3000/users?id=eq.{author_id}"

# Get author's company
curl "http://localhost:3000/companies?id=eq.{company_id}"
```

**Correct (nested embedding in single request):**

```bash
# Posts with author and author's company
curl "http://localhost:3000/posts?select=title,author:users(name,company:companies(name,logo_url))"

# Three levels deep
curl "http://localhost:3000/orders?select=*,customer:customers(name,address:addresses(city,country:countries(name)))"

# Nested with multiple branches
curl "http://localhost:3000/posts?select=*,author:users(name,profile:profiles(bio)),comments(text,user:users(name))"
```

**supabase-js:**

```typescript
// Nested embedding
const { data } = await supabase
  .from('posts')
  .select(`
    title,
    author:users(
      name,
      company:companies(
        name,
        logo_url
      )
    )
  `)

// Multiple nested branches
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    author:users(
      name,
      profile:profiles(bio)
    ),
    comments(
      text,
      user:users(name)
    )
  `)
```

**Result structure:**

```json
{
  "title": "My Post",
  "author": {
    "name": "John Doe",
    "company": {
      "name": "Acme Inc",
      "logo_url": "https://..."
    }
  }
}
```

**Complex example - e-commerce order:**

```typescript
curl "http://localhost:3000/orders?select=id,total,created_at,customer:customers(name,email),items:order_items(quantity,product:products(name,price,category:categories(name))),shipping:shipping_info(address,carrier:carriers(name,tracking_url))&id=eq.1"
const { data } = await supabase
  .from('orders')
  .select(`
    id,
    total,
    created_at,
    customer:customers(name, email),
    items:order_items(
      quantity,
      product:products(
        name,
        price,
        category:categories(name)
      )
    ),
    shipping:shipping_info(
      address,
      carrier:carriers(name, tracking_url)
    )
  `)
  .eq('id', 1)
  .single()
```

**Filtering at nested levels:**

```bash
# Filter at any level
curl "http://localhost:3000/posts?select=*,author:users(name,posts(title))&author.posts.status=eq.published"
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html

---

### 2.10 Use Embedding to Avoid N+1 Query Problems

**Impact: CRITICAL (Single request instead of N+1 requests, 10-100x fewer HTTP calls)**

Making separate API calls for each related record causes N+1 problems. Use embedding to fetch all related data in a single request.

**Incorrect (N+1 API calls):**

```javascript
// First: get all posts (1 request)
const posts = await fetch('http://localhost:3000/posts').then(r => r.json())

// Then: get author for each post (N requests!)
for (const post of posts) {
  const author = await fetch(`http://localhost:3000/users?id=eq.${post.author_id}`)
    .then(r => r.json())
  post.author = author[0]
}
// Total: 101 requests for 100 posts!
```

**Correct (single embedded request):**

```typescript
# Single request returns posts with nested authors
curl "http://localhost:3000/posts?select=*,author:users(id,name,avatar_url)"
// supabase-js: single request with embedding
const { data: posts } = await supabase
  .from('posts')
  .select('*, author:users(id, name, avatar_url)')

// posts[0].author is already populated
console.log(posts[0].author.name)
```

**Multiple levels of embedding:**

```typescript
# Posts with authors AND their profiles AND post comments
curl "http://localhost:3000/posts?select=*,author:users(name,profile:profiles(bio)),comments(text,user:users(name))"
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    author:users(
      name,
      profile:profiles(bio)
    ),
    comments(
      text,
      user:users(name)
    )
  `)
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html

---

## 3. Column Selection

**Impact: HIGH**

Vertical filtering, JSON path extraction, column aliasing, and type casting. Controls what data is returned in responses.

### 3.1 Access Array Elements by Index

**Impact: MEDIUM (Extract specific array elements without fetching entire array)**

Use `->index` to access specific elements in PostgreSQL array columns. Supports positive (from start) and negative (from end) indices.

**Incorrect (fetching entire array client-side):**

```bash
# Fetches entire array when you only need first element
curl "http://localhost:3000/products?select=id,tags"
# Returns: { "id": 1, "tags": ["electronics", "sale", "featured", ...] }
# Client extracts tags[0]
```

**Correct (access specific index):**

```bash
# First element (index 0)
curl "http://localhost:3000/products?select=id,primaryTag:tags->0"
# Returns: { "id": 1, "primaryTag": "electronics" }

# Second element
curl "http://localhost:3000/products?select=id,tags->1"

# Last element (negative index)
curl "http://localhost:3000/products?select=id,lastTag:tags->-1"

# Multiple elements
curl "http://localhost:3000/products?select=id,first:tags->0,second:tags->1,last:tags->-1"
```

**supabase-js:**

```typescript
// First element
const { data } = await supabase
  .from('products')
  .select('id, primaryTag:tags->0')

// Last element
const { data } = await supabase
  .from('products')
  .select('id, lastTag:tags->-1')

// Multiple
const { data } = await supabase
  .from('products')
  .select('id, first:tags->0, second:tags->1, last:tags->-1')
```

**With JSONB arrays:**

```typescript
# Access JSONB array element
curl "http://localhost:3000/products?select=id,firstImage:images->0"
# Returns JSON object at index 0

# Further navigation into array element
curl "http://localhost:3000/products?select=id,firstImageUrl:images->0->>url"
// JSONB array access with nested extraction
const { data } = await supabase
  .from('products')
  .select('id, firstImageUrl:images->0->>url')
```

**Composite type arrays:**

```bash
# Access field from composite type in array
curl "http://localhost:3000/users?select=id,primaryPhone:phones->0->>number"
```

**Filtering on array elements:**

```bash
# Filter by first tag value
curl "http://localhost:3000/products?select=*&tags->0=eq.featured"
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#composite-array-columns

---

### 3.2 Alias Columns for Cleaner API Responses

**Impact: MEDIUM (Rename columns in response without changing database schema)**

Use the `alias:column` syntax to rename columns in the response. This creates cleaner APIs without modifying your database schema.

**Incorrect (exposing database naming conventions):**

```bash
# Database snake_case exposed directly
curl "http://localhost:3000/users?select=id,first_name,last_name,created_at,updated_at"
# Returns: { "first_name": "John", "last_name": "Doe", "created_at": "..." }
```

**Correct (alias to preferred naming):**

```bash
# Alias to camelCase for JavaScript clients
curl "http://localhost:3000/users?select=id,firstName:first_name,lastName:last_name,createdAt:created_at"
# Returns: { "firstName": "John", "lastName": "Doe", "createdAt": "..." }

# Create computed-looking fields
curl "http://localhost:3000/users?select=id,fullName:full_name,profileUrl:avatar_url"

# Shorten long column names
curl "http://localhost:3000/metrics?select=id,value:measurement_value_decimal"
```

**supabase-js:**

```typescript
// Alias columns
const { data } = await supabase
  .from('users')
  .select('id, firstName:first_name, lastName:last_name, createdAt:created_at')

// Result: { id: 1, firstName: "John", lastName: "Doe", createdAt: "..." }
```

**Aliasing embedded resources:**

```typescript
# Alias the relationship name
curl "http://localhost:3000/posts?select=id,title,writer:author_id(name)"

# Alias columns within embedded resource
curl "http://localhost:3000/posts?select=id,author:users(displayName:name,profilePic:avatar_url)"
const { data } = await supabase
  .from('posts')
  .select('id, title, author:users(displayName:name, profilePic:avatar_url)')

// Result: { id: 1, title: "Post", author: { displayName: "John", profilePic: "url" } }
```

**Notes:**

```bash
# Filter uses original name, response uses alias
curl "http://localhost:3000/users?select=userId:id,userName:name&name=eq.John"
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#renaming-columns

---

### 3.3 Cast Column Types in Response

**Impact: MEDIUM (Control output format with PostgreSQL type casting)**

Use `::type` syntax to cast columns to different types in the response. Useful for formatting numbers, dates, or converting between types.

**Incorrect (client-side type conversion):**

```bash
# Fetching raw types and converting in client
curl "http://localhost:3000/products?select=id,price"
# Returns: { "price": 29.99 } - might be numeric precision issues
```

**Correct (server-side casting):**

```bash
# Cast to text
curl "http://localhost:3000/products?select=id,price::text"
# Returns: { "id": 1, "price": "29.99" }

# Cast to integer
curl "http://localhost:3000/orders?select=id,total::int"
# Returns: { "id": 1, "total": 100 }

# Date formatting
curl "http://localhost:3000/events?select=id,date::date"
# Returns timestamp as date only

# Multiple casts
curl "http://localhost:3000/products?select=id,price::text,stock::text,active::text"
```

**supabase-js:**

```typescript
// Cast to text
const { data } = await supabase
  .from('products')
  .select('id, price::text')

// Cast to integer
const { data } = await supabase
  .from('orders')
  .select('id, total::int')

// Combined with alias
const { data } = await supabase
  .from('products')
  .select('id, priceStr:price::text')
```

**Casting with JSON extraction:**

```bash
# Cast extracted JSON value
curl "http://localhost:3000/products?select=id,quantity:metadata->>stock::int"
```

**Casting in aggregates:**

```bash
# Cast aggregate result
curl "http://localhost:3000/orders?select=total.sum()::int"
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#casting-columns

---

### 3.4 Extract JSON Fields with Arrow Operators

**Impact: HIGH (Access nested JSON data directly in select without client-side processing)**

Use `->` and `->>` operators to extract fields from JSON/JSONB columns directly in your select. Use `->` for JSON type (further navigation), `->>` for text extraction.

**Incorrect (fetching entire JSON and parsing client-side):**

```bash
# Fetches entire metadata blob
curl "http://localhost:3000/products?select=id,metadata"
# Client must parse JSON to get specific fields
```

**Correct (extract specific JSON fields):**

```bash
# ->> extracts as text
curl "http://localhost:3000/products?select=id,name,metadata->>color,metadata->>size"
# Returns: { "id": 1, "name": "Widget", "color": "red", "size": "large" }

# -> extracts as JSON (preserves type)
curl "http://localhost:3000/products?select=id,metadata->dimensions"
# Returns: { "id": 1, "dimensions": { "width": 10, "height": 20 } }

# Nested extraction
curl "http://localhost:3000/products?select=id,metadata->dimensions->>width"
# Returns: { "id": 1, "width": "10" }

# Multiple levels
curl "http://localhost:3000/users?select=id,settings->notifications->>email"
```

**supabase-js:**

```typescript
// Extract as text
const { data } = await supabase
  .from('products')
  .select('id, name, metadata->>color, metadata->>size')

// Extract as JSON (for nested access)
const { data } = await supabase
  .from('products')
  .select('id, metadata->dimensions')

// Nested extraction
const { data } = await supabase
  .from('products')
  .select('id, metadata->dimensions->>width')
```

**With aliases for cleaner response:**

```typescript
curl "http://localhost:3000/products?select=id,color:metadata->>color,width:metadata->dimensions->>width"
const { data } = await supabase
  .from('products')
  .select('id, color:metadata->>color, width:metadata->dimensions->>width')
// Returns: { id: 1, color: "red", width: "10" }
```

**Array access:**

```bash
# Access array element by index
curl "http://localhost:3000/products?select=id,firstTag:metadata->tags->0"

# Last element with negative index
curl "http://localhost:3000/products?select=id,lastTag:metadata->tags->-1"
```

**Key differences: `->` vs `->>`:**

```bash
# -> keeps it as JSON (number stays number)
curl "http://localhost:3000/products?select=id,price:metadata->price"
# { "id": 1, "price": 29.99 }

# ->> converts to text
curl "http://localhost:3000/products?select=id,price:metadata->>price"
# { "id": 1, "price": "29.99" }
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#json-columns

---

### 3.5 Select Only Required Columns for Better Performance

**Impact: HIGH (Reduces data transfer, improves query performance)**

Use the `select` parameter to request only the columns you need instead of `*`. This reduces network transfer and can improve query performance.

**Incorrect (selecting all columns):**

```bash
# Selecting all columns when you only need a few
curl "http://localhost:3000/users"
# Returns all columns including large text fields, timestamps, etc.

curl "http://localhost:3000/users?select=*"
# Explicitly requesting all - same issue
```

**Correct (select specific columns):**

```bash
# Select only needed columns
curl "http://localhost:3000/users?select=id,name,email"

# For list displays, minimal columns
curl "http://localhost:3000/products?select=id,name,price,thumbnail_url"

# When embedding, select specific columns from both
curl "http://localhost:3000/orders?select=id,total,customer:customers(name)"
```

**supabase-js:**

```typescript
// Select specific columns
const { data } = await supabase
  .from('users')
  .select('id, name, email')

// Minimal for list view
const { data } = await supabase
  .from('products')
  .select('id, name, price, thumbnail_url')

// Combined with embedding
const { data } = await supabase
  .from('orders')
  .select('id, total, customer:customers(name)')
```

**Empty select returns empty objects:**

```bash
# Empty select is valid - returns {} for each row
curl "http://localhost:3000/users?select="
# Useful for existence checks or counting
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#vertical-filtering

---

### 3.6 Use Computed Columns for Derived Values

**Impact: MEDIUM (Return calculated values without client-side computation)**

PostgreSQL computed columns (generated columns or function-based) can be selected like regular columns, moving computation to the database.

**Incorrect (computing values client-side):**

```bash
# Fetch raw data and compute full_name client-side
curl "http://localhost:3000/users?select=id,first_name,last_name"
# Client: fullName = first_name + ' ' + last_name
```

**Correct (use database computed column):**

```bash
-- Option 1: Generated column (stored)
ALTER TABLE users ADD COLUMN full_name TEXT
  GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

-- Option 2: Function-based computed column
CREATE FUNCTION users_full_name(users) RETURNS TEXT AS $$
  SELECT $1.first_name || ' ' || $1.last_name
$$ LANGUAGE SQL STABLE;
# Select computed column directly
curl "http://localhost:3000/users?select=id,full_name"

# Function-based computed column (same syntax)
curl "http://localhost:3000/users?select=id,full_name"
```

**supabase-js:**

```typescript
// Select computed column
const { data } = await supabase
  .from('users')
  .select('id, full_name')

// Works the same as regular columns
```

**Creating function-based computed columns:**

```bash
-- Computed column for age from birth_date
CREATE FUNCTION users_age(users) RETURNS INTEGER AS $$
  SELECT EXTRACT(YEAR FROM age($1.birth_date))::INTEGER
$$ LANGUAGE SQL STABLE;

-- Computed column for order total
CREATE FUNCTION orders_item_count(orders) RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM order_items WHERE order_id = $1.id
$$ LANGUAGE SQL STABLE;
# Use in select
curl "http://localhost:3000/users?select=id,name,age"
curl "http://localhost:3000/orders?select=id,total,item_count"
```

**Filtering on computed columns:**

```bash
# Filter by computed value
curl "http://localhost:3000/users?select=id,name,age&age=gte.18"
```

**Ordering by computed columns:**

```bash
curl "http://localhost:3000/users?select=*&order=full_name"
```

Reference: https://postgrest.org/en/stable/references/api/computed_fields.html

---

## 4. Data Mutations

**Impact: HIGH**

INSERT, UPDATE, DELETE, and UPSERT operations. Safe patterns for modifying data through the API.

### 4.1 Always Filter DELETE Requests

**Impact: HIGH (Prevent accidental data loss with mandatory filters)**

Always include filters when using DELETE. Never delete without explicit conditions to prevent accidental data loss.

**Incorrect (no filter - catastrophic!):**

```bash
# This deletes ALL rows!
curl "http://localhost:3000/users" -X DELETE
# Entire table emptied - data loss!
```

**Correct (always include filters):**

```bash
# Delete specific row by ID
curl "http://localhost:3000/users?id=eq.123" \
  -X DELETE \
  -H "Prefer: return=representation"

# Delete multiple rows with filter
curl "http://localhost:3000/sessions?expires_at=lt.2024-01-01" \
  -X DELETE

# Delete with complex filter
curl "http://localhost:3000/orders?status=eq.cancelled&created_at=lt.2023-01-01" \
  -X DELETE \
  -H "Prefer: return=representation"
```

**supabase-js:**

```typescript
// Delete by ID
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', 123)
  .select()  // Returns deleted row

// Delete with filter
const { data, error } = await supabase
  .from('sessions')
  .delete()
  .lt('expires_at', '2024-01-01')

// Complex filter
const { data, error } = await supabase
  .from('orders')
  .delete()
  .eq('status', 'cancelled')
  .lt('created_at', '2023-01-01')
  .select()
```

**Return deleted rows:**

```bash
curl "http://localhost:3000/users?id=eq.123" \
  -X DELETE \
  -H "Prefer: return=representation"
# Returns: [{"id": 123, "name": "John", ...}]
```

**Limit affected rows:**

```bash
# Safety limit - error if too many would be deleted
curl "http://localhost:3000/old_logs?created_at=lt.2023-01-01" \
  -X DELETE \
  -H "Prefer: max-affected=1000"
# Errors if more than 1000 rows would be deleted
```

**Soft delete pattern:**

```typescript
# Instead of DELETE, update a deleted_at column
curl "http://localhost:3000/users?id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"deleted_at": "2024-01-15T10:00:00Z"}'
// Soft delete
const { data, error } = await supabase
  .from('users')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', 123)
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#delete

---

### 4.2 Always Filter UPDATE Requests

**Impact: HIGH (Prevent accidental full-table updates with mandatory filters)**

Always include filters when using PATCH to update rows. PostgREST will error on unrestricted updates by default, but always filter explicitly for safety.

**Incorrect (no filter - dangerous!):**

```bash
# This could update ALL rows!
curl "http://localhost:3000/users" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
# Error (with default config) or updates entire table!
```

**Correct (always include filters):**

```bash
# Update specific row by ID
curl "http://localhost:3000/users?id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"status": "inactive"}'

# Update multiple rows with filter
curl "http://localhost:3000/orders?status=eq.pending&created_at=lt.2024-01-01" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"status": "cancelled"}'

# Update with complex filter
curl "http://localhost:3000/products?or=(stock.eq.0,discontinued.is.true)" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"visible": false}'
```

**supabase-js:**

```typescript
// Update by ID
const { data, error } = await supabase
  .from('users')
  .update({ status: 'inactive' })
  .eq('id', 123)
  .select()

// Update multiple with filter
const { data, error } = await supabase
  .from('orders')
  .update({ status: 'cancelled' })
  .eq('status', 'pending')
  .lt('created_at', '2024-01-01')
  .select()

// Complex filter
const { data, error } = await supabase
  .from('products')
  .update({ visible: false })
  .or('stock.eq.0,discontinued.is.true')
```

**Return affected rows:**

```bash
# Get updated rows back
curl "http://localhost:3000/users?id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"email": "new@example.com"}'
# Returns: [{"id": 123, "email": "new@example.com", ...}]
```

**Limit affected rows:**

```bash
# Safety limit
curl "http://localhost:3000/orders?status=eq.pending" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation, max-affected=100" \
  -d '{"reviewed": true}'
# Errors if more than 100 rows would be affected
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#update

---

### 4.3 Bulk Insert from CSV Data

**Impact: MEDIUM (Import CSV data directly without JSON conversion)**

Use `Content-Type: text/csv` to insert data directly from CSV format. Useful for imports and data migrations.

**Incorrect (converting CSV to JSON first):**

```javascript
// Client converts CSV to JSON - extra processing
const csv = `name,price\nA,10\nB,20`
const json = csvToJson(csv)  // Unnecessary conversion
fetch('/products', { body: JSON.stringify(json), ... })
```

**Correct (POST CSV directly):**

```bash
# CSV with header row
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: text/csv" \
  -H "Prefer: return=representation" \
  -d 'name,price,category
Widget,10.99,electronics
Gadget,20.99,electronics
Tool,5.99,hardware'

# From file
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: text/csv" \
  -H "Prefer: return=representation" \
  --data-binary @products.csv
```

**supabase-js (requires raw fetch):**

```typescript
// supabase-js doesn't have built-in CSV support
// Use fetch directly
const csvData = `name,price,category
Widget,10.99,electronics
Gadget,20.99,electronics`

const response = await fetch(`${supabaseUrl}/rest/v1/products`, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/csv',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': 'return=representation'
  },
  body: csvData
})
```

**Example CSV:**

```csv
id,name,email,active
1,John Doe,john@example.com,true
2,Jane Smith,jane@example.com,true
3,"Bob, Jr.",bob@example.com,false
```

**Specifying columns:**

```bash
# Only insert specific columns (others use defaults)
curl "http://localhost:3000/products?columns=name,price" \
  -X POST \
  -H "Content-Type: text/csv" \
  -d 'name,price
Widget,10.99
Gadget,20.99'
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#specifying-columns

---

### 4.4 Bulk Insert with JSON Arrays

**Impact: HIGH (Insert multiple rows in single request for better performance)**

POST a JSON array to insert multiple rows in a single request. More efficient than multiple individual inserts.

**Incorrect (multiple individual inserts):**

```bash
# N requests for N records - slow!
curl "http://localhost:3000/products" -X POST -H "Content-Type: application/json" -d '{"name": "A"}'
curl "http://localhost:3000/products" -X POST -H "Content-Type: application/json" -d '{"name": "B"}'
curl "http://localhost:3000/products" -X POST -H "Content-Type: application/json" -d '{"name": "C"}'
# 3 HTTP requests, 3 transactions
```

**Correct (single bulk insert):**

```bash
# Single request for all records
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {"name": "Product A", "price": 10.99},
    {"name": "Product B", "price": 20.99},
    {"name": "Product C", "price": 30.99}
  ]'
# 1 HTTP request, 1 transaction, 3 rows inserted
```

**supabase-js:**

```typescript
// Bulk insert with array
const { data, error } = await supabase
  .from('products')
  .insert([
    { name: 'Product A', price: 10.99 },
    { name: 'Product B', price: 20.99 },
    { name: 'Product C', price: 30.99 }
  ])
  .select()

// Returns all inserted rows
```

**Handling partial data (different columns per row):**

```bash
# Each object can have different columns
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {"name": "A", "price": 10},
    {"name": "B", "description": "New product"},
    {"name": "C", "price": 30, "category_id": 5}
  ]'
# Missing columns use database defaults or NULL
```

**Use `missing=default` for explicit defaults:**

```bash
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation, missing=default" \
  -d '[{"name": "A"}, {"name": "B"}]'
# Uses column DEFAULT values instead of NULL
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#bulk-insert

---

### 4.5 Insert Single Rows with POST

**Impact: HIGH (Create new records using POST with JSON body)**

Use POST request with a JSON object body to insert a single row. Use `Prefer: return=representation` to get the inserted row back.

**Incorrect (GET with body or wrong content type):**

```bash
# GET cannot create records
curl "http://localhost:3000/users" -d '{"name": "John"}'  # Wrong!

# Missing content-type header
curl "http://localhost:3000/users" -X POST -d '{"name": "John"}'  # May fail
```

**Correct (POST with JSON):**

```bash
# Basic insert
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# With return=representation to get inserted row
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
# Returns: [{"id": 1, "name": "John Doe", "email": "john@example.com", "created_at": "..."}]

# Select specific columns in response
curl "http://localhost:3000/users?select=id,name" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
# Returns: [{"id": 1, "name": "John Doe"}]
```

**supabase-js:**

```typescript
// Basic insert
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John Doe', email: 'john@example.com' })

// With select (returns inserted row)
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John Doe', email: 'john@example.com' })
  .select()

// Select specific columns
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John Doe', email: 'john@example.com' })
  .select('id, name')
```

**With default values:**

```bash
# Omit columns that have defaults
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"title": "My Post", "content": "..."}'
# created_at, updated_at, etc. use database defaults
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#insert

---

### 4.6 Restrict Writable Columns with Columns Parameter

**Impact: MEDIUM (Control which columns can be set, ignore extra payload data)**

Use the `columns` query parameter to specify which columns can be written. Extra fields in the payload are ignored, providing security and flexibility.

**Incorrect (accepting any payload fields):**

```bash
# Client could send malicious fields
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com", "is_admin": true, "balance": 1000000}'
# is_admin and balance might be set if columns exist!
```

**Correct (whitelist allowed columns):**

```bash
# Only name and email are accepted
curl "http://localhost:3000/users?columns=name,email" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John", "email": "john@example.com", "is_admin": true}'
# is_admin is ignored, only name and email are inserted

# For updates too
curl "http://localhost:3000/users?columns=name,bio&id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "bio": "Hello", "role": "admin"}'
# role is ignored
```

**supabase-js (handled via payload or RLS):**

```typescript
// supabase-js doesn't have columns parameter
// Control via payload structure or RLS policies
const { data, error } = await supabase
  .from('users')
  .insert({
    name: input.name,
    email: input.email
    // Don't include is_admin even if in input
  })
  .select()

// Better: Use RLS to prevent writing sensitive columns
```

**Use cases:**

```bash
curl "http://localhost:3000/users?columns=email,password_hash,name" \
  -X POST \
  -d '{"email": "...", "password_hash": "...", "name": "...", "role": "admin"}'
# role ignored even if sent
curl "http://localhost:3000/profiles?columns=bio,avatar_url&user_id=eq.123" \
  -X PATCH \
  -d '{"bio": "New bio", "user_id": 456}'
# user_id change ignored
curl "http://localhost:3000/products?columns=sku,name,price" \
  -X POST \
  -H "Content-Type: text/csv" \
  -d 'sku,name,price,internal_cost
A001,Widget,29.99,15.00'
# internal_cost column ignored
```

2. **Profile updates** - Prevent changing sensitive fields
3. **Bulk import** - Map CSV columns explicitly

**Combine with missing=default:**

```bash
curl "http://localhost:3000/users?columns=name,email" \
  -X POST \
  -H "Prefer: missing=default, return=representation" \
  -d '{"name": "John"}'
# email uses DEFAULT if not provided, other columns use defaults too
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#specifying-columns

---

### 4.7 Return Affected Rows with Prefer Header

**Impact: MEDIUM (Get inserted/updated/deleted data without additional query)**

Use `Prefer: return=representation` to get the affected rows back in the response, avoiding an additional query.

**Incorrect (mutation then separate query):**

```javascript
// Two requests when one would suffice
await fetch('/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' })
})
// Need ID? Make another request
const user = await fetch('/users?name=eq.John&order=created_at.desc&limit=1')
```

**Correct (return=representation):**

```bash
# INSERT - get inserted row(s)
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John Doe"}'
# Returns: [{"id": 123, "name": "John Doe", "created_at": "..."}]

# UPDATE - get updated row(s)
curl "http://localhost:3000/users?id=eq.123" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"email": "new@example.com"}'

# DELETE - get deleted row(s)
curl "http://localhost:3000/users?id=eq.123" \
  -X DELETE \
  -H "Prefer: return=representation"
```

**supabase-js:**

```typescript
// Insert with select returns data
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John Doe' })
  .select()  // Equivalent to return=representation

// Update with select
const { data, error } = await supabase
  .from('users')
  .update({ email: 'new@example.com' })
  .eq('id', 123)
  .select()

// Delete with select
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', 123)
  .select()
```

**Select specific columns:**

```typescript
# Only return id and name
curl "http://localhost:3000/users?select=id,name" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John", "email": "john@example.com"}'
# Returns: [{"id": 123, "name": "John"}]
// Select specific columns
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John', email: 'john@example.com' })
  .select('id, name')
// data: [{ id: 123, name: 'John' }]
```

**With embedded resources:**

```bash
# Return with embedded data
curl "http://localhost:3000/posts?select=id,title,author:users(name)" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"title": "New Post", "author_id": 123}'
```

Reference: https://postgrest.org/en/stable/references/api/preferences.html#prefer

---

### 4.8 Skip Duplicates with Ignore Resolution

**Impact: MEDIUM (Insert new rows only, silently skip existing ones)**

Use `Prefer: resolution=ignore-duplicates` to insert new rows while silently skipping any that would violate unique constraints.

**Incorrect (checking existence before insert):**

```javascript
// Multiple requests, race condition prone
for (const item of items) {
  const existing = await fetch(`/products?sku=eq.${item.sku}`)
  if (existing.length === 0) {
    await fetch('/products', { method: 'POST', body: item })
  }
}
```

**Correct (ignore duplicates in bulk):**

```bash
# Insert new, skip existing (by PK)
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=ignore-duplicates, return=representation" \
  -d '[
    {"id": 1, "name": "Existing Product"},
    {"id": 999, "name": "New Product"}
  ]'
# Only returns newly inserted rows, silently skips id=1 if exists

# Skip by unique constraint
curl "http://localhost:3000/users?on_conflict=email" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=ignore-duplicates, return=representation" \
  -d '[
    {"email": "existing@example.com", "name": "Ignored"},
    {"email": "new@example.com", "name": "Inserted"}
  ]'
```

**supabase-js:**

```typescript
// Insert new, skip duplicates
const { data, error } = await supabase
  .from('products')
  .upsert(
    [
      { id: 1, name: 'Existing Product' },
      { id: 999, name: 'New Product' }
    ],
    { ignoreDuplicates: true }
  )
  .select()
// data contains only newly inserted rows

// With specific conflict column
const { data, error } = await supabase
  .from('users')
  .upsert(
    [
      { email: 'existing@example.com', name: 'Ignored' },
      { email: 'new@example.com', name: 'Inserted' }
    ],
    { onConflict: 'email', ignoreDuplicates: true }
  )
  .select()
```

**Use cases:**

```bash
# Daily import can be re-run safely
curl "http://localhost:3000/daily_metrics" \
  -X POST \
  -H "Prefer: resolution=ignore-duplicates" \
  -d @todays_metrics.json
const { data } = await supabase
  .from('sync_items')
  .upsert(remoteItems, { ignoreDuplicates: true })
# Process queue without duplicate errors
curl "http://localhost:3000/processed_items" \
  -X POST \
  -H "Prefer: resolution=ignore-duplicates" \
  -d @batch.json
```

2. **Sync operations** - Insert missing records only
3. **Batch processing** - No errors on duplicates

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#on-conflict

---

### 4.9 Specify Conflict Columns for Non-PK Upserts

**Impact: HIGH (Upsert based on unique constraints other than primary key)**

Use the `on_conflict` query parameter to specify which unique constraint to use for conflict detection when it's not the primary key.

**Incorrect (assuming PK is the conflict target):**

```bash
# Fails if email conflicts but id doesn't
curl "http://localhost:3000/users" \
  -X POST \
  -H "Prefer: resolution=merge-duplicates" \
  -d '{"name": "John", "email": "john@example.com"}'
# Error: duplicate key value violates unique constraint "users_email_key"
```

**Correct (specify on_conflict column):**

```bash
# Upsert based on email unique constraint
curl "http://localhost:3000/users?on_conflict=email" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates, return=representation" \
  -d '{"email": "john@example.com", "name": "John Updated"}'

# Composite unique constraint
curl "http://localhost:3000/inventory?on_conflict=product_id,location_id" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '{"product_id": 1, "location_id": 5, "quantity": 100}'

# Upsert by SKU (not id)
curl "http://localhost:3000/products?on_conflict=sku" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '{"sku": "WIDGET-001", "name": "Widget", "price": 29.99}'
```

**supabase-js:**

```typescript
// Upsert by email
const { data, error } = await supabase
  .from('users')
  .upsert(
    { email: 'john@example.com', name: 'John Updated' },
    { onConflict: 'email' }
  )
  .select()

// Composite key
const { data, error } = await supabase
  .from('inventory')
  .upsert(
    { product_id: 1, location_id: 5, quantity: 100 },
    { onConflict: 'product_id,location_id' }
  )
  .select()

// Bulk with on_conflict
const { data, error } = await supabase
  .from('products')
  .upsert(
    [
      { sku: 'A001', name: 'Widget', price: 10.99 },
      { sku: 'A002', name: 'Gadget', price: 20.99 }
    ],
    { onConflict: 'sku' }
  )
  .select()
```

**Schema requirements:**

```sql
-- Single column unique
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,  -- Can use on_conflict=email
  name TEXT
);

-- Composite unique
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INT,
  location_id INT,
  quantity INT,
  UNIQUE(product_id, location_id)  -- Can use on_conflict=product_id,location_id
);
```

**Common patterns:**

```bash
# Email-based user upsert
on_conflict=email

# Slug-based content upsert
on_conflict=slug

# External ID sync
on_conflict=external_id

# Composite business key
on_conflict=tenant_id,entity_id
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#on-conflict

---

### 4.10 Upsert with Merge Duplicates

**Impact: HIGH (Insert or update in single atomic operation)**

Use `Prefer: resolution=merge-duplicates` to insert rows or update them if they already exist (based on primary key or unique constraint).

**Incorrect (check-then-insert pattern):**

```javascript
// Race condition prone!
const existing = await fetch('/users?email=eq.john@example.com')
if (existing.length === 0) {
  await fetch('/users', { method: 'POST', body: newUser })
} else {
  await fetch('/users?id=eq.' + existing[0].id, { method: 'PATCH', body: updates })
}
// Another request could insert between check and insert!
```

**Correct (atomic upsert):**

```bash
# Upsert - inserts if not exists, updates if exists
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates, return=representation" \
  -d '{"id": 123, "name": "John Doe", "email": "john@example.com"}'

# Upsert based on unique constraint (not PK)
curl "http://localhost:3000/users?on_conflict=email" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates, return=representation" \
  -d '{"email": "john@example.com", "name": "John Updated"}'

# Bulk upsert
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates, return=representation" \
  -d '[
    {"sku": "A001", "name": "Widget", "price": 10.99},
    {"sku": "A002", "name": "Gadget", "price": 20.99}
  ]'
```

**supabase-js:**

```typescript
// Upsert by primary key
const { data, error } = await supabase
  .from('users')
  .upsert({ id: 123, name: 'John Doe', email: 'john@example.com' })
  .select()

// Upsert by unique column
const { data, error } = await supabase
  .from('users')
  .upsert(
    { email: 'john@example.com', name: 'John Updated' },
    { onConflict: 'email' }
  )
  .select()

// Bulk upsert
const { data, error } = await supabase
  .from('products')
  .upsert([
    { sku: 'A001', name: 'Widget', price: 10.99 },
    { sku: 'A002', name: 'Gadget', price: 20.99 }
  ])
  .select()
```

**Composite unique keys:**

```typescript
# on_conflict with multiple columns
curl "http://localhost:3000/inventory?on_conflict=product_id,warehouse_id" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '{"product_id": 1, "warehouse_id": 5, "quantity": 100}'
const { data, error } = await supabase
  .from('inventory')
  .upsert(
    { product_id: 1, warehouse_id: 5, quantity: 100 },
    { onConflict: 'product_id,warehouse_id' }
  )
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#upsert

---

## 5. Functions/RPC

**Impact: MEDIUM-HIGH**

Calling stored procedures, parameter handling, and function result filtering. Extends PostgREST beyond CRUD operations.

### 5.1 Call Stored Functions via RPC Endpoint

**Impact: MEDIUM-HIGH (Execute PostgreSQL functions through REST API)**

Call PostgreSQL functions using the `/rpc/function_name` endpoint. Use POST for functions with parameters or side effects, GET for read-only functions.

**Incorrect (trying to call function via table endpoint):**

```bash
# Functions are not accessible as tables
curl "http://localhost:3000/my_function"  # 404 Not Found
curl "http://localhost:3000/rpc?name=my_function"  # Wrong
```

**Correct (use /rpc/ endpoint):**

```bash
# POST with JSON parameters
curl "http://localhost:3000/rpc/add_numbers" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"a": 5, "b": 3}'
# Returns: 8

# GET for read-only functions (STABLE/IMMUTABLE)
curl "http://localhost:3000/rpc/get_current_time"
# Returns: "2024-01-15T10:30:00Z"

# GET with query parameters
curl "http://localhost:3000/rpc/add_numbers?a=5&b=3"
```

**supabase-js:**

```typescript
// Call function with parameters
const { data, error } = await supabase
  .rpc('add_numbers', { a: 5, b: 3 })
// data: 8

// Call without parameters
const { data, error } = await supabase
  .rpc('get_current_time')

// With type safety (if using generated types)
const { data } = await supabase
  .rpc('calculate_total', { order_id: 123 })
```

**Function definition example:**

```sql
CREATE FUNCTION add_numbers(a INTEGER, b INTEGER)
RETURNS INTEGER AS $$
  SELECT a + b;
$$ LANGUAGE SQL IMMUTABLE;

CREATE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE(post_count INTEGER, comment_count INTEGER) AS $$
  SELECT
    (SELECT COUNT(*) FROM posts WHERE author_id = user_id)::INTEGER,
    (SELECT COUNT(*) FROM comments WHERE author_id = user_id)::INTEGER;
$$ LANGUAGE SQL STABLE;
```

Reference: https://postgrest.org/en/stable/references/api/functions.html

---

### 5.2 Call Variadic Functions with Arrays or Repeated Parameters

**Impact: LOW-MEDIUM (Pass variable number of arguments to PostgreSQL variadic functions)**

Variadic PostgreSQL functions accept variable numbers of arguments. Call them via POST with an array or GET with repeated query parameters.

**Incorrect (passing array as single value):**

```bash
# This might not work as expected
curl "http://localhost:3000/rpc/sum_values?values=1,2,3,4"  # Parsed as string
```

**Correct (proper variadic calling):**

```bash
# POST with array in JSON body
curl "http://localhost:3000/rpc/sum_values" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"values": [1, 2, 3, 4, 5]}'

# GET with repeated parameters
curl "http://localhost:3000/rpc/sum_values?values=1&values=2&values=3&values=4&values=5"

# GET with array syntax
curl "http://localhost:3000/rpc/sum_values?values={1,2,3,4,5}"
```

**supabase-js:**

```typescript
// Pass array for variadic parameter
const { data } = await supabase.rpc('sum_values', {
  values: [1, 2, 3, 4, 5]
})

// Concatenate strings
const { data } = await supabase.rpc('concat_all', {
  strings: ['Hello', ' ', 'World', '!']
})
```

**Function definitions:**

```sql
-- Variadic integer function
CREATE FUNCTION sum_values(VARIADIC values INTEGER[])
RETURNS INTEGER AS $$
  SELECT SUM(v)::INTEGER FROM UNNEST(values) AS v;
$$ LANGUAGE SQL IMMUTABLE;

-- Variadic text function
CREATE FUNCTION concat_all(VARIADIC strings TEXT[])
RETURNS TEXT AS $$
  SELECT string_agg(s, '') FROM UNNEST(strings) AS s;
$$ LANGUAGE SQL IMMUTABLE;

-- Mixed parameters with variadic
CREATE FUNCTION format_list(prefix TEXT, VARIADIC items TEXT[])
RETURNS TEXT AS $$
  SELECT prefix || ': ' || array_to_string(items, ', ');
$$ LANGUAGE SQL IMMUTABLE;
```

**Mixed parameters:**

```typescript
# Non-variadic + variadic parameters
curl "http://localhost:3000/rpc/format_list" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"prefix": "Items", "items": ["apple", "banana", "cherry"]}'
# Returns: "Items: apple, banana, cherry"

# GET version
curl "http://localhost:3000/rpc/format_list?prefix=Items&items=apple&items=banana&items=cherry"
const { data } = await supabase.rpc('format_list', {
  prefix: 'Items',
  items: ['apple', 'banana', 'cherry']
})
```

Reference: https://postgrest.org/en/stable/references/api/functions.html#variadic-functions

---

### 5.3 Filter and Embed Results from Table Functions

**Impact: HIGH (Apply PostgREST query features to function results)**

Functions that return `SETOF` or `TABLE` can be filtered, ordered, and embedded just like regular tables. This enables powerful server-side processing with PostgREST query features.

**Incorrect (fetching all results and filtering client-side):**

```javascript
// Gets all results, filters in JS - wasteful
const allResults = await supabase.rpc('search_products', { query: 'widget' })
const filtered = allResults.filter(p => p.price < 100)
const sorted = filtered.sort((a, b) => b.rating - a.rating)
```

**Correct (filter and order in the request):**

```bash
# Filter function results
curl "http://localhost:3000/rpc/search_products?query=widget&price=lt.100"

# Order function results
curl "http://localhost:3000/rpc/search_products?query=widget&order=rating.desc"

# Pagination on function results
curl "http://localhost:3000/rpc/search_products?query=widget&limit=10&offset=20"

# Select specific columns
curl "http://localhost:3000/rpc/search_products?query=widget&select=id,name,price"

# Embed related resources
curl "http://localhost:3000/rpc/get_user_orders?user_id=123&select=*,items:order_items(product:products(name))"
```

**supabase-js:**

```typescript
// Filter function results
const { data } = await supabase
  .rpc('search_products', { query: 'widget' })
  .lt('price', 100)
  .order('rating', { ascending: false })
  .limit(10)

// Select specific columns
const { data } = await supabase
  .rpc('search_products', { query: 'widget' })
  .select('id, name, price')

// With embedding (if function returns table type with FKs)
const { data } = await supabase
  .rpc('get_user_orders', { user_id: 123 })
  .select('*, items:order_items(product:products(name))')
```

**Function definitions:**

```sql
-- Returns SETOF existing table (inherits relationships)
CREATE FUNCTION search_products(query TEXT)
RETURNS SETOF products AS $$
  SELECT * FROM products
  WHERE name ILIKE '%' || query || '%'
     OR description ILIKE '%' || query || '%';
$$ LANGUAGE SQL STABLE;

-- Returns TABLE (custom columns)
CREATE FUNCTION get_sales_report(start_date DATE, end_date DATE)
RETURNS TABLE(
  product_id INTEGER,
  product_name TEXT,
  total_sold INTEGER,
  revenue NUMERIC
) AS $$
  SELECT
    p.id,
    p.name,
    SUM(oi.quantity)::INTEGER,
    SUM(oi.quantity * oi.price)
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at BETWEEN start_date AND end_date
  GROUP BY p.id, p.name;
$$ LANGUAGE SQL STABLE;
```

**Complex example:**

```typescript
# Sales report with filters, ordering, and pagination
curl "http://localhost:3000/rpc/get_sales_report?start_date=2024-01-01&end_date=2024-12-31&revenue=gt.1000&order=revenue.desc&limit=20"
const { data } = await supabase
  .rpc('get_sales_report', {
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  })
  .gt('revenue', 1000)
  .order('revenue', { ascending: false })
  .limit(20)
```

Reference: https://postgrest.org/en/stable/references/api/functions.html#table-valued-functions

---

### 5.4 Pass Complex Parameters as JSON Body

**Impact: MEDIUM-HIGH (Send objects, arrays, and complex types as function parameters)**

Use POST with JSON body to pass complex parameters (objects, arrays, nested structures) to functions. Parameter names in JSON match function argument names.

**Incorrect (complex data in query string):**

```bash
# Arrays and objects are awkward in query strings
curl "http://localhost:3000/rpc/process_items?items=[1,2,3]"  # May not parse correctly
curl "http://localhost:3000/rpc/create_user?data={name:John}"  # JSON in URL is problematic
```

**Correct (JSON body for complex parameters):**

```bash
# Array parameter
curl "http://localhost:3000/rpc/sum_array" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"numbers": [1, 2, 3, 4, 5]}'

# Object parameter (JSONB in function)
curl "http://localhost:3000/rpc/create_user" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"user_data": {"name": "John", "email": "john@example.com", "settings": {"theme": "dark"}}}'

# Multiple parameters
curl "http://localhost:3000/rpc/transfer_funds" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"from_account": 123, "to_account": 456, "amount": 100.00, "metadata": {"note": "Payment"}}'
```

**supabase-js:**

```typescript
// Array parameter
const { data } = await supabase.rpc('sum_array', {
  numbers: [1, 2, 3, 4, 5]
})

// Object parameter
const { data } = await supabase.rpc('create_user', {
  user_data: {
    name: 'John',
    email: 'john@example.com',
    settings: { theme: 'dark' }
  }
})

// Multiple parameters
const { data } = await supabase.rpc('transfer_funds', {
  from_account: 123,
  to_account: 456,
  amount: 100.00,
  metadata: { note: 'Payment' }
})
```

**Function definitions:**

```sql
-- Array parameter
CREATE FUNCTION sum_array(numbers INTEGER[])
RETURNS INTEGER AS $$
  SELECT SUM(n)::INTEGER FROM UNNEST(numbers) AS n;
$$ LANGUAGE SQL IMMUTABLE;

-- JSONB parameter
CREATE FUNCTION create_user(user_data JSONB)
RETURNS users AS $$
  INSERT INTO users (name, email, settings)
  VALUES (
    user_data->>'name',
    user_data->>'email',
    user_data->'settings'
  )
  RETURNING *;
$$ LANGUAGE SQL;

-- Multiple parameters with JSONB
CREATE FUNCTION transfer_funds(
  from_account INTEGER,
  to_account INTEGER,
  amount NUMERIC,
  metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
  -- transfer logic
$$ LANGUAGE SQL;
```

**Nested arrays and objects:**

```bash
curl "http://localhost:3000/rpc/process_order" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 123,
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 2, "quantity": 1}
    ],
    "shipping": {
      "address": "123 Main St",
      "method": "express"
    }
  }'
```

Reference: https://postgrest.org/en/stable/references/api/functions.html#calling-functions

---

### 5.5 Use GET for Read-Only Functions, POST for Others

**Impact: MEDIUM-HIGH (Proper HTTP method based on function volatility)**

PostgREST allows GET requests only for STABLE or IMMUTABLE functions. VOLATILE functions require POST. Match HTTP semantics to function behavior.

**Incorrect (GET for volatile function):**

```bash
# VOLATILE function cannot use GET
curl "http://localhost:3000/rpc/create_order?product_id=1"
# Error: function is not STABLE or IMMUTABLE

# POST required for functions with side effects
```

**Correct (match method to volatility):**

```bash
# IMMUTABLE/STABLE functions - GET allowed
curl "http://localhost:3000/rpc/calculate_tax?amount=100"
curl "http://localhost:3000/rpc/get_user_profile?user_id=123"

# VOLATILE functions - POST required
curl "http://localhost:3000/rpc/create_order" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}'

curl "http://localhost:3000/rpc/send_notification" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123, "message": "Hello"}'
```

**supabase-js:**

```typescript
// supabase-js uses POST by default, but can use GET
// POST (default)
const { data } = await supabase.rpc('create_order', {
  product_id: 1,
  quantity: 2
})

// GET for read-only (use head: true or direct fetch)
// supabase-js always uses POST internally
```

**Function volatility:**

```sql
-- IMMUTABLE: Same inputs always return same output, no side effects
CREATE FUNCTION calculate_tax(amount NUMERIC)
RETURNS NUMERIC AS $$
  SELECT amount * 0.1;
$$ LANGUAGE SQL IMMUTABLE;

-- STABLE: May return different results for same input (reads DB), no side effects
CREATE FUNCTION get_user_profile(user_id UUID)
RETURNS users AS $$
  SELECT * FROM users WHERE id = user_id;
$$ LANGUAGE SQL STABLE;

-- VOLATILE (default): May have side effects, may return different results
CREATE FUNCTION create_order(product_id INT, quantity INT)
RETURNS orders AS $$
  INSERT INTO orders (product_id, quantity)
  VALUES (product_id, quantity)
  RETURNING *;
$$ LANGUAGE SQL VOLATILE;
```

Reference: https://postgrest.org/en/stable/references/api/functions.html#function-volatility

---

### 5.6 Use Query Parameters for Simple GET Requests

**Impact: MEDIUM (Call read-only functions with simple parameters via URL)**

For STABLE/IMMUTABLE functions with simple scalar parameters, use GET with query string parameters. This enables caching and bookmarkable URLs.

**Incorrect (POST for simple read-only calls):**

```bash
# Unnecessary POST for simple lookups
curl "http://localhost:3000/rpc/get_user" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"id": 123}'
# Works but misses caching benefits
```

**Correct (GET with query parameters):**

```bash
# Simple parameters via query string
curl "http://localhost:3000/rpc/get_user?id=123"

# Multiple parameters
curl "http://localhost:3000/rpc/calculate_shipping?weight=5&distance=100&express=true"

# String parameters (URL encoded)
curl "http://localhost:3000/rpc/search_products?query=blue%20widget&category=electronics"

# With response filtering
curl "http://localhost:3000/rpc/get_user_orders?user_id=123&select=id,total&order=created_at.desc"
```

**supabase-js:**

```typescript
// supabase-js uses POST internally, but you can use fetch for GET
const { data } = await supabase.rpc('get_user', { id: 123 })

// For true GET requests, use fetch directly
const response = await fetch(
  `${supabaseUrl}/rest/v1/rpc/get_user?id=123`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
)
```

**Function definition:**

```sql
-- STABLE function - can use GET
CREATE FUNCTION get_user(id INTEGER)
RETURNS users AS $$
  SELECT * FROM users WHERE users.id = get_user.id;
$$ LANGUAGE SQL STABLE;

-- IMMUTABLE function - can use GET
CREATE FUNCTION calculate_shipping(
  weight NUMERIC,
  distance NUMERIC,
  express BOOLEAN DEFAULT FALSE
)
RETURNS NUMERIC AS $$
  SELECT CASE
    WHEN express THEN weight * distance * 0.15
    ELSE weight * distance * 0.10
  END;
$$ LANGUAGE SQL IMMUTABLE;
```

Reference: https://postgrest.org/en/stable/references/api/functions.html#calling-functions-with-get

---

### 5.7 Use Single JSON Parameter for Flexible Input

**Impact: MEDIUM (Accept any JSON structure as function input)**

Create functions with a single unnamed `json` or `jsonb` parameter to accept the entire request body. Useful for flexible APIs where input structure varies.

**Incorrect (many individual parameters):**

```sql
-- Hard to extend, version, or make optional
CREATE FUNCTION process_order(
  customer_id INT,
  product_ids INT[],
  quantities INT[],
  shipping_address TEXT,
  billing_address TEXT,
  coupon_code TEXT,
  notes TEXT,
  -- Adding new params requires API changes
  gift_wrap BOOLEAN,
  ...
)
```

**Correct (single JSONB parameter):**

```sql
-- Flexible, extensible input
CREATE FUNCTION process_order(body JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Extract what you need
  INSERT INTO orders (customer_id, shipping_address)
  VALUES (
    (body->>'customer_id')::INT,
    body->>'shipping_address'
  )
  RETURNING to_jsonb(orders.*) INTO result;

  -- Handle items
  INSERT INTO order_items (order_id, product_id, quantity)
  SELECT
    (result->>'id')::INT,
    (item->>'product_id')::INT,
    (item->>'quantity')::INT
  FROM jsonb_array_elements(body->'items') AS item;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Calling with raw body:**

```bash
# Entire body becomes the parameter
curl "http://localhost:3000/rpc/process_order" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 123,
    "shipping_address": "123 Main St",
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 2, "quantity": 1}
    ],
    "coupon_code": "SAVE10",
    "metadata": {"source": "web", "campaign": "summer"}
  }'
```

**supabase-js:**

```typescript
// Body is passed directly to the function
const { data, error } = await supabase.rpc('process_order', {
  customer_id: 123,
  shipping_address: '123 Main St',
  items: [
    { product_id: 1, quantity: 2 },
    { product_id: 2, quantity: 1 }
  ],
  coupon_code: 'SAVE10',
  metadata: { source: 'web', campaign: 'summer' }
})
```

**How it works:**

```bash
curl "http://localhost:3000/rpc/process_order" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d '{"customer_id": 123, "items": [...]}'
```

**Validation inside function:**

```sql
CREATE FUNCTION process_order(body JSONB)
RETURNS JSONB AS $$
BEGIN
  -- Validate required fields
  IF body->>'customer_id' IS NULL THEN
    RAISE EXCEPTION 'customer_id is required';
  END IF;

  IF NOT jsonb_typeof(body->'items') = 'array' THEN
    RAISE EXCEPTION 'items must be an array';
  END IF;

  -- Process...
END;
$$ LANGUAGE plpgsql;
```

Reference: https://postgrest.org/en/stable/references/api/functions.html#single-json-object-parameter

---

## 6. Pagination & Ordering

**Impact: MEDIUM-HIGH**

Limit/offset, Range headers, cursor-based pagination, ordering, and counting. Essential for working with large datasets.

### 6.1 Choose the Right Count Method for Performance

**Impact: MEDIUM-HIGH (Balance accuracy vs performance when counting rows)**

PostgREST offers three count methods: `exact`, `planned`, and `estimated`. Choose based on your accuracy needs and table size.

**Incorrect (always using exact count):**

```bash
# Exact count on huge table - slow!
curl "http://localhost:3000/logs?limit=10" \
  -H "Prefer: count=exact"
# Scans entire table to count - takes seconds on millions of rows
```

**Correct (choose appropriate count method):**

```bash
# exact - Accurate but slow on large tables
curl "http://localhost:3000/products?limit=10" \
  -H "Prefer: count=exact"
# Content-Range: 0-9/1523 (exact count)

# planned - Fast, uses PostgreSQL statistics (may be stale)
curl "http://localhost:3000/logs?limit=10" \
  -H "Prefer: count=planned"
# Content-Range: 0-9/1000000 (estimated from pg_class.reltuples)

# estimated - Exact for small tables, planned for large
curl "http://localhost:3000/products?limit=10" \
  -H "Prefer: count=estimated"
# Uses exact if total < db-max-rows, else planned
```

**supabase-js:**

```typescript
// Exact count
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .limit(10)

// Planned count (estimated)
const { data, count } = await supabase
  .from('logs')
  .select('*', { count: 'planned' })
  .limit(10)

// Estimated (auto-chooses)
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'estimated' })
  .limit(10)
```

**When to use each:**

```typescript
// Small lookup table - use exact
const { count } = await supabase
  .from('categories')  // < 1000 rows
  .select('*', { count: 'exact' })

// Huge log table - use planned
const { count } = await supabase
  .from('request_logs')  // millions of rows
  .select('*', { count: 'planned' })

// User-facing pagination - use estimated
const { count } = await supabase
  .from('products')  // unknown size
  .select('*', { count: 'estimated' })
```

**No count (fastest):**

```typescript
# Don't request count if not needed
curl "http://localhost:3000/products?limit=10"
# No Content-Range total, fastest query
// No count - fastest
const { data } = await supabase
  .from('products')
  .select('*')  // No count option
  .limit(10)
```

**Improve planned accuracy:**

```sql
-- Keep statistics fresh for accurate planned counts
ANALYZE products;
```

Reference: https://postgrest.org/en/stable/references/api/pagination_count.html#exact-count

---

### 6.2 Control NULL Ordering with Nulls First/Last

**Impact: MEDIUM (Specify where NULL values appear in sorted results)**

Use `.nullsfirst` or `.nullslast` modifiers to control where NULL values appear in sorted results.

**Incorrect (inconsistent NULL handling):**

```bash
# Default NULL ordering varies by database and direction
curl "http://localhost:3000/products?order=discount.desc"
# NULLs might appear first or last depending on PostgreSQL default
```

**Correct (explicit NULL ordering):**

```bash
# NULLs at the end (common for "missing data")
curl "http://localhost:3000/products?order=discount.desc.nullslast"

# NULLs at the beginning
curl "http://localhost:3000/products?order=priority.asc.nullsfirst"

# Combined with multiple columns
curl "http://localhost:3000/products?order=category.asc,discount.desc.nullslast"

# Each column can have its own null handling
curl "http://localhost:3000/tasks?order=due_date.asc.nullslast,priority.desc.nullsfirst"
```

**supabase-js:**

```typescript
// NULLs last
const { data } = await supabase
  .from('products')
  .select('*')
  .order('discount', { ascending: false, nullsFirst: false })

// NULLs first
const { data } = await supabase
  .from('products')
  .select('*')
  .order('priority', { ascending: true, nullsFirst: true })

// Multiple columns with null handling
const { data } = await supabase
  .from('tasks')
  .select('*')
  .order('due_date', { ascending: true, nullsFirst: false })
  .order('priority', { ascending: false, nullsFirst: true })
```

**Common patterns:**

```bash
# Tasks by due date - no due date at end
curl "http://localhost:3000/tasks?order=due_date.asc.nullslast"
# Shows: Jan 1, Jan 5, Feb 1, NULL, NULL

# Products by discount - no discount last
curl "http://localhost:3000/products?order=discount.desc.nullslast"
# Shows: 50%, 30%, 10%, NULL, NULL

# Sort by optional field with nulls first
curl "http://localhost:3000/users?order=last_login.desc.nullsfirst"
# Shows: NULL (never logged in), Jan 15, Jan 10...
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#ordering

---

### 6.3 Implement Cursor-Based Pagination for Large Datasets

**Impact: HIGH (Efficient pagination that doesn't degrade on deep pages)**

Use cursor-based (keyset) pagination instead of offset for large datasets. Performance stays constant regardless of page depth.

**Incorrect (offset degrades on deep pages):**

```bash
# Page 1000 with offset - scans and discards 9990 rows!
curl "http://localhost:3000/products?order=id&limit=10&offset=9990"
# Gets slower as offset increases
```

**Correct (cursor-based pagination):**

```bash
# First page - order by a unique column
curl "http://localhost:3000/products?order=id&limit=10"
# Returns: [..., {"id": 10, "name": "Product 10"}]

# Next page - filter by last seen id
curl "http://localhost:3000/products?order=id&limit=10&id=gt.10"
# Returns: [{"id": 11, ...}, ..., {"id": 20, ...}]

# Next page
curl "http://localhost:3000/products?order=id&limit=10&id=gt.20"

# Descending order (newer first)
curl "http://localhost:3000/products?order=created_at.desc,id.desc&limit=10"
# Next page: use last item's values
curl "http://localhost:3000/products?order=created_at.desc,id.desc&limit=10&or=(created_at.lt.2024-01-15,and(created_at.eq.2024-01-15,id.lt.100))"
```

**supabase-js:**

```typescript
// First page
const { data: firstPage } = await supabase
  .from('products')
  .select('*')
  .order('id')
  .limit(10)

// Get cursor from last item
const lastId = firstPage[firstPage.length - 1].id

// Next page using cursor
const { data: nextPage } = await supabase
  .from('products')
  .select('*')
  .order('id')
  .gt('id', lastId)
  .limit(10)

// Helper function
async function fetchPage(cursor?: number) {
  let query = supabase
    .from('products')
    .select('*')
    .order('id')
    .limit(10)

  if (cursor) {
    query = query.gt('id', cursor)
  }

  const { data } = await query
  const nextCursor = data?.length ? data[data.length - 1].id : null

  return { data, nextCursor }
}
```

**Compound cursor (non-unique sort column):**

```typescript
// When sorting by non-unique column, include tie-breaker
async function fetchByDate(cursor?: { date: string; id: number }) {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(10)

  if (cursor) {
    // Items before cursor (descending)
    query = query.or(
      `created_at.lt.${cursor.date},and(created_at.eq.${cursor.date},id.lt.${cursor.id})`
    )
  }

  const { data } = await query
  const lastItem = data?.[data.length - 1]
  const nextCursor = lastItem
    ? { date: lastItem.created_at, id: lastItem.id }
    : null

  return { data, nextCursor }
}
```

Reference: https://use-the-index-luke.com/no-offset

---

### 6.4 Order Results with the Order Parameter

**Impact: MEDIUM-HIGH (Sort results by any column with direction control)**

Use the `order` parameter to sort results. Specify column name and optional direction (`.asc` or `.desc`). Essential for consistent pagination.

**Incorrect (relying on database default order):**

```bash
# No order specified - results may vary between requests
curl "http://localhost:3000/products?limit=10"
# Order is undefined, inconsistent for pagination
```

**Correct (explicit ordering):**

```bash
# Ascending (default)
curl "http://localhost:3000/products?order=name"
curl "http://localhost:3000/products?order=name.asc"

# Descending
curl "http://localhost:3000/products?order=created_at.desc"

# Multiple columns (comma-separated)
curl "http://localhost:3000/products?order=category.asc,price.desc"

# With other parameters
curl "http://localhost:3000/products?category=eq.electronics&order=price.desc&limit=20"
```

**supabase-js:**

```typescript
// Ascending (default)
const { data } = await supabase
  .from('products')
  .select('*')
  .order('name')

// Descending
const { data } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })

// Multiple columns
const { data } = await supabase
  .from('products')
  .select('*')
  .order('category')
  .order('price', { ascending: false })
```

**Order by JSON fields:**

```typescript
# Order by JSONB field
curl "http://localhost:3000/products?order=metadata->>priority.desc"

# Order by nested JSON
curl "http://localhost:3000/products?order=metadata->dimensions->>weight.asc"
const { data } = await supabase
  .from('products')
  .select('*')
  .order('metadata->priority', { ascending: false })
```

**Order embedded resources:**

```typescript
# Order parent by embedded column (to-one only)
curl "http://localhost:3000/posts?select=*,author:users(name)&order=author(name)"

# Order within embedded resource
curl "http://localhost:3000/authors?select=*,books(*)&books.order=published_date.desc"
// Order embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .order('published_date', { referencedTable: 'books', ascending: false })
```

**Important for pagination:**

```bash
# Always order when paginating for consistent results
curl "http://localhost:3000/products?order=id&limit=10&offset=10"

# For cursor pagination, include unique column
curl "http://localhost:3000/products?order=created_at.desc,id.desc&limit=10"
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#ordering

---

### 6.5 Paginate Within Embedded Resources

**Impact: MEDIUM (Limit and order child collections independently)**

Apply pagination, ordering, and limits to embedded resources using dot-notation parameters.

**Incorrect (fetching all children):**

```bash
# Fetches ALL books for each author - could be thousands
curl "http://localhost:3000/authors?select=*,books(*)"
# Each author might have 500+ books!
```

**Correct (limit embedded resources):**

```bash
# Limit books per author
curl "http://localhost:3000/authors?select=*,books(*)&books.limit=5"

# Order and limit
curl "http://localhost:3000/authors?select=*,books(*)&books.order=published_date.desc&books.limit=5"
# Shows latest 5 books per author

# Offset within embedded (page 2 of books)
curl "http://localhost:3000/authors?select=*,books(*)&books.order=title&books.limit=10&books.offset=10"

# Combined with parent filters
curl "http://localhost:3000/authors?genre=eq.fiction&select=*,books(*)&books.limit=3"
```

**supabase-js:**

```typescript
// Limit embedded resource
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .limit(5, { referencedTable: 'books' });

// Order and limit embedded
const { data } = await supabase
  .from('authors')
  .select('*, books(*)')
  .order('published_date', { referencedTable: 'books', ascending: false })
  .limit(5, { referencedTable: 'books' });

// Multiple embedded resources with different limits
const { data } = await supabase
  .from('users')
  .select('*, posts(*), comments(*)')
  .order('created_at', { referencedTable: 'posts', ascending: false })
  .limit(10, { referencedTable: 'posts' })
  .order('created_at', { referencedTable: 'comments', ascending: false })
  .limit(5, { referencedTable: 'comments' });
```

**Multiple embedded resources:**

```bash
# Different limits for different embeddings
curl "http://localhost:3000/users?select=*,posts(*),comments(*)&posts.limit=10&posts.order=created_at.desc&comments.limit=5&comments.order=created_at.desc"
```

**Nested embedded pagination:**

```typescript
# Limit at multiple levels
curl "http://localhost:3000/authors?select=*,books(title,reviews(*))&books.limit=3&books.reviews.limit=5"
const { data } = await supabase
  .from('authors')
  .select('*, books(title, reviews(*))')
  .limit(3, { referencedTable: 'books' })
  .limit(5, { referencedTable: 'books.reviews' });
```

**Common patterns:**

```bash
# Show preview data
# Users with latest 3 posts
curl "http://localhost:3000/users?select=*,posts(*)&posts.order=created_at.desc&posts.limit=3"

# Categories with top 5 products by rating
curl "http://localhost:3000/categories?select=*,products(*)&products.order=rating.desc&products.limit=5"

# Authors with upcoming books only
curl "http://localhost:3000/authors?select=*,books(*)&books.release_date=gt.2024-01-01&books.order=release_date&books.limit=2"
```

Reference: https://postgrest.org/en/stable/references/api/resource_embedding.html#embedded-filters

---

### 6.6 Use Limit and Offset for Simple Pagination

**Impact: MEDIUM-HIGH (Basic pagination with page-based navigation)**

Use `limit` and `offset` query parameters for basic pagination. Simple to implement but less efficient for deep pages.

**Incorrect (fetching all records):**

```bash
# Fetches entire table - slow and memory intensive
curl "http://localhost:3000/products"
# Returns thousands of rows
```

**Correct (paginated requests):**

```bash
# First page (10 items)
curl "http://localhost:3000/products?limit=10"

# Second page
curl "http://localhost:3000/products?limit=10&offset=10"

# Third page
curl "http://localhost:3000/products?limit=10&offset=20"

# With ordering (important for consistent pagination)
curl "http://localhost:3000/products?order=created_at.desc&limit=10&offset=0"

# Combined with filters
curl "http://localhost:3000/products?category=eq.electronics&limit=10&offset=0"
```

**supabase-js:**

```typescript
// First page
const { data } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, 9)  // 0-indexed, inclusive (returns 10 items)

// Second page
const { data } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })
  .range(10, 19)

// Using limit/offset directly
const { data } = await supabase
  .from('products')
  .select('*')
  .limit(10)
  .offset(20)  // Page 3
```

**Calculating offset:**

```typescript
// Page-based calculation
const pageSize = 10
const page = 3  // 1-indexed
const offset = (page - 1) * pageSize  // 20

const { data } = await supabase
  .from('products')
  .select('*')
  .limit(pageSize)
  .offset(offset)
```

**Important: Always include ORDER BY:**

```bash
# Without order, results may be inconsistent between pages
curl "http://localhost:3000/products?limit=10&offset=10"  # Order may vary!

# With explicit order - consistent results
curl "http://localhost:3000/products?order=id&limit=10&offset=10"
```

Reference: https://postgrest.org/en/stable/references/api/pagination_count.html

---

### 6.7 Use Range Headers for HTTP-Standard Pagination

**Impact: MEDIUM (RFC 7233 compliant pagination with Content-Range response)**

Use the `Range` header instead of query parameters for RFC 7233 compliant pagination. Response includes `Content-Range` with total count.

**Incorrect (mixing pagination approaches):**

```bash
# Query params don't give you total count in headers
curl "http://localhost:3000/products?limit=10&offset=0"
# No Content-Range header in response
```

**Correct (Range header pagination):**

```bash
# Request items 0-9 (first 10)
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 0-9"

# Response includes:
# HTTP/1.1 206 Partial Content
# Content-Range: 0-9/1000

# Next page: items 10-19
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 10-19"

# Open-ended range (from 50 to end)
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 50-"
```

**supabase-js:**

```typescript
// supabase-js uses range() which translates to limit/offset
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })  // Request count
  .range(0, 9)

// count contains total number of rows
console.log(`Showing ${data.length} of ${count} items`)
```

**Response headers:**

```sql
HTTP/1.1 206 Partial Content
Content-Range: 0-9/1000
Content-Type: application/json
```

| Header | Meaning |
|--------|---------|
| `206 Partial Content` | Partial result returned |
| `Content-Range: 0-9/1000` | Items 0-9 of 1000 total |
| `Content-Range: 0-9/*` | Total unknown (no count) |

**Combine with Prefer: count:**

```bash
# Get exact count
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 0-9" \
  -H "Prefer: count=exact"
# Content-Range: 0-9/1000 (exact count)

# Get estimated count (faster for large tables)
curl "http://localhost:3000/products" \
  -H "Range-Unit: items" \
  -H "Range: 0-9" \
  -H "Prefer: count=estimated"
```

Reference: https://postgrest.org/en/stable/references/api/pagination_count.html#limits-and-pagination

---

## 7. Response Handling

**Impact: MEDIUM**

Accept headers, Prefer headers, content negotiation, and response format control. Customizing API responses.

### 7.1 Control Response Behavior with Prefer Header

**Impact: MEDIUM (Customize return format, counting, and handling behavior)**

Use the `Prefer` header (RFC 7240) to control various response behaviors including return format, counting, and error handling.

**Incorrect (not using Prefer options):**

```bash
# Mutation returns nothing by default
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
# Response: empty, status 201
# Need another request to get the created row
```

**Correct (use Prefer header):**

```bash
# Return created/updated rows
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "John"}'
# Returns: [{"id": 1, "name": "John", ...}]

# Get row count
curl "http://localhost:3000/products?category=eq.electronics" \
  -H "Prefer: count=exact"
# Content-Range: 0-9/150

# Multiple preferences
curl "http://localhost:3000/users" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation, count=exact" \
  -d '{"name": "John"}'
```

**supabase-js equivalents:**

```typescript
// return=representation -> .select()
const { data } = await supabase
  .from('users')
  .insert({ name: 'John' })
  .select()

// count=exact -> { count: 'exact' }
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .eq('category', 'electronics')
```

**Strict handling:**

```bash
# Strict mode - error on invalid preferences
curl "http://localhost:3000/users" \
  -H "Prefer: handling=strict, invalid-option=xyz"
# Error: invalid preference

# Lenient mode (default) - ignore invalid preferences
curl "http://localhost:3000/users" \
  -H "Prefer: handling=lenient, invalid-option=xyz"
# Ignores unknown preference, continues
```

**Response includes applied preferences:**

```sql
HTTP/1.1 200 OK
Preference-Applied: return=representation, count=exact
```

Reference: https://postgrest.org/en/stable/references/api/preferences.html

---

### 7.2 Request Single Object Instead of Array

**Impact: MEDIUM (Get unwrapped object for single-row queries)**

Use `Accept: application/vnd.pgrst.object+json` to get a single object instead of an array when expecting one row.

**Incorrect (array wrapping single result):**

```bash
curl "http://localhost:3000/users?id=eq.123"
# Returns: [{"id": 123, "name": "John"}]  <- Array with one item

# Client must unwrap:
# const user = data[0]
```

**Correct (request singular object):**

```bash
# Single object response
curl "http://localhost:3000/users?id=eq.123" \
  -H "Accept: application/vnd.pgrst.object+json"
# Returns: {"id": 123, "name": "John"}  <- Direct object

# Works with any single-row query
curl "http://localhost:3000/profiles?user_id=eq.123" \
  -H "Accept: application/vnd.pgrst.object+json"
```

**supabase-js:**

```typescript
// Use .single() for singular response
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', 123)
  .single()

// data is the object directly, not an array
console.log(data.name)  // "John"

// Error if not exactly one row
// - No rows: error.code = 'PGRST116'
// - Multiple rows: error.code = 'PGRST116'
```

**Error handling:**

```typescript
# No matching rows - 406 Not Acceptable
curl "http://localhost:3000/users?id=eq.999" \
  -H "Accept: application/vnd.pgrst.object+json"
# Error: "JSON object requested, multiple (or no) rows returned"

# Multiple rows - 406 Not Acceptable
curl "http://localhost:3000/users?status=eq.active" \
  -H "Accept: application/vnd.pgrst.object+json"
# Error: multiple rows returned
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', 123)
  .single()

if (error) {
  if (error.code === 'PGRST116') {
    // No rows or multiple rows
    console.log('User not found or query ambiguous')
  }
}
```

**Use cases:**

```typescript
// Fetch single record by ID
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// Get authenticated user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', session.user.id)
  .single()

// Lookup by unique field
const { data: product } = await supabase
  .from('products')
  .select('*')
  .eq('sku', 'WIDGET-001')
  .single()
```

**maybeSingle() for optional results:**

```typescript
// Won't error if no rows found
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', 123)
  .maybeSingle()

// data is null if no rows, object if one row
// Still errors if multiple rows
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#singular-or-plural

---

### 7.3 Request Specific Response Formats with Accept Header

**Impact: MEDIUM (Get data as JSON, CSV, or other formats based on client needs)**

Use the `Accept` header to request different response formats. PostgREST supports JSON (default), CSV, and custom formats.

**Incorrect (assuming JSON only):**

```bash
# Always returns JSON by default
curl "http://localhost:3000/products"
# Content-Type: application/json

# Can't easily export to spreadsheet
```

**Correct (specify Accept header):**

```bash
# JSON (default)
curl "http://localhost:3000/products" \
  -H "Accept: application/json"

# CSV format - great for exports/spreadsheets
curl "http://localhost:3000/products" \
  -H "Accept: text/csv"
# Returns:
# id,name,price
# 1,Widget,29.99
# 2,Gadget,49.99

# GeoJSON (if using PostGIS)
curl "http://localhost:3000/locations" \
  -H "Accept: application/geo+json"

# Binary data (for bytea columns)
curl "http://localhost:3000/files?id=eq.1&select=content" \
  -H "Accept: application/octet-stream"
```

**supabase-js (CSV requires fetch):**

```typescript
// JSON (default with supabase-js)
const { data } = await supabase
  .from('products')
  .select('*')

// CSV - use direct fetch
const response = await fetch(
  `${supabaseUrl}/rest/v1/products?select=*`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'text/csv'
    }
  }
)
const csv = await response.text()
```

**CSV export with filters:**

```bash
# Export filtered data as CSV
curl "http://localhost:3000/orders?status=eq.completed&created_at=gte.2024-01-01" \
  -H "Accept: text/csv" \
  -o orders_export.csv

# With specific columns
curl "http://localhost:3000/orders?select=id,customer_name,total,created_at&status=eq.completed" \
  -H "Accept: text/csv"
```

Reference: https://postgrest.org/en/stable/references/api/tables_views.html#response-format

---

### 7.4 Set Response Timezone with Prefer Header

**Impact: MEDIUM (Return timestamps in specific timezone instead of UTC)**

Use `Prefer: timezone=` to return timestamps converted to a specific timezone instead of UTC.

**Incorrect (manual timezone conversion):**

```javascript
// Fetching UTC and converting client-side
const { data } = await supabase.from('events').select('*')
// data[0].start_time = "2024-01-15T10:00:00+00:00" (UTC)

// Client must convert for display
const localTime = new Date(data[0].start_time).toLocaleString('en-US', {
  timeZone: 'America/New_York'
})
```

**Correct (request timezone in response):**

```bash
# Request timestamps in specific timezone
curl "http://localhost:3000/events" \
  -H "Prefer: timezone=America/New_York"
# Returns: {"start_time": "2024-01-15T05:00:00-05:00"}

# Different timezone
curl "http://localhost:3000/events" \
  -H "Prefer: timezone=Europe/London"

# Combined with other preferences
curl "http://localhost:3000/events" \
  -H "Prefer: timezone=Asia/Tokyo, return=representation"
```

**supabase-js (requires direct fetch or handling):**

```typescript
// supabase-js doesn't directly support timezone preference
// Use fetch for timezone conversion
const response = await fetch(
  `${supabaseUrl}/rest/v1/events`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'timezone=America/New_York'
    }
  }
)
const data = await response.json()
// Timestamps are now in Eastern time

// Or convert client-side (more common with supabase-js)
const { data } = await supabase.from('events').select('*')
// Use a library like date-fns-tz or moment-timezone
```

**Timezone format:**

```bash
# IANA timezone names
Prefer: timezone=America/New_York
Prefer: timezone=Europe/Paris
Prefer: timezone=Asia/Tokyo
Prefer: timezone=UTC

# Offset format (not recommended)
Prefer: timezone=+05:30
```

**Use cases:**

```bash
# User-specific timezone for events app
curl "http://localhost:3000/events?user_id=eq.123" \
  -H "Prefer: timezone=America/Los_Angeles"

# Report for specific region
curl "http://localhost:3000/transactions?created_at=gte.2024-01-01" \
  -H "Prefer: timezone=Europe/London"
```

**Per-function timezone:**

```sql
-- Alternatively, set timezone in function
CREATE FUNCTION get_local_events(tz TEXT)
RETURNS SETOF events AS $$
  SET LOCAL timezone TO tz;
  SELECT * FROM events;
$$ LANGUAGE SQL;
```

Reference: https://postgrest.org/en/stable/references/api/preferences.html#timezone

---

### 7.5 Test Mutations with Transaction Rollback

**Impact: MEDIUM (Validate mutations without persisting changes)**

Use `Prefer: tx=rollback` to execute a mutation and see the result without persisting the changes. Perfect for validation and testing.

**Incorrect (mutating data to test):**

```bash
# Test mutation by actually doing it (risky!)
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": 99.99}'
# Actually creates the record - must delete after

# Or using a separate test database
```

**Correct (rollback transaction):**

```bash
# Mutation is executed but rolled back
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: tx=rollback, return=representation" \
  -d '{"name": "Test Product", "price": 99.99}'
# Returns: [{"id": 123, "name": "Test Product", "price": 99.99}]
# But the row is NOT actually created!

# Test update
curl "http://localhost:3000/products?id=eq.1" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: tx=rollback, return=representation" \
  -d '{"price": 149.99}'
# Shows what would happen, but doesn't persist

# Test delete
curl "http://localhost:3000/products?category=eq.discontinued" \
  -X DELETE \
  -H "Prefer: tx=rollback, return=representation"
# Shows what would be deleted, nothing actually deleted
```

**supabase-js (requires direct fetch):**

```typescript
// supabase-js doesn't directly support tx=rollback
// Use fetch for dry-run testing
const response = await fetch(
  `${supabaseUrl}/rest/v1/products`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'tx=rollback, return=representation'
    },
    body: JSON.stringify({ name: 'Test', price: 99.99 })
  }
)
const data = await response.json()
// See the result without persisting
```

**Use cases:**

```bash
# Check if insert would succeed
curl "http://localhost:3000/users" \
  -X POST \
  -H "Prefer: tx=rollback, return=representation" \
  -d '{"email": "test@example.com", "name": "Test"}'
# Validates constraints, triggers, etc.
# How many rows would be deleted?
curl "http://localhost:3000/old_logs?created_at=lt.2023-01-01" \
  -X DELETE \
  -H "Prefer: tx=rollback, return=representation, count=exact"
# Content-Range: */5000 - would delete 5000 rows
# Preview bulk update
curl "http://localhost:3000/products?category=eq.electronics" \
  -X PATCH \
  -H "Prefer: tx=rollback, return=representation" \
  -d '{"discount": 0.10}'
# See all affected rows without applying discount
```

2. **Preview delete impact:**
3. **Test complex updates:**

Reference: https://postgrest.org/en/stable/references/api/preferences.html#transaction-end

---

### 7.6 Use Column Defaults for Missing Values

**Impact: MEDIUM (Apply database DEFAULT values instead of NULL for omitted columns)**

Use `Prefer: missing=default` to apply column DEFAULT values for fields not included in the request body, instead of inserting NULL.

**Incorrect (missing columns become NULL):**

```bash
# Without preference, missing columns are NULL
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"title": "My Post"}'
# status=NULL, created_at=NULL (if no DB default trigger)
```

**Correct (use column defaults):**

```bash
# Missing columns use DEFAULT from schema
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: missing=default, return=representation" \
  -d '{"title": "My Post"}'
# Returns: {"id": 1, "title": "My Post", "status": "draft", "created_at": "2024-01-15T..."}
# status got DEFAULT 'draft', created_at got DEFAULT now()

# Bulk insert with defaults
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: missing=default, return=representation" \
  -d '[{"title": "Post 1"}, {"title": "Post 2"}]'
```

**supabase-js:**

```typescript
// supabase-js uses missing=default by default for insert
const { data } = await supabase
  .from('posts')
  .insert({ title: 'My Post' })
  .select()

// Columns with DEFAULT in schema will use those values
// data: [{ id: 1, title: 'My Post', status: 'draft', created_at: '...' }]
```

**Schema with defaults:**

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Partial updates (PATCH):**

```bash
# missing=default doesn't apply to PATCH by default
# Only provided columns are updated
curl "http://localhost:3000/posts?id=eq.1" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
# Only title changes, other columns unchanged
```

Reference: https://postgrest.org/en/stable/references/api/preferences.html#missing

---

## 8. Authentication

**Impact: MEDIUM**

JWT authentication, role-based access, RLS integration, and security patterns. Securing your API.

### 8.1 Access JWT Claims in SQL for Custom Logic

**Impact: MEDIUM (Use JWT data in RLS policies and functions)**

Access JWT claims in PostgreSQL using `current_setting()` or Supabase's `auth.jwt()` helper. Use claims in RLS policies, functions, and triggers.

**Incorrect (hardcoding or passing user info):**

```bash
# Don't pass user info in request - can be faked
curl "http://localhost:3000/posts" \
  -X POST \
  -d '{"title": "Post", "user_id": 123}'  # User could fake this!
```

**Correct (extract from JWT in SQL):**

```sql
-- PostgREST sets JWT claims as settings
-- Access full claims JSON
SELECT current_setting('request.jwt.claims', true)::json;

-- Access specific claim
SELECT current_setting('request.jwt.claims', true)::json->>'sub';
SELECT current_setting('request.jwt.claims', true)::json->>'email';
SELECT current_setting('request.jwt.claims', true)::json->>'role';

-- Supabase helper functions (recommended)
SELECT auth.uid();       -- User ID (sub claim)
SELECT auth.role();      -- Current role
SELECT auth.jwt();       -- Full JWT as JSONB
SELECT auth.email();     -- User email
```

**RLS policies using claims:**

```sql
-- User can only see own data
CREATE POLICY "Own data" ON profiles
  FOR ALL
  USING (user_id = auth.uid());

-- Access based on custom claim
CREATE POLICY "Organization members" ON org_data
  FOR SELECT
  USING (
    org_id = (auth.jwt()->>'org_id')::uuid
  );

-- Premium users only
CREATE POLICY "Premium content" ON premium_articles
  FOR SELECT
  USING (
    (auth.jwt()->'app_metadata'->>'subscription')::text = 'premium'
  );

-- Role-based access
CREATE POLICY "Admin only" ON admin_settings
  FOR ALL
  USING (auth.role() = 'admin');
```

**Auto-populate user_id on insert:**

```bash
-- Trigger to set user_id from JWT
CREATE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER posts_set_user_id
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();
# Now user_id is auto-set from JWT
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Authorization: Bearer user-jwt" \
  -d '{"title": "My Post"}'  # user_id set automatically
```

**Using claims in functions:**

```sql
CREATE FUNCTION get_my_posts()
RETURNS SETOF posts AS $$
  SELECT * FROM posts WHERE user_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt()->'app_metadata'->>'org_role')::text = 'admin';
$$ LANGUAGE SQL STABLE;
```

Reference: https://supabase.com/docs/guides/auth/row-level-security#helper-functions

---

### 8.2 Authenticate Requests with Bearer JWT

**Impact: MEDIUM (Secure API access with JSON Web Tokens)**

Pass a JWT in the `Authorization` header as a Bearer token to authenticate requests. PostgREST validates the token and extracts the role for authorization.

**Incorrect (no authentication):**

```bash
# Anonymous request - limited access
curl "http://localhost:3000/users"
# Uses anonymous role - may be restricted by RLS

# API key without JWT
curl "http://localhost:3000/users" \
  -H "apikey: your-api-key"
# Still anonymous unless JWT provided
```

**Correct (Bearer token authentication):**

```bash
# Authenticated request with JWT
curl "http://localhost:3000/users" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# With Supabase - both apikey and JWT
curl "https://project.supabase.co/rest/v1/users" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer user-jwt-token"

# For mutations
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{"title": "My Post"}'
```

**supabase-js:**

```typescript
// supabase-js handles auth automatically after sign in
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
// JWT is automatically included in subsequent requests

// Authenticated query
const { data } = await supabase
  .from('posts')
  .select('*')
// Authorization header sent automatically

// Manual token (for server-side or custom auth)
const supabaseWithAuth = createClient(url, anonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${customJwt}`
    }
  }
})
```

**JWT structure:**

```javascript
// JWT payload (decoded)
{
  "sub": "user-uuid-here",
  "role": "authenticated",  // Role used for DB permissions
  "email": "user@example.com",
  "iat": 1704067200,
  "exp": 1704153600,
  // Custom claims
  "user_metadata": { "name": "John" }
}
```

Reference: https://postgrest.org/en/stable/references/auth.html

---

### 8.3 Combine PostgREST with Row-Level Security

**Impact: HIGH (Enforce data access rules at database level for true security)**

Use PostgreSQL Row-Level Security (RLS) with PostgREST for fine-grained access control. RLS policies run at the database level, ensuring security even if API is bypassed.

**Incorrect (application-level filtering only):**

```bash
# Filtering in query - can be bypassed!
curl "http://localhost:3000/posts?user_id=eq.123"
# User could request another user's posts

# No RLS means any authenticated user can see anything
```

**Correct (RLS policies enforce access):**

```bash
-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own posts
CREATE POLICY "Users see own posts" ON posts
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only insert their own posts
CREATE POLICY "Users insert own posts" ON posts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own posts
CREATE POLICY "Users update own posts" ON posts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own posts
CREATE POLICY "Users delete own posts" ON posts
  FOR DELETE
  USING (user_id = auth.uid());
# Now this query is automatically filtered by RLS
curl "http://localhost:3000/posts" \
  -H "Authorization: Bearer user-jwt"
# Only returns posts belonging to authenticated user
```

**supabase-js:**

```typescript
// RLS automatically applies
const { data: posts } = await supabase
  .from('posts')
  .select('*')
// Only returns current user's posts (RLS enforced)

// Trying to access others' data fails silently (returns empty)
// or errors if policy denies
```

**Supabase auth helper functions:**

```sql
-- Note: auth.uid(), auth.jwt(), auth.role() are SUPABASE-SPECIFIC helpers.
-- For pure PostgREST, use current_setting() instead:

-- Supabase: auth.uid()
-- PostgREST: current_setting('request.jwt.claim.sub', true)::uuid
CREATE POLICY "Own data" ON profiles
  FOR ALL
  USING (id = auth.uid());  -- Supabase

-- Supabase: auth.jwt()
-- PostgREST: current_setting('request.jwt.claims', true)::json
CREATE POLICY "Premium only" ON premium_content
  FOR SELECT
  USING ((auth.jwt()->>'user_metadata')::jsonb->>'plan' = 'premium');

-- Supabase: auth.role()
-- PostgREST: current_setting('request.jwt.claim.role', true)
CREATE POLICY "Admin only" ON admin_logs
  FOR SELECT
  USING (auth.role() = 'admin');
```

**Public vs private data:**

```sql
-- Public data: visible to all (including anon)
CREATE POLICY "Public posts" ON posts
  FOR SELECT
  USING (is_public = true);

-- Private data: owner only
CREATE POLICY "Private posts" ON posts
  FOR SELECT
  USING (is_public = false AND user_id = auth.uid());

-- Combined in one policy
CREATE POLICY "View posts" ON posts
  FOR SELECT
  USING (is_public = true OR user_id = auth.uid());
```

Reference: https://supabase.com/docs/guides/auth/row-level-security

---

### 8.4 Configure Anonymous Access Appropriately

**Impact: MEDIUM (Control what unauthenticated users can access)**

The anonymous role handles unauthenticated requests. Configure its permissions carefully - grant only what public users need.

**Incorrect (overly permissive anon):**

```sql
-- DON'T: Anon can access everything
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- Security risk! Public can read/write all data
```

**Correct (minimal anon permissions):**

```bash
-- Only grant what anonymous users need
-- Read-only access to public content
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON public_posts TO anon;

-- No access to sensitive tables
-- (no GRANT = no access)

-- Maybe allow creating accounts
GRANT INSERT ON signups TO anon;
# Anonymous request (no JWT)
curl "http://localhost:3000/products"
# Works - anon has SELECT on products

curl "http://localhost:3000/users"
# 401 or empty - anon has no access to users

curl "http://localhost:3000/products" -X POST -d '{"name": "Test"}'
# Error - anon has no INSERT on products
```

**supabase-js:**

```typescript
// Without auth, uses anon role
const { data: publicProducts } = await supabase
  .from('products')
  .select('*')
// Works if anon has SELECT

// After sign in, uses authenticated role
await supabase.auth.signInWithPassword({ email, password })
const { data: allData } = await supabase
  .from('users')
  .select('*')
// Works if authenticated has SELECT
```

**RLS with anonymous:**

```sql
-- Public products visible to everyone (including anon)
CREATE POLICY "Public products" ON products
  FOR SELECT
  USING (is_public = true);

-- Private products need authentication
CREATE POLICY "Private products" ON products
  FOR SELECT
  USING (is_public = false AND auth.role() = 'authenticated');
```

**Common anon patterns:**

```sql
-- Public read, authenticated write
GRANT SELECT ON posts TO anon;
GRANT SELECT ON posts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON posts TO authenticated;

-- Rate-limited signup
GRANT INSERT ON newsletter_signups TO anon;
-- (Rate limiting via RLS or API gateway)

-- Public API for read-only data
GRANT SELECT ON api_docs TO anon;
GRANT SELECT ON public_stats TO anon;
```

**Disable anonymous access entirely:**

```sql
-- Revoke all from anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
-- All requests now require JWT
```

Reference: https://postgrest.org/en/stable/references/auth.html#anonymous-role

---

### 8.5 Configure JWT Role Claim for Authorization

**Impact: MEDIUM (Map JWT claims to PostgreSQL roles for permission control)**

PostgREST extracts a role from the JWT to determine database permissions. The role claim determines which PostgreSQL role executes the query.

**Incorrect (missing role in JWT):**

```javascript
// JWT without role claim
const jwt = {
  "sub": "user-123",
  "email": "user@example.com"
  // No role - uses anonymous or default
}
```

**Correct (include role claim):**

```javascript
// JWT with role claim (Supabase default)
const jwt = {
  "sub": "user-123",
  "role": "authenticated",  // PostgreSQL role to use
  "email": "user@example.com",
  "iat": 1704067200,
  "exp": 1704153600
}

// Custom role for different permission levels
const adminJwt = {
  "sub": "admin-123",
  "role": "admin",  // Admin role with elevated permissions
  "email": "admin@example.com"
}
```

**Supabase roles:**

```typescript
// Supabase has two built-in roles
// 1. anon - for unauthenticated requests
// 2. authenticated - for signed-in users

// After sign in, JWT has role: "authenticated"
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
// session.access_token contains role: "authenticated"
```

**PostgreSQL role permissions:**

```sql
-- Grant permissions to the authenticated role
GRANT SELECT ON users TO authenticated;
GRANT INSERT, UPDATE ON posts TO authenticated;

-- Restrict anonymous
GRANT SELECT ON public_content TO anon;
-- No INSERT/UPDATE/DELETE for anon

-- Admin role with full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
```

**Custom role claim path:**

```bash
# PostgREST can read role from nested claim
# Configuration: jwt-role-claim-key = '.app_metadata.role'

# JWT structure
{
  "sub": "user-123",
  "app_metadata": {
    "role": "premium_user"
  }
}
```

**Checking current role in SQL:**

```sql
-- In RLS policy or function
SELECT current_user;  -- Returns the role from JWT
SELECT current_setting('request.jwt.claims', true);  -- Full JWT claims
```

Reference: https://postgrest.org/en/stable/references/auth.html#roles

---

## 9. Performance

**Impact: LOW-MEDIUM**

Indexing strategies, query plan debugging, computed columns, and views for complex queries. Optimizing PostgREST performance.

### 9.1 Create Expression Indexes for JSONB Paths

**Impact: LOW-MEDIUM (Index specific JSON paths used in filters)**

Create expression indexes on JSONB paths that are frequently filtered. Generic GIN indexes help containment queries, but expression indexes help equality filters.

**Incorrect (filtering on unindexed JSON paths):**

```bash
# Filtering on JSON field without expression index - slow
curl "http://localhost:3000/products?metadata->>color=eq.red"
# Full table scan, extracts color from every row
```

**Correct (expression index on JSON path):**

```bash
-- Expression index for specific JSON path
CREATE INDEX products_color_idx ON products ((metadata->>'color'));

-- For nested paths
CREATE INDEX products_width_idx ON products ((metadata->'dimensions'->>'width'));

-- For numeric JSON values (cast in index)
CREATE INDEX products_weight_idx ON products (((metadata->>'weight')::numeric));
# Now these queries use indexes
curl "http://localhost:3000/products?metadata->>color=eq.red"
# Index scan on products_color_idx
```

**GIN index for containment queries:**

```bash
-- GIN index for @> containment operator (cs)
CREATE INDEX products_metadata_gin_idx ON products USING GIN (metadata);
# Containment queries use GIN index
curl 'http://localhost:3000/products?metadata=cs.{"color":"red"}'
# GIN index scan
```

**Multiple JSON paths:**

```sql
-- If filtering on multiple paths together
-- curl ".../products?metadata->>brand=eq.Apple&metadata->>color=eq.silver"
CREATE INDEX products_brand_color_idx ON products (
  (metadata->>'brand'),
  (metadata->>'color')
);

-- Or separate indexes if filtered independently
CREATE INDEX products_brand_idx ON products ((metadata->>'brand'));
CREATE INDEX products_color_idx ON products ((metadata->>'color'));
```

**Index on nested path:**

```bash
-- For deeply nested: metadata.specs.display.size
CREATE INDEX products_display_size_idx ON products (
  (metadata->'specs'->'display'->>'size')
);
curl "http://localhost:3000/products?metadata->specs->display->>size=eq.15"
# Uses expression index
```

**Partial indexes for common values:**

```sql
-- Index only active products
CREATE INDEX products_active_color_idx ON products ((metadata->>'color'))
  WHERE status = 'active';
```

Reference: https://www.postgresql.org/docs/current/indexes-expressional.html

---

### 9.2 Debug Queries with EXPLAIN Plan Header

**Impact: LOW-MEDIUM (See PostgreSQL query plan to diagnose slow queries)**

Use the `Accept: application/vnd.pgrst.plan` header to see the PostgreSQL EXPLAIN output for any query. Essential for debugging slow queries.

**Incorrect (guessing why query is slow):**

```bash
# Slow query, don't know why
curl "http://localhost:3000/orders?status=eq.pending&select=*,customer:customers(*)"
# Takes 5 seconds... but why?
```

**Correct (get explain plan):**

```bash
# Get execution plan as JSON
curl "http://localhost:3000/orders?status=eq.pending&select=*,customer:customers(*)" \
  -H "Accept: application/vnd.pgrst.plan+json"

# Get as text (easier to read)
curl "http://localhost:3000/orders?status=eq.pending&select=*,customer:customers(*)" \
  -H "Accept: application/vnd.pgrst.plan+text"
```

**Example output:**

```sql
Nested Loop Left Join  (cost=0.29..16.34 rows=1 width=136)
  ->  Index Scan using orders_status_idx on orders  (cost=0.15..8.17 rows=1 width=68)
        Index Cond: (status = 'pending'::text)
  ->  Index Scan using customers_pkey on customers  (cost=0.14..8.16 rows=1 width=68)
        Index Cond: (id = orders.customer_id)
```

**Common issues and solutions:**

```bash
# Issue: Seq Scan on large table
# "Seq Scan on orders (cost=0.00..15000.00 rows=100000)"
# Solution: Add index
CREATE INDEX orders_status_idx ON orders (status);

# Issue: Sort on large result
# "Sort (cost=50000.00..55000.00 rows=100000)"
# Solution: Add index for ORDER BY column
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);

# Issue: Slow join
# "Nested Loop (cost=0.00..999999.00)"
# Solution: Index the foreign key
CREATE INDEX orders_customer_id_idx ON orders (customer_id);
```

**Plan options:**

```bash
# Analyze - includes actual timing (slower, runs query)
curl "http://localhost:3000/orders?status=eq.pending" \
  -H "Accept: application/vnd.pgrst.plan+json; options=analyze"

# Verbose - more details
curl "http://localhost:3000/orders?status=eq.pending" \
  -H "Accept: application/vnd.pgrst.plan+json; options=verbose"

# Both
curl "http://localhost:3000/orders?status=eq.pending" \
  -H "Accept: application/vnd.pgrst.plan+json; options=analyze|verbose"
```

**Note:** Requires proper configuration to allow plan output. In Supabase, this is available in the dashboard or via direct database access.

Reference: https://www.postgresql.org/docs/current/using-explain.html

---

### 9.3 Index Columns Used in PostgREST Filters

**Impact: LOW-MEDIUM (Speed up filtered queries with proper indexes)**

Create indexes on columns frequently used in PostgREST filters. Without indexes, filters cause full table scans.

**Incorrect (no indexes on filtered columns):**

```bash
# Query filters on unindexed column - full table scan
curl "http://localhost:3000/orders?status=eq.pending"
# Scans entire orders table to find pending ones

curl "http://localhost:3000/users?email=eq.john@example.com"
# Sequential scan on large users table
```

**Correct (create indexes on filtered columns):**

```bash
-- Index on frequently filtered columns
CREATE INDEX orders_status_idx ON orders (status);
CREATE INDEX users_email_idx ON users (email);

-- For range queries, B-tree index (default)
CREATE INDEX orders_created_at_idx ON orders (created_at);

-- For array containment queries, GIN index
CREATE INDEX posts_tags_idx ON posts USING GIN (tags);

-- For JSONB containment
CREATE INDEX products_metadata_idx ON products USING GIN (metadata);
# Now these queries use indexes
curl "http://localhost:3000/orders?status=eq.pending"
# Index scan - fast!

curl "http://localhost:3000/posts?tags=cs.{featured}"
# GIN index scan
```

**Compound indexes for combined filters:**

```sql
-- For queries that filter on multiple columns together
-- curl ".../orders?status=eq.pending&customer_id=eq.123"
CREATE INDEX orders_customer_status_idx ON orders (customer_id, status);

-- Column order matters - leftmost columns used first
-- Good for: customer_id=eq.X or customer_id=eq.X AND status=eq.Y
-- Not good for: status=eq.Y alone
```

**Check if index is used:**

```bash
# Use the explain plan header
curl "http://localhost:3000/orders?status=eq.pending" \
  -H "Accept: application/vnd.pgrst.plan+json"
# Shows EXPLAIN output - look for "Index Scan"
```

Reference: https://www.postgresql.org/docs/current/indexes.html

---

### 9.4 Index Foreign Keys for Faster Embedding

**Impact: LOW-MEDIUM (Speed up resource embedding with FK indexes)**

Create indexes on foreign key columns to speed up resource embedding. PostgREST performs JOINs for embeddings, and FK indexes make these fast.

**Incorrect (unindexed foreign keys):**

```bash
-- FK without index - embedding is slow
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id),  -- No index!
  title TEXT
);
# Embedding causes slow join
curl "http://localhost:3000/users?select=*,posts(*)"
# For each user, scans entire posts table to find matches
```

**Correct (index foreign keys):**

```bash
-- Always index foreign key columns
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id),
  title TEXT
);
CREATE INDEX posts_author_id_idx ON posts (author_id);

-- For existing tables
CREATE INDEX posts_author_id_idx ON posts (author_id);
CREATE INDEX orders_customer_id_idx ON orders (customer_id);
CREATE INDEX comments_post_id_idx ON comments (post_id);
# Now embedding is fast
curl "http://localhost:3000/users?select=*,posts(*)"
# Index scan on posts.author_id

curl "http://localhost:3000/posts?select=*,comments(*)"
# Index scan on comments.post_id
```

**supabase-js:**

```typescript
// These queries benefit from FK indexes
const { data } = await supabase
  .from('users')
  .select('*, posts(*)')
// Fast with posts_author_id_idx

const { data } = await supabase
  .from('orders')
  .select('*, items:order_items(*)')
// Fast with order_items_order_id_idx
```

**Junction tables (M2M):**

```sql
-- Index both FKs in junction tables
CREATE TABLE films_actors (
  film_id INTEGER REFERENCES films(id),
  actor_id INTEGER REFERENCES actors(id),
  PRIMARY KEY (film_id, actor_id)  -- This creates index on (film_id, actor_id)
);
-- Add index for queries starting from actors
CREATE INDEX films_actors_actor_id_idx ON films_actors (actor_id);
```

**Compound indexes for common embeddings:**

```sql
-- If you often filter embedded resources
-- curl ".../posts?select=*,comments(*)&comments.status=eq.approved"
CREATE INDEX comments_post_status_idx ON comments (post_id, status);
```

**Check embedding performance:**

```bash
# Look at join methods in explain plan
curl "http://localhost:3000/users?select=*,posts(*)&id=eq.123" \
  -H "Accept: application/vnd.pgrst.plan+json"
# Should see "Index Scan" or "Nested Loop" with indexes
```

Reference: https://www.postgresql.org/docs/current/indexes.html

---

### 9.5 Use Views for Complex Queries

**Impact: LOW-MEDIUM (Encapsulate complex logic that exceeds PostgREST's query grammar)**

Create PostgreSQL views to expose complex queries that go beyond PostgREST's URL-based query capabilities. Views appear as tables and support all PostgREST features.

**Incorrect (complex client-side data assembly):**

```javascript
// Multiple requests + client-side processing
const orders = await fetch('/orders?status=eq.completed')
const items = await fetch('/order_items?order_id=in.(1,2,3)')
const products = await fetch('/products?id=in.(10,20,30)')

// Client combines and calculates totals
const result = orders.map(o => ({
  ...o,
  items: items.filter(i => i.order_id === o.id),
  total: items.filter(i => i.order_id === o.id).reduce(...)
}))
```

**Correct (create a view):**

```bash
-- View with aggregations and joins
CREATE VIEW order_summaries AS
SELECT
  o.id,
  o.created_at,
  o.status,
  c.name as customer_name,
  c.email as customer_email,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity * oi.price) as total,
  array_agg(p.name) as product_names
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
GROUP BY o.id, o.created_at, o.status, c.name, c.email;

-- Grant access
GRANT SELECT ON order_summaries TO authenticated;
# Query the view like a table
curl "http://localhost:3000/order_summaries?status=eq.completed&order=created_at.desc"
# Returns pre-aggregated data
```

**supabase-js:**

```typescript
// Query view like any table
const { data } = await supabase
  .from('order_summaries')
  .select('*')
  .eq('status', 'completed')
  .order('created_at', { ascending: false });
```

**Use cases for views:**

```sql
CREATE VIEW product_stats AS
SELECT
  p.id,
  p.name,
  COUNT(r.id) as review_count,
  AVG(r.rating)::numeric(3,2) as avg_rating
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id, p.name;
CREATE VIEW user_activity AS
SELECT
  u.id,
  u.name,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT c.id) as comment_count,
  MAX(p.created_at) as last_post
FROM users u
LEFT JOIN posts p ON p.author_id = u.id
LEFT JOIN comments c ON c.author_id = u.id
GROUP BY u.id, u.name;
CREATE VIEW public_posts AS
SELECT id, title, content, author_id
FROM posts
WHERE is_published = true AND deleted_at IS NULL;
```

2. **Complex joins:**
3. **Security filtering:**

**Updatable views:**

```sql
-- Simple views can be updated through
CREATE VIEW active_users AS
SELECT * FROM users WHERE status = 'active';

-- INSERT/UPDATE/DELETE work if view is simple enough
curl "http://localhost:3000/active_users" -X PATCH -d '{"name": "New"}'
```

**With RLS:**

```sql
-- IMPORTANT: By default, views run with OWNER privileges (security definer).
-- RLS on underlying tables will NOT apply unless you use security_invoker.
-- PostgreSQL 15+ supports security_invoker = true:
CREATE VIEW my_orders WITH (security_invoker = true) AS
SELECT * FROM orders;
-- Now RLS policies on 'orders' table will apply to view queries
```

Reference: https://www.postgresql.org/docs/current/sql-createview.html

---

## References

- https://postgrest.org/en/stable/
- https://supabase.com/docs/guides/api
- https://supabase.com/docs/reference/javascript/select
- https://supabase.com/docs/guides/database/joins-and-nesting
