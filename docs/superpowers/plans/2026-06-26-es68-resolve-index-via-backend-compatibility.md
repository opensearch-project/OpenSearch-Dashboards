# ES 6.8 Resolve-Index via Backend Compatibility — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Index Pattern Management "resolve index" flow work for Elasticsearch 6.8 data sources by routing the call through the modern OpenSearch client so the `backend_compatibility` plugin's `CompatibilityTransport` can synthesize `/_resolve/index` from `/_cat` APIs.

**Architecture:** Three coordinated changes. (1) Core publishes its registered custom `Transport` class via a new **public** `getClientTransport()` on `OpenSearchServiceStart` (today it lives only on the `@internal` start contract). (2) The `data_source` plugin reads that transport at `start()` and threads it into its **modern** client pool, so data-source clients gain the same compatibility interception that core's client already has. (3) The `resolve_index` route switches from the **legacy** data-source client (which cannot carry a `Transport`) to the **modern** one (`context.dataSource.opensearch.getClient`).

**Tech Stack:** TypeScript, OpenSearch Dashboards plugin platform, `@opensearch-project/opensearch` client, Jest, api-extractor (`yarn docs:acceptApiChanges`).

---

## Background / Root Cause (read first)

The page calls `GET /internal/index-pattern-management/resolve_index/*?data_source=<id>`. The route (`src/plugins/index_pattern_management/server/routes/resolve_index.ts`) issues `GET /_resolve/index/*` against the data source. `/_resolve/index` was introduced in **Elasticsearch 7.9**; ES 6.8 has no such API and parses `_resolve` as a literal index name → `invalid_index_name_exception` (HTTP 400). 7.x–10.x and OpenSearch all have the API, so only 6.8 breaks.

The `backend_compatibility` plugin already contains the fix — `CompatibilityTransport.handleResolveIndex()` (`src/plugins/backend_compatibility/server/transport/compatibility_transport.ts:275-314`) synthesizes a `_resolve/index` response from `/_cat/indices` + `/_cat/aliases` for ES 6.x. But that transport **cannot run for this route** for two structural reasons:

1. `CompatibilityTransport` is registered only on **core's** opensearch client (`core.opensearch.registerClientTransport`, `backend_compatibility/server/plugin.ts:32`). The `data_source` plugin runs its own client pool (`configure_client.ts`) built with bare `new Client(clientOptions)` — it never receives the transport.
2. The route uses the **legacy** data-source client (`context.dataSource.opensearch.legacy.getClient`, `resolve_index.ts:64`). `CompatibilityTransport extends Transport` from `@opensearch-project/opensearch` (the modern client) and structurally cannot intercept legacy `elasticsearch`-client calls.

