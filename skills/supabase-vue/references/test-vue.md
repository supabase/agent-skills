---
title: Test Vue Supabase Paths Without a Hosted Dependency
impact: MEDIUM
impactDescription: Catches regressions in query outcomes, Auth UI, and lifecycle cleanup while keeping unit tests repeatable
tags: testing, vitest, vue-test-utils, composables, rls
---

## Separate deterministic UI tests from Supabase integration tests

Use Vitest and Vue Test Utils for component/composable behavior. Mock the Supabase client at the module boundary or inject a narrow typed dependency when that matches the existing app. Keep mocks faithful to the `{ data, error }` response shape and test both success and failure branches.

Cover at least:

- successful non-empty and empty query results;
- returned Supabase errors and thrown/rejected requests;
- loading reset and visible error state after failed queries/mutations;
- Auth initial state, sign-in/sign-out changes, and listener unsubscribe;
- Realtime status errors and channel removal on unmount/parameter change;
- Storage validation rejection and upload failure without success UI.

Use Vue Test Utils’ mounted component lifecycle when composables rely on `onMounted`, `watch`, or disposal hooks. Do not call lifecycle-dependent composables as arbitrary standalone functions outside setup/effect scope. Prefer behavior assertions over testing implementation details.

```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfileList from '@/components/ProfileList.vue'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

describe('ProfileList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders an empty state for a successful empty response', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue({
      select: () => ({ order }),
    } as never)

    const wrapper = mount(ProfileList)
    expect(await wrapper.text()).toContain('No profiles')
  })
})
```

Keep casts limited to building mock objects where a full Supabase client is intentionally stubbed; do not use casts in production query code to suppress generated type errors. Adapt mocks to the project’s actual fluent query chain.

Use local Supabase integration tests for critical auth/database flows and RLS policies. Seed separate users/roles and assert allowed as well as denied operations; UI mocks cannot prove RLS. Avoid making ordinary unit tests depend on an external hosted project or committed credentials. If real network tests are necessary, mark/configure them separately and use a disposable project or local stack.

Run the app’s SFC-aware type checker (`vue-tsc --noEmit` or the configured script) in addition to Vitest; Vite’s normal transpile/build is not a TypeScript check.

References: [Vue testing](https://vuejs.org/guide/scaling-up/testing.html), [Vue Test Utils](https://test-utils.vuejs.org/), [Vitest](https://vitest.dev/), [testing RLS](https://supabase.com/docs/guides/database/postgres/row-level-security#policy-tests).
