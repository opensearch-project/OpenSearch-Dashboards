#!/usr/bin/env node
/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * packages/osd-mfe/dev/examples/mock_lotus_registry_reader.js
 *
 * Teaching example: how to plug an EXTERNAL registry service into OSD-MFE
 * without modifying any code in `packages/osd-mfe/src/`.
 *
 * Background
 * ----------
 * OSD-MFE reads the plugin manifest via the `RegistryReader` interface defined
 * in `packages/osd-mfe/src/registry/reader.ts`. The default implementation
 * (`FileRegistryReader`) reads from a JSON file on disk. But the interface is
 * the architectural seam — anyone can implement it against ANY backend (S3,
 * HTTP API, in-memory generator, …) and OSD will load plugins identically.
 *
 * The contract (single async method):
 *
 *   resolve(dimensions: ResolutionDimensions): Promise<BootManifest>
 *
 *   - `dimensions`: `{ customerId: string, userBucket: number }` — the host's
 *     view of WHO is requesting; lets the reader return tenant- and bucket-
 *     scoped manifests.
 *   - `BootManifest`: `{ sharedDeps, mfes: Array<entry>, core?, orchestrator?,
 *     themes?, sharedDepsCss? }` — the flat, browser-facing shape OSD-MFE's
 *     bootstrap consumes (`packages/osd-mfe/src/registry/boot_manifest.ts`).
 *
 * This example shows the simplest non-file backend: a MOCK external registry
 * service that we imagine vends per-version metadata. Think of it as a
 * stand-in for any real-world service that you'd integrate with — corporate
 * registry, internal CDN service, multi-tenant routing layer, etc. The mock
 * is in-process (no AWS, no HTTP) so this file runs anywhere.
 *
 * What the example shows
 * ----------------------
 * 1. The shape of `RegistryReader`: a single async `resolve(dimensions)`
 *    method returning a `BootManifest`.
 * 2. How to translate a "registry service response" into the BootManifest
 *    shape OSD-MFE wants — the data-mapping seam (`mfes` is an ARRAY of
 *    entries, each carrying its own `id`; the optional global asset roots
 *    `core`, `orchestrator`, `themes`, `sharedDepsCss` map verbatim from
 *    upstream metadata into the manifest).
 * 3. How to compose: dimensions (tenant id, user bucket) flow IN; manifest
 *    flows OUT; the host doesn't know what registry source produced it.
 *
 * Run it
 * ------
 *   node packages/osd-mfe/dev/examples/mock_lotus_registry_reader.js
 *
 * In a real integration (e.g. wrapping a real corporate registry):
 *   - Replace `MockExternalRegistryClient.resolve()` with real network calls
 *     (HTTPS GET, gRPC, AWS SDK, whatever the backend speaks).
 *   - Pass the resulting `LotusLikeRegistryReader` to OSD via the server-side
 *     dependency injection point (the host server reads from a configurable
 *     RegistryReader; see `packages/osd-mfe/src/registry/index.ts`).
 *   - Keep this `resolve` adapter ~50-200 LOC; it's the boundary between the
 *     external service's schema and OSD's BootManifest shape.
 *
 * THIS FILE HAS NO AWS DEPENDENCIES. It is a teaching example, not a
 * production reader. The "Lotus" in its name is illustrative — substitute
 * your real registry service.
 */
'use strict';

const path = require('path');

// ---------------------------------------------------------------------------
// SECTION 1: A made-up "external registry service" with an in-memory backing.
//   Pretend this is an HTTP client that calls out to a registry over the network.
//   Schema below mirrors a real-world pattern (package → version → CDN URL +
//   integrity), but is entirely local and synchronous for teaching purposes.
// ---------------------------------------------------------------------------