**Key constraints discovered during investigation:**
- Core exposes the transport **setter** (`registerClientTransport`) publicly but the **getter** (`getClientTransport`) only on `@internal InternalOpenSearchServiceStart` (`src/core/server/opensearch/types.ts:216-223`). Approach A (chosen) promotes the getter to public.
- This whole fix is gated behind `backendCompatibility.enabled` (default **false**, experimental). With the flag **off**, no transport is registered, `getClientTransport()` returns `undefined`, the data-source client is built exactly as today, and the route behaves exactly as today (6.8 still errors). **Flag off = zero behavior change.** This is intended.
- `.child()` does not re-specify `Transport`; a child client inherits the root's transport. The root client is created in `getQueryClient` inside `configure_client.ts` (`new Client(clientOptions)`), so the `Transport` option must be set there.
- Plugin lifecycle: all `setup()` phases finish before any HTTP request. `backend_compatibility.setup()` registers the transport; `data_source` reads it via `core.getStartServices()` / `start()`. Data-source clients are built lazily at request time, so the transport is always available by then. **data_source reads from Core, not from backend_compatibility — no new plugin dependency edge is required.**

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/core/server/opensearch/types.ts` | OpenSearch service contracts | Move `getClientTransport` from `InternalOpenSearchServiceStart` to public `OpenSearchServiceStart` |
| `src/core/server/server.api.md` | api-extractor snapshot | Regenerated via `yarn docs:acceptApiChanges` |
| `src/plugins/data_source/server/types.ts` | DS client param types | Add `customTransport?` to `DataSourceClientParams` |
| `src/plugins/data_source/server/client/configure_client.ts` | Builds modern DS client | Thread `customTransport` into `new Client({...})` |
| `src/plugins/data_source/server/data_source_service.ts` | DS client factory/service | Accept + forward a `customTransport` getter |
| `src/plugins/data_source/server/plugin.ts` | DS plugin lifecycle | Read `coreStart.opensearch.getClientTransport()` and supply it to the service |
| `src/plugins/index_pattern_management/server/routes/resolve_index.ts` | Resolve-index route | Switch legacy client → modern `getClient(id).transport.request` |
| `src/plugins/index_pattern_management/server/routes/resolve_index.test.ts` | Route test | New file |

---

## Task 1: Promote `getClientTransport` to the public Core start contract

**Files:**
- Modify: `src/core/server/opensearch/types.ts`
- Modify (generated): `src/core/server/server.api.md`

- [ ] **Step 1: Read the current contract**

Open `src/core/server/opensearch/types.ts`. Confirm:
- `OpenSearchServiceStart` (public) ends around line 211 with `legacy: { ... }`.
- `InternalOpenSearchServiceStart` (line ~216) currently declares `getClientTransport?: () => typeof Transport | undefined;`.
- `Transport` is already imported at the top of the file (it is used by `registerClientTransport`).

- [ ] **Step 2: Add `getClientTransport` to the public `OpenSearchServiceStart`**

In `src/core/server/opensearch/types.ts`, inside `export interface OpenSearchServiceStart {`, immediately after the `legacy: { ... };` block's closing `};` and before the interface's closing `}`, add:

```ts
  /**
   * Returns the custom Transport class registered via
   * {@link OpenSearchServiceSetup.registerClientTransport}, if any.
   * Plugins that create their own OpenSearch clients (e.g. the data source plugin's
   * per-connection client pool) can apply the same Transport extension so that
   * request/response interception (such as legacy backend compatibility) is consistent
   * with core's own client. Returns `undefined` when no Transport has been registered.
   */
  getClientTransport?: () => typeof Transport | undefined;
```

- [ ] **Step 3: Remove the duplicate from `InternalOpenSearchServiceStart`**

`InternalOpenSearchServiceStart extends OpenSearchServiceStart`, so the member is now inherited. Delete the `getClientTransport?: ...` declaration (and its doc comment) from the `InternalOpenSearchServiceStart` interface body. If that leaves the interface with no other members, keep it as `export interface InternalOpenSearchServiceStart extends OpenSearchServiceStart {}` with an `// eslint-disable-next-line @typescript-eslint/no-empty-interface` line above it.

Note: the implementation in `src/core/server/opensearch/opensearch_service.ts:171` (`getClientTransport: () => this.customTransportClass`) already returns this value from `start()`, so **no implementation change is needed** — only the type surface widens.

- [ ] **Step 4: Typecheck**

Run: `yarn typecheck 2>&1 | tail -20`
Expected: No new errors referencing `opensearch/types.ts` or `getClientTransport`.

- [ ] **Step 5: Regenerate the API snapshot**

Run: `yarn docs:acceptApiChanges 2>&1 | tail -20`
Expected: completes; `git status` shows `src/core/server/server.api.md` modified. Confirm with:
`git diff src/core/server/server.api.md | grep -n "getClientTransport"`
Expected: `getClientTransport` now appears under `OpenSearchServiceStart` (line ~1540) and is removed from the internal interface block.

- [ ] **Step 6: Commit**

```bash
git add src/core/server/opensearch/types.ts src/core/server/server.api.md
git commit -s -m "feat(core): expose getClientTransport on public OpenSearchServiceStart"
```

