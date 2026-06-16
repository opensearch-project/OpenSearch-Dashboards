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
 * `@rspack/core` (a native binding) needs `TextDecoder`/`TextEncoder`, which
 * neither the jsdom nor this jest node environment exposes as globals; this
 * config-shape test has no DOM needs, so it runs in the node environment and
 * polyfills the two globals (below) BEFORE `@rspack/core` is loaded.
 */

import Path from 'path';
import { TextDecoder, TextEncoder } from 'util';

// Polyfill BEFORE the SUT (which statically imports @rspack/core) is loaded.
// `util` is a static import (hoisted), but this top-level assignment runs at
// module-evaluation time — and the SUT is pulled in lazily via dynamic import()
// in `beforeAll` below, so @rspack/core only loads AFTER these globals exist.
Object.assign(global, { TextDecoder, TextEncoder });

let getMfeRspackConfig: typeof import('./mfe_rspack_config').getMfeRspackConfig;

beforeAll(async () => {
  ({ getMfeRspackConfig } = await import('./mfe_rspack_config'));
});

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
