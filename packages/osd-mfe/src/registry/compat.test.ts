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

import Path from 'path';

import { computeBuiltAgainstSharedDeps, computeCompatMetadata, defaultCompat } from './compat';
import { validate, SCHEMA_VERSION, Registry } from './schema';

/** The OSD repo root (packages/osd-mfe/src/registry -> up 4). */
const REPO_ROOT = Path.resolve(__dirname, '..', '..', '..', '..');

describe('defaultCompat', () => {
  it('derives "same major.minor" from the built-against version', () => {
    expect(defaultCompat('3.5.0')).toEqual({
      minCoreVersion: '3.5.0',
      compatibleCoreRange: '3.5.x',
    });
  });

  it('uses the major.minor regardless of patch/prerelease', () => {
    expect(defaultCompat('10.20.7-beta.1')).toEqual({
      minCoreVersion: '10.20.0',
      compatibleCoreRange: '10.20.x',
    });
  });

  it('throws on a version without a major.minor', () => {
    expect(() => defaultCompat('nope')).toThrow(/major\.minor/);
  });
});

describe('computeBuiltAgainstSharedDeps', () => {
  it('records only roots with an expressible semver range (drops disabled checks)', () => {
    const deps = computeBuiltAgainstSharedDeps(REPO_ROOT);
    // Plain semver ranges from the root package.json are recorded.
    expect(deps.react).toMatch(/\d+\.\d+\.\d+/);
    expect(deps['react-dom']).toMatch(/\d+\.\d+\.\d+/);
    // `npm:`-aliased roots (requiredVersion === false) are omitted: there is no
    // range to satisfy.
    expect(deps['@elastic/eui']).toBeUndefined();
    // Every recorded value is a non-empty string.
    for (const [root, range] of Object.entries(deps)) {
      expect(typeof range).toBe('string');
      expect(range.length).toBeGreaterThan(0);
      expect(root.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic (stable across calls)', () => {
    expect(computeBuiltAgainstSharedDeps(REPO_ROOT)).toEqual(
      computeBuiltAgainstSharedDeps(REPO_ROOT)
    );
  });
});

describe('computeCompatMetadata', () => {
  it('produces builtAgainst + compat consistent with the repo OSD version', () => {
    const meta = computeCompatMetadata(REPO_ROOT);
    expect(meta.builtAgainst.osdVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(meta.compat).toEqual(defaultCompat(meta.builtAgainst.osdVersion));
    expect(meta.builtAgainst.sharedDeps).toEqual(computeBuiltAgainstSharedDeps(REPO_ROOT));
  });

  it('honors an explicit osdVersion override', () => {
    const meta = computeCompatMetadata(REPO_ROOT, '9.9.9');
    expect(meta.builtAgainst.osdVersion).toBe('9.9.9');
    expect(meta.compat).toEqual({ minCoreVersion: '9.9.0', compatibleCoreRange: '9.9.x' });
  });

  it('produces metadata that passes registry validate() when stamped onto an entry', () => {
    const meta = computeCompatMetadata(REPO_ROOT);
    const registry: Registry = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: '2026-06-14T00:00:00.000Z',
      sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
      mfes: {
        inspector: {
          version: '3.5.0+abc123def456',
          remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
          scope: 'osdMfe_inspector',
          module: './public',
          builtAgainst: meta.builtAgainst,
          compat: meta.compat,
        },
      },
    };
    expect(validate(registry)).toEqual({ valid: true, errors: [] });
  });
});
