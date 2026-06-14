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

import { SCHEMA_VERSION, validate, assertValidRegistry, Registry } from './schema';

/** A minimal, valid registry used as the base for mutation in tests. */
function validRegistry(): Registry {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: '2026-06-08T00:00:00.000Z',
    sharedDeps: {
      url: 'http://localhost:8080/shared-deps/',
      version: '3.5.0',
    },
    mfes: {
      inspector: {
        version: '3.5.0+abc123def456',
        remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
        scope: 'inspector',
        module: './public',
        integrity: 'sha384-deadbeef',
      },
    },
  };
}

describe('registry schema validate()', () => {
  it('accepts a well-formed registry', () => {
    const result = validate(validRegistry());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts an entry without the optional integrity field', () => {
    const registry = validRegistry();
    delete registry.mfes.inspector.integrity;
    expect(validate(registry).valid).toBe(true);
  });

  it.each([null, undefined, 42, 'nope', []])('rejects non-object input: %p', (input) => {
    const result = validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('registry must be an object');
  });

  it('rejects a wrong schemaVersion', () => {
    const registry = { ...validRegistry(), schemaVersion: 999 };
    const result = validate(registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('schemaVersion'))).toBe(true);
  });

  it('rejects a missing/unparseable generatedAt', () => {
    const bad = { ...validRegistry(), generatedAt: 'not-a-date' };
    const result = validate(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('generatedAt'))).toBe(true);
  });

  it('rejects a missing sharedDeps', () => {
    const registry = validRegistry();
    // Intentionally remove a required field to exercise the guard.
    const { sharedDeps, ...withoutShared } = registry;
    const result = validate(withoutShared);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('sharedDeps'))).toBe(true);
  });

  it('rejects an empty mfes map', () => {
    const registry = { ...validRegistry(), mfes: {} };
    const result = validate(registry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('mfes must contain at least one entry');
  });

  it('reports the specific field for an incomplete mfe entry', () => {
    const registry = validRegistry();
    // Remove required fields from the entry.
    registry.mfes.inspector = {
      version: '3.5.0+abc',
      // missing remoteEntry/scope/module
    } as Registry['mfes'][string];
    const result = validate(registry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('mfes.inspector.remoteEntry must be a non-empty string');
    expect(result.errors).toContain('mfes.inspector.scope must be a non-empty string');
    expect(result.errors).toContain('mfes.inspector.module must be a non-empty string');
  });

  it('rejects a non-string integrity when present', () => {
    const registry = validRegistry();
    (registry.mfes.inspector as { integrity: unknown }).integrity = 123;
    const result = validate(registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('integrity'))).toBe(true);
  });

  it('accepts an entry with a string minCoreVersion (compat seed)', () => {
    const registry = validRegistry();
    registry.mfes.inspector.minCoreVersion = '3.5.0';
    expect(validate(registry).valid).toBe(true);
  });

  it('accepts a null minCoreVersion (no constraint)', () => {
    const registry = validRegistry();
    registry.mfes.inspector.minCoreVersion = null;
    expect(validate(registry).valid).toBe(true);
  });

  it('accepts an entry without the optional minCoreVersion field', () => {
    const registry = validRegistry();
    delete registry.mfes.inspector.minCoreVersion;
    expect(validate(registry).valid).toBe(true);
  });

  it('rejects a non-string, non-null minCoreVersion when present', () => {
    const registry = validRegistry();
    (registry.mfes.inspector as { minCoreVersion: unknown }).minCoreVersion = 42;
    const result = validate(registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('minCoreVersion'))).toBe(true);
  });

  describe('Phase 9 builtAgainst + compat metadata', () => {
    it('accepts an entry with well-formed builtAgainst + compat', () => {
      const registry = validRegistry();
      registry.mfes.inspector.builtAgainst = {
        osdVersion: '3.5.0',
        sharedDeps: { react: '^16.14.0', 'react-dom': '^16.12.0' },
      };
      registry.mfes.inspector.compat = {
        minCoreVersion: '3.5.0',
        compatibleCoreRange: '3.5.x',
      };
      expect(validate(registry).valid).toBe(true);
    });

    it('accepts an entry without builtAgainst/compat (legacy/unknown)', () => {
      const registry = validRegistry();
      delete registry.mfes.inspector.builtAgainst;
      delete registry.mfes.inspector.compat;
      expect(validate(registry).valid).toBe(true);
    });

    it('accepts an empty builtAgainst.sharedDeps map', () => {
      const registry = validRegistry();
      registry.mfes.inspector.builtAgainst = { osdVersion: '3.5.0', sharedDeps: {} };
      expect(validate(registry).valid).toBe(true);
    });

    it('rejects builtAgainst without a string osdVersion', () => {
      const registry = validRegistry();
      registry.mfes.inspector.builtAgainst = {
        sharedDeps: {},
      } as Registry['mfes'][string]['builtAgainst'];
      const result = validate(registry);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'mfes.inspector.builtAgainst.osdVersion must be a non-empty string'
      );
    });

    it('rejects builtAgainst.sharedDeps with a non-string version', () => {
      const registry = validRegistry();
      registry.mfes.inspector.builtAgainst = {
        osdVersion: '3.5.0',
        sharedDeps: ({ react: 123 } as unknown) as Record<string, string>,
      };
      const result = validate(registry);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('builtAgainst.sharedDeps.react'))).toBe(true);
    });

    it('rejects a builtAgainst that is not an object', () => {
      const registry = validRegistry();
      (registry.mfes.inspector as { builtAgainst: unknown }).builtAgainst = 'nope';
      const result = validate(registry);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('builtAgainst, when present, must be an object'))
      ).toBe(true);
    });

    it('rejects compat missing minCoreVersion / compatibleCoreRange', () => {
      const registry = validRegistry();
      registry.mfes.inspector.compat = {} as Registry['mfes'][string]['compat'];
      const result = validate(registry);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'mfes.inspector.compat.minCoreVersion must be a non-empty string'
      );
      expect(result.errors).toContain(
        'mfes.inspector.compat.compatibleCoreRange must be a non-empty string'
      );
    });

    it('rejects a compat that is not an object', () => {
      const registry = validRegistry();
      (registry.mfes.inspector as { compat: unknown }).compat = 42;
      const result = validate(registry);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('compat, when present, must be an object'))).toBe(
        true
      );
    });
  });
});

describe('assertValidRegistry()', () => {
  it('returns the registry when valid', () => {
    const registry = validRegistry();
    expect(assertValidRegistry(registry)).toBe(registry);
  });

  it('throws listing the problems when invalid', () => {
    expect(() => assertValidRegistry({ schemaVersion: 1 })).toThrow(/Invalid MFE registry/);
  });
});