---

## Task 2: Thread a custom Transport into the modern data-source client

**Files:**
- Modify: `src/plugins/data_source/server/types.ts`
- Modify: `src/plugins/data_source/server/client/configure_client.ts`
- Test: `src/plugins/data_source/server/client/configure_client.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/plugins/data_source/server/client/configure_client.test.ts`, add a test inside `describe('configureClient', () => { ... })`. It asserts that when `customTransport` is provided in params, it is forwarded to the `Client` constructor options. Place it after the existing `beforeEach`:

```ts
  test('configureClient passes customTransport to the Client constructor when provided', async () => {
    class FakeTransport {}
    parseClientOptionsMock.mockReturnValue(clientOptions);
    savedObjectsMock.get.mockReset();
    savedObjectsMock.get.mockResolvedValueOnce({
      id: DATA_SOURCE_ID,
      type: DATA_SOURCE_SAVED_OBJECT_TYPE,
      attributes: {
        ...dataSourceAttr,
        auth: { type: AuthType.NoAuth, credentials: undefined },
      },
      references: [],
    });

    await configureClient(
      { ...dataSourceClientParams, customTransport: FakeTransport as any },
      clientPoolSetup,
      config,
      logger
    );

    expect(ClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ Transport: FakeTransport })
    );
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:jest src/plugins/data_source/server/client/configure_client.test.ts -t "customTransport" 2>&1 | tail -25`
Expected: FAIL — `Client` is called without a `Transport` property (and `customTransport` is not yet a valid param field).

- [ ] **Step 3: Add `customTransport` to `DataSourceClientParams`**

In `src/plugins/data_source/server/types.ts`, add an import for `Transport` at the top (near other `@opensearch-project/opensearch` imports; if none exists, add it):

```ts
import { Transport } from '@opensearch-project/opensearch';
```

Then add to `export interface DataSourceClientParams { ... }` (after `authRegistry?:`):

```ts
  // Optional custom Transport class (e.g. legacy backend compatibility) to apply to the
  // modern client so data-source connections get the same interception as core's client.
  customTransport?: typeof Transport;
```

- [ ] **Step 4: Forward `customTransport` into the modern client options**

In `src/plugins/data_source/server/client/configure_client.ts`:

(a) Destructure `customTransport` from params in `configureClient`'s first argument (add it to the existing destructure list alongside `authRegistry`):

```ts
    request,
    authRegistry,
    customTransport,
  }: DataSourceClientParams,
```

(b) Pass it down to `getQueryClient`. Update the `getQueryClient(...)` call at the end of the `try` block to add `customTransport` as a new trailing argument:

```ts
    return await getQueryClient(
      dataSource,
      openSearchClientPoolSetup.addClientToPool,
      config,
      registeredSchema,
      cryptography,
      rootClient,
      dataSourceId,
      request,
      clientParams,
      requireDecryption,
      customTransport
    );
```

(c) Add the parameter to the `getQueryClient` signature (after `requireDecryption: boolean = true`):

```ts
  requireDecryption: boolean = true,
  customTransport?: typeof Transport
): Promise<Client> => {
```

(d) Import `Transport` in this file. Update the existing import:

```ts
import { Client, ClientOptions, Transport } from '@opensearch-project/opensearch';
```

(e) Apply the transport to `clientOptions` once, right after `const clientOptions = parseClientOptions(config, endpoint, registeredSchema);`:

```ts
  const clientOptions = parseClientOptions(config, endpoint, registeredSchema);
  if (customTransport) {
    // The Transport applies to the root client; children created via .child() inherit it.
    (clientOptions as ClientOptions).Transport = customTransport;
  }
```

