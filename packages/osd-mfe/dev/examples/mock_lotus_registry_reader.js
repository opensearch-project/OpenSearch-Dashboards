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
 * This example shows the simplest non-file backend: a MOCK external registry
 * service that we imagine vends per-version metadata. Think of it as a
 * stand-in for any real-world service that you'd integrate with — corporate
 * registry, internal CDN service, multi-tenant routing layer, etc. The mock
 * is in-process (no AWS, no HTTP) so this file runs anywhere.
 *
 * What the example shows
 * ----------------------
 * 1. The shape of `RegistryReader`: a single async `getBootManifest({dims})`
 *    method that returns a `BootManifest` (list of plugin entries).
 * 2. How to translate a "registry service response" into the BootManifest
 *    shape OSD-MFE wants — the data-mapping seam.
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
 *   - Keep this `getBootManifest` adapter ~50-200 LOC; it's the boundary
 *     between the external service's schema and OSD's BootManifest shape.
 *
 * THIS FILE HAS NO AWS DEPENDENCIES. It is a teaching example, not a
 * production reader. The "Lotus" in its name is illustrative — substitute
 * your real registry service.
 */
'use strict';

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
    // and versionId -> {cdnUrl, integrity, moduleType}.
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
}

// ---------------------------------------------------------------------------
// SECTION 2: The RegistryReader adapter.
//   Implements the `RegistryReader` interface OSD-MFE expects. Maps the
//   external service's schema into BootManifest entries. THE INTEGRATION SEAM.
// ---------------------------------------------------------------------------

class LotusLikeRegistryReader /* implements RegistryReader */ {
  /**
   * @param {object} opts
   * @param {MockExternalRegistryClient} opts.client - registry service client
   * @param {Array<{id: string, scope: string, module: string, package: string, majorVersion: string, alias: string, compat?: object}>} opts.plugins
   *   - the static "plugin to registry coords" mapping. In a real integration,
   *     this might come from a config file, a database, or be hard-coded.
   */
  constructor({ client, plugins }) {
    this._client = client;
    this._plugins = plugins;
  }

  /**
   * The RegistryReader contract: given resolution dimensions (tenant id,
   * user bucket, etc.), return a BootManifest of plugins the host should load.
   *
   * In a real implementation, `dims` would influence WHICH alias to query
   * (e.g., the canary alias for users in the 1% bucket, stable for everyone
   * else). This example always uses 'stable' for simplicity.
   *
   * @param {{ dims?: { customerId?: string, userBucket?: number } }} _opts
   * @returns {Promise<{ mfes: Record<string, BootManifestEntry> }>}
   */
  async getBootManifest(_opts) {
    const mfes = {};
    for (const p of this._plugins) {
      // Step 1: resolve alias → versionId via the registry service.
      const { versionId } = await this._client.getVersionAlias(
        p.package, p.majorVersion, p.alias);
      // Step 2: fetch version details (CDN URL + integrity).
      const v = await this._client.getVersion(
        p.package, p.majorVersion, versionId);
      // Step 3: map external schema → BootManifest entry.
      mfes[p.id] = {
        version: `${p.majorVersion}.${versionId}`,
        remoteEntry: v.cdnUrl,
        scope: p.scope,
        module: p.module,
        integrity: v.integrity,
        compat: p.compat,
      };
    }
    return { mfes };
  }
}

// ---------------------------------------------------------------------------
// SECTION 3: Demo runner.
//   Wires the adapter up and prints the BootManifest it produces. Run with
//   `node packages/osd-mfe/dev/examples/mock_lotus_registry_reader.js`.
// ---------------------------------------------------------------------------

async function main() {
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
        alias: 'stable',                             // which alias to read
        compat: {
          minCoreVersion: '3.5.0',
          compatibleCoreRange: '3.5.x',
        },
      },
    ],
  });

  const manifest = await reader.getBootManifest({});
  console.log('BootManifest produced by LotusLikeRegistryReader:');
  console.log(JSON.stringify(manifest, null, 2));
  console.log('\n^ This is exactly the shape OSD-MFE\'s FileRegistryReader would produce.');
  console.log('  Plug this reader into OSD\'s server-side registry resolution and');
  console.log('  the rest of the boot path (compat check, MF load, SRI verify) just works.');
}

main().catch((err) => {
  console.error('demo failed:', err);
  process.exit(1);
});
