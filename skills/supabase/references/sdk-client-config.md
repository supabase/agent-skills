---
title: Client Configuration Options
impact: MEDIUM-HIGH
impactDescription: Enables custom auth storage, fetch behavior, and schema selection
tags: configuration, auth, fetch, storage, schema, react-native
---

## Client Configuration Options

Pass options to `createClient` for custom behavior.

**Incorrect:**

```typescript
// Missing configuration - session won't persist in React Native
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)
// AsyncStorage not configured, detectSessionInUrl causes issues
```

**Correct:**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  db: {
    schema: 'public',  // Default schema for queries
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-app-version': '1.0.0' },
    fetch: customFetch,
  },
})
```

## Auth Options

| Option | Default | Description |
|--------|---------|-------------|
| `autoRefreshToken` | `true` | Refresh token before expiry |
| `persistSession` | `true` | Store session in storage |
| `detectSessionInUrl` | `true` | Handle OAuth redirect URLs |
| `storage` | `localStorage` | Custom storage adapter |
| `storageKey` | `sb-<ref>-auth-token` | Storage key name |

## Custom Fetch

Wrap fetch for logging, retries, or custom headers:

```typescript
const supabase = createClient(url, key, {
  global: {
    fetch: (...args) => {
      console.log('Supabase request:', args[0])
      return fetch(...args)
    }
  }
})
```

## React Native Setup

React Native requires AsyncStorage and `detectSessionInUrl: false`:

```typescript
import 'react-native-url-polyfill/auto'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // Important for React Native
  },
})

// Manage token refresh based on app state
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
```

## Multiple Schemas

Query different schemas:

```typescript
// Default schema in config
const supabase = createClient(url, key, {
  db: { schema: 'api' }
})

// Or use schema() method per-query
const { data } = await supabase.schema('private').from('secrets').select()
```

## Related

- [client-browser.md](client-browser.md)
- [error-handling.md](error-handling.md)
