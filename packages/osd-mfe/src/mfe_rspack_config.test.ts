/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * @jest-environment node
 *
 * Config-shape unit test for `getMfeRspackConfig`.
 *
 * We MOCK `@rspack/core` on purpose. It is a native binding whose load
 * registers a process-lifetime `CustomGC` handle that keeps Jest from exiting —
 * which (depending on GC timing) hangs `node scripts/jest packages/osd-mfe`
 * indefinitely and would otherwise force a blanket `--forceExit` (a band-aid
 * that masks real handle leaks). This test only asserts that the builder wires
 * the right config OPTIONS; the real rspack plugin behavior (actual SRI hashing
 * + bundling) is covered end-to-end by `harness/verify_sri.js` against a real
 * `--dist` build. Mocking keeps this a true unit test (no native bundler load)
 * and lets Jest exit cleanly with zero open handles and no `--forceExit`.
 */

import Path from 'path';

// Minimal stand-ins for the rspack surface `getMfeRspackConfig` uses. Class
// names are PRESERVED so the `constructor.name` assertions stay meaningful, and
// each plugin records its constructor args on `.options` for option assertions.
jest.mock('@rspack/core', () => {
  class ResolverFactory {
    // Deterministic resolved path so cross-plugin/core externalization virtual
    // modules are built without touching disk or the native resolver.
    public sync(_context: string, request: string) {
      return { path: `/mock/resolved/${request.replace(/[^a-z]/gi, '_')}` };
    }
  }
  class VirtualModulesPlugin {
    public modules: unknown;
    constructor(modules: unknown) {
      this.modules = modules;
    }
  }
  class SubresourceIntegrityPlugin {
    public options: unknown;
    constructor(options: unknown) {
      this.options = options;
    }
  }
  class DefinePlugin {
    public definitions: unknown;
    constructor(definitions: unknown) {
      this.definitions = definitions;
    }
  }
  class ModuleFederationPlugin {
    public options: unknown;
    constructor(options: unknown) {
      this.options = options;
    }
  }
  return {
    rspack: {
      experiments: {
        resolver: { ResolverFactory },
        VirtualModulesPlugin,
        SubresourceIntegrityPlugin,
      },
      DefinePlugin,
      container: { ModuleFederationPlugin },
    },
  };
});

// eslint-disable-next-line import/first -- must follow the jest.mock above
import { getMfeRspackConfig } from './mfe_rspack_config';

/** The OSD repo root (this file lives at packages/osd-mfe/src). */
const REPO_ROOT = Path.resolve(__dirname, '../../..');

function buildConfig() {
  const pluginDir = Path.join(REPO_ROOT, 'src/plugins/data');
  return getMfeRspackConfig({
    plugin: { id: 'data', directory: pluginDir, outputDir: Path.join(pluginDir, 'target/public') },
    repoRoot: REPO_ROOT,
    publicEntry: Path.join(pluginDir, 'public/index.ts'),
    sassImplementation: {},
  });
}

describe('getMfeRspackConfig — lazy-chunk Subresource Integrity (Phase 12, Story 3)', () => {
  it('sets output.crossOriginLoading to "anonymous" so chunk SRI is enforceable', () => {
    const config = buildConfig();
    // crossorigin on the runtime-injected chunk <script> is REQUIRED for the
    // browser to enforce the per-chunk integrity attribute.
    expect(config.output?.crossOriginLoading).toBe('anonymous');
  });

  it('includes the native rspack SubresourceIntegrityPlugin with sha384', () => {
    const config = buildConfig();
    const plugins = config.plugins ?? [];

    const names = plugins.map((p) =>
      p && (p as { constructor?: { name?: string } }).constructor
        ? (p as { constructor: { name: string } }).constructor.name
        : ''
    );
    expect(names).toContain('SubresourceIntegrityPlugin');

    const sri = plugins.find(
      (p) =>
        !!p &&
        (p as { constructor?: { name?: string } }).constructor?.name ===
          'SubresourceIntegrityPlugin'
    ) as
      | { options?: { hashFuncNames?: string[] }; _args?: Array<{ hashFuncNames?: string[] }> }
      | undefined;

    expect(sri).toBeDefined();
    const hashFuncNames = sri!.options?.hashFuncNames ?? sri!._args?.[0]?.hashFuncNames;
    // sha384 matches the registry/remoteEntry integrity algorithm (Story 1/2), so
    // the integrity story is uniform across remoteEntry and lazy chunks.
    expect(hashFuncNames).toContain('sha384');
  });

  it('keeps lazy chunks split (Phase 11) — the exposed entry is the eager plugin entry', () => {
    const config = buildConfig();
    // splitChunks stays disabled (the eager entry is a single file) and genuinely
    // dynamic import()'d chunks keep the `.chunk.` infix so they load on navigation
    // — SRI must not change the lazy-loading shape.
    expect(config.optimization?.splitChunks).toBe(false);
    const chunkFilename = config.output?.chunkFilename;
    expect(typeof chunkFilename).toBe('function');
    if (typeof chunkFilename === 'function') {
      const lazy = (chunkFilename as (data: {
        chunk?: { id?: string | number; name?: string };
      }) => string)({ chunk: { id: 'application' } });
      expect(lazy).toBe('data.chunk.application.js');
    }
  });
});
