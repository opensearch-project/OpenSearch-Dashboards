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

import {
  BootManifest,
  validateBootManifest,
  assertValidBootManifest,
} from './boot_manifest';

/** A minimal, valid boot manifest used as the base for mutation in tests. */
function validManifest(): BootManifest {
  return {
    sharedDeps: {
      url: 'https://cdn.example.com/shared-deps/',
      version: '3.5.0',
    },
    mfes: [
      {
        id: 'inspector',
        remoteEntry: 'https://cdn.example.com/mfe/inspector/default/remoteEntry.js',
        scope: 'inspector',
        module: './public',
        version: '3.5.0+default00000',
        integrity: 'sha384-default',
      },
    ],
  };
}

describe('boot manifest — validateBootManifest() acceptance', () => {
  it('accepts a well-formed manifest', () => {
    expect(validateBootManifest(validManifest())).toEqual({ valid: true, errors: [] });
  });

  it('accepts a manifest with no mfes (empty list)', () => {
    const m = validManifest();
    m.mfes = [];
    expect(validateBootManifest(m).valid).toBe(true);
  });

  it('accepts an entry without optional integrity', () => {
    const m = validManifest();
    delete m.mfes[0].integrity;
    expect(validateBootManifest(m).valid).toBe(true);
  });

  it('accepts an entry with a well-formed compat block (Phase 9 carry-forward)', () => {
    const m = validManifest();
    m.mfes[0].compat = { minCoreVersion: '3.5.0', compatibleCoreRange: '3.5.x' };
    expect(validateBootManifest(m).valid).toBe(true);
  });

  it('accepts multiple distinct mfes', () => {
    const m = validManifest();
    m.mfes.push({
      id: 'dashboard',
      remoteEntry: 'https://cdn.example.com/mfe/dashboard/default/remoteEntry.js',
      scope: 'dashboard',
      module: './public',
      version: '3.5.0+dash00000000',
    });
    expect(validateBootManifest(m).valid).toBe(true);
  });
});

describe('boot manifest — validateBootManifest() rejection', () => {
  it.each([null, undefined, 42, 'nope', []])('rejects non-object input: %p', (input) => {
    const result = validateBootManifest(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('boot manifest must be an object');
  });

  it('rejects a missing sharedDeps', () => {
    const m = validManifest();
    delete (m as { sharedDeps?: unknown }).sharedDeps;
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('sharedDeps'))).toBe(true);
  });

  it('rejects sharedDeps with an empty url', () => {
    const m = validManifest();
    m.sharedDeps.url = '';
    expect(validateBootManifest(m).errors).toContain(
      'boot manifest sharedDeps.url must be a non-empty string'
    );
  });

  it('rejects mfes that is not an array', () => {
    const m = validManifest();
    (m as unknown as { mfes: unknown }).mfes = {};
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('boot manifest mfes must be an array (use [] for none)');
  });

  it('rejects an entry missing required fields', () => {
    const m = validManifest();
    m.mfes[0] = ({ id: 'inspector' } as unknown) as BootManifest['mfes'][number];
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'boot manifest mfes[0].remoteEntry must be a non-empty string'
    );
    expect(result.errors).toContain('boot manifest mfes[0].scope must be a non-empty string');
    expect(result.errors).toContain('boot manifest mfes[0].module must be a non-empty string');
    expect(result.errors).toContain('boot manifest mfes[0].version must be a non-empty string');
  });

  it('rejects an entry with a non-string id', () => {
    const m = validManifest();
    (m.mfes[0] as { id: unknown }).id = 42;
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('boot manifest mfes[0].id must be a non-empty string');
  });

  it('rejects duplicate ids', () => {
    const m = validManifest();
    m.mfes.push({ ...m.mfes[0] });
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('boot manifest mfes[1].id "inspector" is duplicated')
      )
    ).toBe(true);
  });

  it('rejects a non-string integrity when present', () => {
    const m = validManifest();
    (m.mfes[0] as { integrity: unknown }).integrity = 123;
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('integrity'))).toBe(true);
  });

  it('rejects a malformed compat block', () => {
    const m = validManifest();
    (m.mfes[0] as { compat: unknown }).compat = {};
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'boot manifest mfes[0].compat.minCoreVersion must be a non-empty string'
    );
    expect(result.errors).toContain(
      'boot manifest mfes[0].compat.compatibleCoreRange must be a non-empty string'
    );
  });
});

describe('boot manifest — assertValidBootManifest()', () => {
  it('returns the manifest when valid', () => {
    const m = validManifest();
    expect(assertValidBootManifest(m)).toBe(m);
  });

  it('throws listing the problems when invalid', () => {
    expect(() => assertValidBootManifest({ sharedDeps: {} })).toThrow(/Invalid MFE boot manifest/);
  });
});