This means every `new Client(clientOptions)` branch (NoAuth / UsernamePassword / SigV4) picks up the transport without further edits. (SigV4's `getAWSClient` also spreads `clientOptions`, so it is covered too.)

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test:jest src/plugins/data_source/server/client/configure_client.test.ts -t "customTransport" 2>&1 | tail -25`
Expected: PASS.

- [ ] **Step 6: Run the full file to check for regressions**

Run: `yarn test:jest src/plugins/data_source/server/client/configure_client.test.ts 2>&1 | tail -25`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/plugins/data_source/server/types.ts src/plugins/data_source/server/client/configure_client.ts src/plugins/data_source/server/client/configure_client.test.ts
git commit -s -m "feat(data_source): forward custom Transport into modern client pool"
```

---

## Task 3: Supply the transport from the data_source plugin lifecycle

**Files:**
- Modify: `src/plugins/data_source/server/data_source_service.ts`
- Modify: `src/plugins/data_source/server/plugin.ts`

- [ ] **Step 1: Read current service + plugin wiring**

Confirm in `data_source_service.ts`: `setup(config)` returns `getDataSourceClient` which calls `configureClient(params, opensearchClientPoolSetup, config, this.logger)`. Confirm in `plugin.ts`: `getClient` (line ~215) calls `dataSourceService.getDataSourceClient({...})` and does NOT currently pass `customTransport`; `start(core: CoreStart)` exists at line ~184.

- [ ] **Step 2: Add a transport getter to the service setup**

In `src/plugins/data_source/server/data_source_service.ts`:

(a) Add a `Transport` type import:

```ts
import { Transport } from '@opensearch-project/opensearch';
```

(b) Add a private field and a setter on the class. After `private readonly legacyLogger: Logger;` add:

```ts
  private customTransport?: typeof Transport;
```

(c) Add a public method to the `DataSourceService` class (after the constructor):

```ts
  /**
   * Register a custom Transport class (e.g. legacy backend compatibility) to apply to
   * modern data-source clients. Called from the plugin's start() once core's registered
   * transport is available. No-op when undefined (e.g. backendCompatibility disabled).
   */
  public setCustomTransport(transport?: typeof Transport) {
    this.customTransport = transport;
  }
```

(d) Forward it in `getDataSourceClient`. Change the body to include `customTransport`:

```ts
    const getDataSourceClient = async (
      params: DataSourceClientParams
    ): Promise<OpenSearchClient> => {
      return configureClient(
        { ...params, customTransport: this.customTransport },
        opensearchClientPoolSetup,
        config,
        this.logger
      );
    };
```

- [ ] **Step 3: Call the setter from `start()` in the plugin**

In `src/plugins/data_source/server/plugin.ts`, the `dataSourceService` is created in the constructor (`this.dataSourceService = new DataSourceService(...)`) and set up in `setup()`. In `public start(core: CoreStart)`, add — before the `return {`:

```ts
    // backendCompatibility (when enabled) registers a custom Transport on core's client.
    // Apply the same Transport to modern data-source clients so legacy ES (6.x/7.x)
    // connections get identical request/response interception (e.g. /_resolve/index
    // synthesis). Undefined when no Transport is registered → data-source clients are
    // built exactly as before (no behavior change).
    this.dataSourceService.setCustomTransport(core.opensearch.getClientTransport?.());
```

Note: `this.dataSourceService` is a class field (`private readonly dataSourceService`), so it is reachable in `start()`. `core.opensearch` is `OpenSearchServiceStart` here, which now (Task 1) exposes `getClientTransport`.

- [ ] **Step 4: Typecheck**

Run: `yarn typecheck 2>&1 | tail -20`
Expected: no errors in `data_source_service.ts` or `plugin.ts`. (If `getClientTransport` is flagged as possibly-undefined, the `?.()` optional call already guards it.)

- [ ] **Step 5: Run data_source server tests**

Run: `yarn test:jest src/plugins/data_source/server 2>&1 | tail -25`
Expected: PASS (existing suites unaffected; service has no dedicated transport test — covered via Task 2).

- [ ] **Step 6: Commit**

```bash
git add src/plugins/data_source/server/data_source_service.ts src/plugins/data_source/server/plugin.ts
git commit -s -m "feat(data_source): apply core's registered Transport to data-source clients on start"
```

---

## Task 4: Switch the resolve_index route to the modern client

**Files:**
- Modify: `src/plugins/index_pattern_management/server/routes/resolve_index.ts`
- Test: `src/plugins/index_pattern_management/server/routes/resolve_index.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/plugins/index_pattern_management/server/routes/resolve_index.test.ts`:

```ts
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerResolveIndexRoute } from './resolve_index';

type Handler = (context: any, req: any, res: any) => Promise<any>;

const setup = () => {
  let handler: Handler = async () => undefined;
  const router = {
    get: jest.fn((_config: any, h: Handler) => {
      handler = h;
    }),
  };
  registerResolveIndexRoute(router as any);
  return { router, getHandler: () => handler };
};

const resFactory = () => ({
  ok: jest.fn((v: any) => ({ ok: v })),
  customError: jest.fn((v: any) => ({ error: v })),
});

describe('registerResolveIndexRoute', () => {
  it('uses the modern data source client transport when data_source is provided', async () => {
    const { getHandler } = setup();
    const transportRequest = jest.fn().mockResolvedValue({ body: { indices: [] } });
    const getClient = jest.fn().mockResolvedValue({ transport: { request: transportRequest } });

    const context = {
      core: { opensearch: { client: { asCurrentUser: { transport: { request: jest.fn() } } } } },
      dataSource: { opensearch: { getClient } },
    };
    const req = { params: { query: '*' }, query: { data_source: 'ds-1' } };
    const res = resFactory();

    await getHandler()(context, req, res);

    expect(getClient).toHaveBeenCalledWith('ds-1');
    expect(transportRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: expect.stringContaining('/_resolve/index/') })
    );
    expect(res.ok).toHaveBeenCalled();
  });

  it('uses the core client when no data_source is provided', async () => {
    const { getHandler } = setup();
    const transportRequest = jest.fn().mockResolvedValue({ body: { indices: [] } });

    const context = {
      core: { opensearch: { client: { asCurrentUser: { transport: { request: transportRequest } } } } },
      dataSource: { opensearch: { getClient: jest.fn() } },
    };
    const req = { params: { query: '*' }, query: {} };
    const res = resFactory();

    await getHandler()(context, req, res);

    expect(context.dataSource.opensearch.getClient).not.toHaveBeenCalled();
    expect(transportRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: expect.stringContaining('/_resolve/index/') })
    );
    expect(res.ok).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:jest src/plugins/index_pattern_management/server/routes/resolve_index.test.ts 2>&1 | tail -30`
Expected: FAIL — the current handler calls `context.dataSource.opensearch.legacy.getClient(...).callAPI(...)`, so `getClient` (modern) and `transport.request` are never invoked.

- [ ] **Step 3: Rewrite the handler to use the modern client**

In `src/plugins/index_pattern_management/server/routes/resolve_index.ts`, replace the handler body (the `async (context, req, res) => { ... }` passed to `router.get`) with:

```ts
    async (context, req, res) => {
      const queryString = req.query.expand_wildcards
        ? { expand_wildcards: req.query.expand_wildcards }
        : null;

      const dataSourceId = req.query.data_source;
      // Use the MODERN client. For data sources this gives a per-connection client whose
      // Transport (when backendCompatibility is enabled) can synthesize /_resolve/index for
      // legacy Elasticsearch (6.x) clusters that lack the API. The legacy client cannot carry
      // a Transport, so it must not be used here.
      const client = dataSourceId
        ? await context.dataSource.opensearch.getClient(dataSourceId)
        : context.core.opensearch.client.asCurrentUser;

      try {
        const result = await client.transport.request({
          method: 'GET',
          path: `/_resolve/index/${encodeURIComponent(req.params.query)}${
            queryString ? '?' + new URLSearchParams(queryString).toString() : ''
          }`,
        });
        return res.ok({ body: result.body });
      } catch (err) {
        return res.customError({
          statusCode: err.statusCode || 500,
          body: {
            message: err.message,
            attributes: {
              error: err.body?.error || err.message,
            },
          },
        });
      }
    }
```

Also update the imports at the top of the file: the legacy types are no longer needed. Replace:

```ts
import { schema } from '@osd/config-schema';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { IRouter, LegacyAPICaller } from 'src/core/server';
```

with:

```ts
import { schema } from '@osd/config-schema';
import { IRouter } from 'src/core/server';
```

Note: the modern client's `transport.request` resolves to an `ApiResponse` whose payload is on `.body` (hence `result.body`), whereas the legacy `callAPI('transport.request', ...)` returned the body directly. This is the one response-shape difference to get right.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test:jest src/plugins/index_pattern_management/server/routes/resolve_index.test.ts 2>&1 | tail -25`
Expected: PASS (both tests).

- [ ] **Step 5: Typecheck**

Run: `yarn typecheck 2>&1 | tail -20`
Expected: no errors in `resolve_index.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/plugins/index_pattern_management/server/routes/resolve_index.ts src/plugins/index_pattern_management/server/routes/resolve_index.test.ts
git commit -s -m "fix(index_pattern_management): resolve_index uses modern data source client for ES 6.x compatibility"
```

---

## Task 5: Full verification

- [ ] **Step 1: Lint the changed files**

Run: `node scripts/eslint src/plugins/data_source/server/client/configure_client.ts src/plugins/data_source/server/data_source_service.ts src/plugins/data_source/server/plugin.ts src/plugins/data_source/server/types.ts src/plugins/index_pattern_management/server/routes/resolve_index.ts src/core/server/opensearch/types.ts 2>&1 | tail -20`
Expected: no errors.

- [ ] **Step 2: Typecheck whole repo**

Run: `yarn typecheck 2>&1 | tail -20`
Expected: clean (no new errors).

- [ ] **Step 3: Run the touched test suites together**

Run:
```bash
yarn test:jest \
  src/plugins/data_source/server/client/configure_client.test.ts \
  src/plugins/index_pattern_management/server/routes/resolve_index.test.ts \
  2>&1 | tail -30
```
Expected: all PASS.

- [ ] **Step 4: Manual validation (requires running OSD + an ES 6.8 data source)**

1. Set `backendCompatibility.enabled: true` in `opensearch_dashboards.yml`.
2. `yarn start`, register/select the ES 6.8 data source.
3. Open Index Pattern Management → create index pattern → confirm indexes now list (no `invalid_index_name_exception`).
4. Toggle `backendCompatibility.enabled: false`, restart: confirm 6.8 again errors (proves the gate) while 7.x–10.x and OpenSearch still work in both modes.

- [ ] **Step 5: Final commit (if any verification fixups were made)**

```bash
git add -A && git commit -s -m "chore: verification fixups for es68 resolve_index"
```

---

## Self-Review Notes

- **Spec coverage:** Core getter public (Task 1) ✓; transport into modern pool (Task 2) ✓; supplied from lifecycle (Task 3) ✓; route switched to modern client (Task 4) ✓; verification incl. flag-off no-op (Task 5) ✓.
- **Flag-off behavior:** `getClientTransport?.()` → `undefined` → `customTransport` undefined → `clientOptions.Transport` unset → client built exactly as today. The route change itself (legacy→modern client) is independent of the flag; it is a like-for-like transport call and must be validated against OpenSearch/7.x too (Step 4).
- **Type consistency:** `customTransport?: typeof Transport` used identically in `DataSourceClientParams`, `configure_client.ts`, and `data_source_service.ts`. Method name `setCustomTransport` consistent between service definition and plugin call.
- **Risk to flag:** The one semantic change that applies even with the flag OFF is the route moving off the legacy client onto the modern client. Step 4 explicitly validates 7.x/OpenSearch in both flag states to catch any response-shape regression (`result.body`).
