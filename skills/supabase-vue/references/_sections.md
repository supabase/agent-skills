# Section Definitions

Reference files are grouped by their filename prefix.

## 1. Client Setup (client)

**Impact:** HIGH
**Description:** Initialize one browser client safely and choose the existing integration deliberately.

## 2. Database Types (type)

**Impact:** HIGH
**Description:** Generate and maintain schema-derived types and use inferred query shapes.

## 3. Errors and State (error)

**Impact:** CRITICAL
**Description:** Represent request outcomes correctly and preserve errors through Vue UI state.

## 4. Authentication (auth)

**Impact:** CRITICAL
**Description:** Integrate Supabase Auth and manage sessions/listener lifetimes without treating UI state as authorization.

## 5. Composables (composable)

**Impact:** HIGH
**Description:** Encapsulate typed Supabase operations in Vue 3 Composition API functions.

## 6. Realtime (realtime)

**Impact:** HIGH
**Description:** Manage channels, subscription status, reactive inputs, and cleanup.

## 7. Storage (storage)

**Impact:** HIGH
**Description:** Validate browser uploads and use bucket policies and URLs according to visibility.

## 8. Security and RLS (security)

**Impact:** CRITICAL
**Description:** Keep browser authorization at PostgreSQL/Storage policy boundaries and avoid frontend-only checks.

## 9. Testing (test)

**Impact:** MEDIUM
**Description:** Test composables, Auth, failures, cleanup, and policy behavior with isolated unit and integration tests.
