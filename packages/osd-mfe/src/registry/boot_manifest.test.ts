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

  it('accepts an entry with a well-formed compat block (compat carry-forward)', () => {
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

describe('boot manifest — validateBootManifest() global asset roots: acceptance', () => {
  it('accepts a manifest with all four global asset roots present', () => {
    const m = validManifest();
    m.core = {
      url: 'https://cdn.example.com/mfe/core/abc123/core.entry.js',
      integrity: 'sha384-coreabc123',
      version: '3.5.0+core00000000',
    };
    m.orchestrator = {
      url: 'https://cdn.example.com/mfe/orchestrator/def456/osd_bootstrap_mfe.js',
      integrity: 'sha384-orcdef456',
      version: '3.5.0+orc00000000',
    };
    m.sharedDepsCss = {
      url: 'https://cdn.example.com/mfe/shared-deps-css/ghi789/osd-ui-shared-deps.css',
      integrity: 'sha384-sdcghi789',
      version: '3.5.0+sdc00000000',
    };
    m.themes = {
      light: {
        url: 'https://cdn.example.com/mfe/themes/light/jkl012/light_theme.css',
        integrity: 'sha384-lightjkl012',
        version: '3.5.0+lgt00000000',
      },
      dark: {
        url: 'https://cdn.example.com/mfe/themes/dark/mno345/dark_theme.css',
        integrity: 'sha384-darkmno345',
        version: '3.5.0+drk00000000',
      },
    };
    expect(validateBootManifest(m)).toEqual({ valid: true, errors: [] });
  });

  it('accepts a manifest with all four global asset roots ABSENT (legacy fallback path)', () => {
    const m = validManifest();
    delete m.core;
    delete m.orchestrator;
    delete m.sharedDepsCss;
    delete m.themes;
    expect(validateBootManifest(m).valid).toBe(true);
  });

  it.each(['core', 'orchestrator', 'sharedDepsCss'] as const)(
    'accepts %s without optional integrity (same-origin /bundles/ fallback path)',
    (field) => {
      const m = validManifest();
      m[field] = {
        url: 'https://cdn.example.com/whatever.js',
        version: '3.5.0+plain000000',
      };
      expect(validateBootManifest(m).valid).toBe(true);
    }
  );

  it('accepts a themes entry without optional integrity', () => {
    const m = validManifest();
    m.themes = {
      light: {
        url: 'https://cdn.example.com/light.css',
        version: '3.5.0+lgt00000000',
      },
    };
    expect(validateBootManifest(m).valid).toBe(true);
  });

  it('accepts an empty themes map (degenerate case — no per-theme overrides)', () => {
    const m = validManifest();
    m.themes = {};
    expect(validateBootManifest(m).valid).toBe(true);
  });
});

describe('boot manifest — validateBootManifest() global asset roots: rejection', () => {
  it.each(['core', 'orchestrator', 'sharedDepsCss'] as const)(
    'rejects %s when not an object',
    (field) => {
      const m = validManifest();
      (m as unknown as Record<string, unknown>)[field] = 'https://cdn.example.com/x.js';
      const result = validateBootManifest(m);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `boot manifest ${field} must be an object with { url, version, integrity? }`
      );
    }
  );

  it.each(['core', 'orchestrator', 'sharedDepsCss'] as const)(
    'rejects %s with empty url',
    (field) => {
      const m = validManifest();
      m[field] = { url: '', version: '3.5.0+plain000000' };
      const result = validateBootManifest(m);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`boot manifest ${field}.url must be a non-empty string`);
    }
  );

  it.each(['core', 'orchestrator', 'sharedDepsCss'] as const)(
    'rejects %s with empty version',
    (field) => {
      const m = validManifest();
      m[field] = { url: 'https://cdn.example.com/x.js', version: '' };
      const result = validateBootManifest(m);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `boot manifest ${field}.version must be a non-empty string`
      );
    }
  );

  it.each(['core', 'orchestrator', 'sharedDepsCss'] as const)(
    'rejects %s integrity that is non-string',
    (field) => {
      const m = validManifest();
      m[field] = ({
        url: 'https://cdn.example.com/x.js',
        version: '3.5.0+plain000000',
        integrity: 123,
      } as unknown) as BootManifest[typeof field];
      const result = validateBootManifest(m);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes(`${field}.integrity`))).toBe(true);
    }
  );

  it.each(['core', 'orchestrator', 'sharedDepsCss'] as const)(
    'rejects %s integrity without the sha384- prefix',
    (field) => {
      const m = validManifest();
      m[field] = {
        url: 'https://cdn.example.com/x.js',
        version: '3.5.0+plain000000',
        integrity: 'sha256-wrongalgo',
      };
      const result = validateBootManifest(m);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(
          (e) => e.includes(`${field}.integrity`) && e.includes('sha384-')
        )
      ).toBe(true);
    }
  );

  it('rejects themes when not an object', () => {
    const m = validManifest();
    (m as unknown as Record<string, unknown>).themes = ['light', 'dark'];
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'boot manifest themes, when present, must be an object keyed by theme name'
    );
  });

  it('rejects a themes entry that is not an object', () => {
    const m = validManifest();
    (m as { themes: unknown }).themes = { light: 'https://cdn.example.com/light.css' };
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'boot manifest themes.light must be an object with { url, version, integrity? }'
    );
  });

  it('rejects a themes entry with malformed integrity', () => {
    const m = validManifest();
    m.themes = {
      light: {
        url: 'https://cdn.example.com/light.css',
        version: '3.5.0+lgt00000000',
        integrity: 'md5-wrongalgo',
      },
    };
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.includes('themes.light.integrity') && e.includes('sha384-')
      )
    ).toBe(true);
  });

  it('rejects a themes entry with empty url', () => {
    const m = validManifest();
    m.themes = {
      light: { url: '', version: '3.5.0+lgt00000000' },
    };
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'boot manifest themes.light.url must be a non-empty string'
    );
  });

  it('rejects a themes entry with empty version', () => {
    const m = validManifest();
    m.themes = {
      light: { url: 'https://cdn.example.com/light.css', version: '' },
    };
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'boot manifest themes.light.version must be a non-empty string'
    );
  });

  it('rejects a themes map with an empty theme name', () => {
    const m = validManifest();
    m.themes = {
      '': {
        url: 'https://cdn.example.com/whatever.css',
        version: '3.5.0+nul00000000',
      },
    };
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'boot manifest themes contains an empty theme name (keys must be non-empty)'
    );
  });

  it('aggregates problems across MULTIPLE global asset roots in a single pass', () => {
    const m = validManifest();
    m.core = { url: '', version: '3.5.0+core00000000' };
    m.orchestrator = ({
      url: 'https://cdn.example.com/orc.js',
      version: '3.5.0+orc00000000',
      integrity: 'sha256-wrong',
    } as unknown) as BootManifest['orchestrator'];
    m.themes = {
      dark: { url: 'https://cdn.example.com/dark.css', version: '' },
    };
    const result = validateBootManifest(m);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('boot manifest core.url must be a non-empty string');
    expect(
      result.errors.some(
        (e) => e.includes('orchestrator.integrity') && e.includes('sha384-')
      )
    ).toBe(true);
    expect(result.errors).toContain(
      'boot manifest themes.dark.version must be a non-empty string'
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