class MockExternalRegistryClient {
  constructor() {
    // Imagine these are records the registry service stores.
    // Each record: packageName -> majorVersion -> {versionAlias: versionId}
    // and versionId -> {cdnUrl, integrity}.
    this._aliases = new Map([
      ['example/widget|1', new Map([
        ['stable', 'v1.2.3'],
        ['canary', 'v1.3.0-rc.1'],
      ])],
    ]);
    this._versions = new Map([
      ['example/widget|1|v1.2.3', {
        cdnUrl: 'https://cdn.example.com/example-widget/abc123/remoteEntry.js',
        integrity: 'sha384-DEMO_STABLE_HASH_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      }],
      ['example/widget|1|v1.3.0-rc.1', {
        cdnUrl: 'https://cdn.example.com/example-widget/def456/remoteEntry.js',
        integrity: 'sha384-DEMO_CANARY_HASH_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      }],
    ]);
    // Tenant/bucket-scoped alias selection — a real registry would expose
    // this as part of its query API. Here we keep it in-process so the demo
    // is self-contained: tenant "canary-corp" gets the canary alias, every
    // other tenant gets stable; userBucket isn't used here but flows through
    // so the example shows the dimension surface end-to-end.
    this._tenantAlias = new Map([
      ['canary-corp', 'canary'],
    ]);
  }

  /** Resolve aliasName → versionId. Simulates the "alias lookup" API. */
  async getVersionAlias(packageName, majorVersion, aliasName) {
    const key = `${packageName}|${majorVersion}`;
    const aliases = this._aliases.get(key);
    if (!aliases || !aliases.has(aliasName)) {
      throw new Error(`alias not found: ${packageName}/${majorVersion}/${aliasName}`);
    }
    return { versionId: aliases.get(aliasName) };
  }

  /** Get version details (CDN URL, integrity). Simulates the "version metadata" API. */
  async getVersion(packageName, majorVersion, versionId) {
    const key = `${packageName}|${majorVersion}|${versionId}`;
    const v = this._versions.get(key);
    if (!v) {
      throw new Error(`version not found: ${packageName}/${majorVersion}/${versionId}`);
    }
    return { ...v, versionId };
  }

  /** Tenant → alias choice. Stable by default; a real registry might also
   *  steer canary by userBucket here. */
  pickAliasForDimensions(dimensions) {
    return this._tenantAlias.get(dimensions.customerId) || 'stable';
  }
}

// ---------------------------------------------------------------------------
// SECTION 2: The RegistryReader adapter.
//   Implements the `RegistryReader` interface OSD-MFE expects:
//
//     resolve(dimensions: ResolutionDimensions): Promise<BootManifest>
//
//   Maps the external service's schema into a BootManifest. THE INTEGRATION SEAM.
// ---------------------------------------------------------------------------

class LotusLikeRegistryReader /* implements RegistryReader */ {
  /**
   * @param {object} opts
   * @param {MockExternalRegistryClient} opts.client - registry service client
   * @param {Array<{id: string, scope: string, module: string, package: string, majorVersion: string, compat?: object}>} opts.plugins
   *   - the static "plugin to registry coords" mapping. In a real integration,
   *     this might come from a config file, a database, or be hard-coded.
   * @param {{ sharedDeps: { url: string, version: string }, core?: object, orchestrator?: object, themes?: object, sharedDepsCss?: object }} [opts.globalAssets]
   *   - host-level metadata the registry vends on the side: the singleton
   *     sharedDeps bundle URL (required by BootManifest) plus the OPTIONAL
   *     global asset roots (`core`, `orchestrator`, per-theme CSS, sharedDepsCss
   *     bundle). Each is mirrored onto the manifest verbatim; missing fields
   *     fall back to OSD's server-bundled `/bundles/...` path at boot time.
   */
  constructor({ client, plugins, globalAssets }) {
    this._client = client;
    this._plugins = plugins;
    this._globalAssets = globalAssets;
  }

  /**
   * The RegistryReader contract: given resolution dimensions (tenant id,
   * user bucket), return a `BootManifest` of plugins the host should load.
   *
   * `dimensions` influences WHICH alias to query (e.g., canary for users in
   * the 1% bucket or the canary tenant; stable for everyone else). The
   * registry service is the source of truth for that mapping — the host
   * never decides on its own.
   *
   * @param {{ customerId: string, userBucket: number }} dimensions
   * @returns {Promise<{ sharedDeps: object, mfes: Array<object>, core?: object, orchestrator?: object, themes?: object, sharedDepsCss?: object }>}
   */
  async resolve(dimensions) {
    const alias = this._client.pickAliasForDimensions(dimensions);
    const mfes = [];
    for (const p of this._plugins) {
      // Step 1: resolve alias → versionId via the registry service.
      const { versionId } = await this._client.getVersionAlias(
        p.package, p.majorVersion, alias);
      // Step 2: fetch version details (CDN URL + integrity).
      const v = await this._client.getVersion(
        p.package, p.majorVersion, versionId);
      // Step 3: map external schema → BootManifestEntry. Note `mfes` is an
      // ARRAY (declared order = load order); each entry carries its own `id`.
      mfes.push({
        id: p.id,
        version: `${p.majorVersion}.${versionId}`,
        remoteEntry: v.cdnUrl,
        scope: p.scope,
        module: p.module,
        integrity: v.integrity,
        compat: p.compat,
      });
    }

    // Project global assets into the manifest verbatim. Absent fields are
    // omitted (not nulled) so the browser falls back to `/bundles/...`.
    const manifest = {
      sharedDeps: this._globalAssets.sharedDeps,
      mfes,
    };
    if (this._globalAssets.core) manifest.core = this._globalAssets.core;
    if (this._globalAssets.orchestrator) manifest.orchestrator = this._globalAssets.orchestrator;
    if (this._globalAssets.themes) manifest.themes = this._globalAssets.themes;
    if (this._globalAssets.sharedDepsCss) manifest.sharedDepsCss = this._globalAssets.sharedDepsCss;
    return manifest;
  }
}

// ---------------------------------------------------------------------------
// SECTION 3: Demo runner.
//   Wires the adapter up, exercises both tenants (default → stable,
//   canary-corp → canary), and validates the produced manifest against the
//   REAL `assertValidBootManifest` from `packages/osd-mfe/src/registry` so a
//   future shape change to BootManifest surfaces here as a hard failure
//   (the unified schema is the SINGLE source of truth for the validation
//   surface).
// ---------------------------------------------------------------------------

async function main() {
  // Load OSD's babel-register node env so we can require the TypeScript
  // validator directly. Same bootstrap the harness's local_registry_server.js
  // and scripts/update_registry.js use.
  const osdDir = path.resolve(__dirname, '../../../..');
  // eslint-disable-next-line global-require, import/no-dynamic-require
  require(path.join(osdDir, 'src/setup_node_env'));
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { assertValidBootManifest } = require(path.join(
    osdDir,
    'packages/osd-mfe/src/registry'
  ));

  const client = new MockExternalRegistryClient();
  const reader = new LotusLikeRegistryReader({
    client,
    plugins: [
      {
        id: 'example_widget',                        // the OSD plugin id
        scope: 'osdMfe_example_widget',              // the MF container scope
        module: './public',                          // the MF exposed module path
        package: 'example/widget',                   // the external registry package
        majorVersion: '1',                           // the external registry major version
        compat: {
          minCoreVersion: '3.5.0',
          compatibleCoreRange: '3.5.x',
        },
      },
    ],
    globalAssets: {
      sharedDeps: {
        url: 'https://cdn.example.com/shared-deps/abc123/osd-ui-shared-deps.js',
        version: '3.5.0+abc123',
      },
      core: {
        url: 'https://cdn.example.com/core/abc123/core.entry.js',
        integrity: 'sha384-DEMO_CORE_HASH_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        version: '3.5.0+abc123',
      },
      orchestrator: {
        url: 'https://cdn.example.com/orchestrator/abc123/osd_bootstrap_mfe.js',
        integrity: 'sha384-DEMO_ORCH_HASH_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        version: '3.5.0+abc123',
      },
      themes: {
        light: {
          url: 'https://cdn.example.com/themes/light/abc123/legacy_light_theme.css',
          integrity: 'sha384-DEMO_LIGHT_HASH_cccccccccccccccccccccccccccccccccccccccccccccccccccc',
          version: '3.5.0+abc123',
        },
        dark: {
          url: 'https://cdn.example.com/themes/dark/abc123/legacy_dark_theme.css',
          integrity: 'sha384-DEMO_DARK_HASH_ddddddddddddddddddddddddddddddddddddddddddddddddddddd',
          version: '3.5.0+abc123',
        },
      },
      sharedDepsCss: {
        url: 'https://cdn.example.com/shared-deps/abc123/osd-ui-shared-deps.css',
        integrity: 'sha384-DEMO_SDCSS_HASH_eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        version: '3.5.0+abc123',
      },
    },
  });

  for (const dimensions of [
    { customerId: 'default', userBucket: 7 },     // expect stable alias -> v1.2.3
    { customerId: 'canary-corp', userBucket: 7 }, // expect canary alias -> v1.3.0-rc.1
  ]) {
    const manifest = await reader.resolve(dimensions);
    // Validate against the REAL BootManifest contract — fail-loud if drift.
    assertValidBootManifest(manifest);
    console.log(`BootManifest for dimensions=${JSON.stringify(dimensions)}:`);
    console.log(JSON.stringify(manifest, null, 2));
    console.log('');
  }

  console.log(
    '^ Both manifests validate against assertValidBootManifest (the same\n' +
      '  validator OSD-MFE\'s server uses to guard the browser-injected slot).\n' +
      '  Plug this reader into OSD\'s server-side registry resolution and the\n' +
      '  rest of the boot path (compat check, MF load, SRI verify) just works.'
  );
}

main().catch((err) => {
  console.error('demo failed:', err);
  process.exit(1);
});
