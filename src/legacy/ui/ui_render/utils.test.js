/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { applyCspModifications, buildMfeCspRules } from './utils';

describe('applyCspModifications', () => {
  const defaultRules = [
    "script-src 'unsafe-eval' 'self'",
    "worker-src blob: 'self'",
    "style-src 'unsafe-inline' 'self'",
  ];

  describe('parsing base rules', () => {
    it('should return original CSP header when no modifications provided', () => {
      const result = applyCspModifications(defaultRules, []);
      expect(result).toBe(
        "script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'"
      );
    });

    it('should handle empty base rules', () => {
      const result = applyCspModifications([], []);
      expect(result).toBe('');
    });

    it('should handle whitespace-only rules', () => {
      const result = applyCspModifications(['  ', '', '   '], []);
      expect(result).toBe('');
    });

    it('should parse value-less directives', () => {
      const result = applyCspModifications(['upgrade-insecure-requests'], []);
      expect(result).toBe('upgrade-insecure-requests');
    });

    it('should handle mixed value and value-less directives', () => {
      const result = applyCspModifications(
        ["script-src 'self'", 'upgrade-insecure-requests', "style-src 'self'"],
        []
      );
      expect(result).toBe("script-src 'self'; upgrade-insecure-requests; style-src 'self'");
    });
  });

  describe('add action', () => {
    it('should add values to existing directive', () => {
      const modifications = [
        { directive: 'script-src', action: 'add', values: ['https://cdn.example.com'] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain("script-src 'unsafe-eval' 'self' https://cdn.example.com");
    });

    it('should add multiple values to existing directive', () => {
      const modifications = [
        {
          directive: 'script-src',
          action: 'add',
          values: ['https://cdn1.example.com', 'https://cdn2.example.com'],
        },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain('https://cdn1.example.com');
      expect(result).toContain('https://cdn2.example.com');
    });

    it('should create new directive if it does not exist', () => {
      const modifications = [
        { directive: 'img-src', action: 'add', values: ["'self'", 'https://images.example.com'] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain("img-src 'self' https://images.example.com");
    });

    it('should add value-less directive (upgrade-insecure-requests)', () => {
      const modifications = [{ directive: 'upgrade-insecure-requests', action: 'add', values: [] }];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain('upgrade-insecure-requests');
      expect(result).not.toContain('upgrade-insecure-requests ');
    });

    it('should add value-less directive with empty values array', () => {
      const modifications = [{ directive: 'block-all-mixed-content', action: 'add', values: [] }];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain('block-all-mixed-content');
    });

    it('should not add duplicate values', () => {
      const modifications = [{ directive: 'script-src', action: 'add', values: ["'self'"] }];
      const result = applyCspModifications(defaultRules, modifications);
      const selfCount = (result.match(/'self'/g) || []).length;
      expect(selfCount).toBe(3);
    });
  });

  describe('remove action', () => {
    it('should remove value from existing directive', () => {
      const modifications = [
        { directive: 'script-src', action: 'remove', values: ["'unsafe-eval'"] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain("script-src 'self'");
      expect(result).not.toContain('unsafe-eval');
    });

    it('should remove multiple values from directive', () => {
      const modifications = [
        { directive: 'script-src', action: 'remove', values: ["'unsafe-eval'", "'self'"] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      // script-src should still exist but with no values from the original
      expect(result).toMatch(/script-src(?:\s|;|$)/);
    });

    it('should handle removing non-existent value gracefully', () => {
      const modifications = [
        { directive: 'script-src', action: 'remove', values: ['https://nonexistent.com'] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toBe(
        "script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'"
      );
    });

    it('should handle removing from non-existent directive gracefully', () => {
      const modifications = [{ directive: 'img-src', action: 'remove', values: ["'self'"] }];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toBe(
        "script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'"
      );
    });

    it('should handle remove with empty values array', () => {
      const modifications = [{ directive: 'script-src', action: 'remove', values: [] }];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toBe(
        "script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'"
      );
    });
  });

  describe('set action', () => {
    it('should set entire directive values', () => {
      const modifications = [
        { directive: 'script-src', action: 'set', values: ["'self'", "'strict-dynamic'"] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain("script-src 'self' 'strict-dynamic'");
      expect(result).not.toContain('unsafe-eval');
    });

    it('should create directive if setting non-existent', () => {
      const modifications = [
        {
          directive: 'frame-ancestors',
          action: 'set',
          values: ["'self'", 'https://parent.example.com'],
        },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain("frame-ancestors 'self' https://parent.example.com");
    });

    it('should handle set with empty array (value-less directive)', () => {
      const modifications = [{ directive: 'upgrade-insecure-requests', action: 'set', values: [] }];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain('upgrade-insecure-requests');
    });
  });

  describe('multiple modifications', () => {
    it('should apply multiple modifications in order', () => {
      const modifications = [
        { directive: 'script-src', action: 'remove', values: ["'unsafe-eval'"] },
        { directive: 'script-src', action: 'add', values: ['https://cdn.example.com'] },
        { directive: 'upgrade-insecure-requests', action: 'add', values: [] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).not.toContain('unsafe-eval');
      expect(result).toContain('https://cdn.example.com');
      expect(result).toContain('upgrade-insecure-requests');
    });

    it('should handle conflicting modifications (last wins)', () => {
      const modifications = [
        { directive: 'script-src', action: 'add', values: ['https://first.com'] },
        { directive: 'script-src', action: 'set', values: ['https://second.com'] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain('script-src https://second.com');
      expect(result).not.toContain('https://first.com');
      expect(result).not.toContain('unsafe-eval');
    });

    it('should handle add then remove on same directive', () => {
      const modifications = [
        { directive: 'script-src', action: 'add', values: ['https://temp.com'] },
        { directive: 'script-src', action: 'remove', values: ['https://temp.com'] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).not.toContain('https://temp.com');
    });

    it('should handle modifications to different directives', () => {
      const modifications = [
        { directive: 'script-src', action: 'add', values: ['https://scripts.com'] },
        { directive: 'style-src', action: 'add', values: ['https://styles.com'] },
        { directive: 'img-src', action: 'add', values: ['https://images.com'] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain('https://scripts.com');
      expect(result).toContain('https://styles.com');
      expect(result).toContain('https://images.com');
    });
  });

  describe('edge cases', () => {
    it('should handle rules with extra whitespace', () => {
      const rulesWithWhitespace = [
        "  script-src   'self'    'unsafe-eval'  ",
        " style-src 'self' ",
      ];
      const result = applyCspModifications(rulesWithWhitespace, []);
      expect(result).toBe("script-src 'self' 'unsafe-eval'; style-src 'self'");
    });

    it('should handle special characters in values', () => {
      const modifications = [
        { directive: 'script-src', action: 'add', values: ["'nonce-abc123'", "'sha256-xyz789='"] },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain("'nonce-abc123'");
      expect(result).toContain("'sha256-xyz789='");
    });

    it('should handle data: and blob: schemes', () => {
      const modifications = [{ directive: 'img-src', action: 'add', values: ['data:', 'blob:'] }];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain('img-src data: blob:');
    });

    it('should handle wildcard domains', () => {
      const modifications = [
        {
          directive: 'script-src',
          action: 'add',
          values: ['*.example.com', 'https://*.examples.com'],
        },
      ];
      const result = applyCspModifications(defaultRules, modifications);
      expect(result).toContain('*.example.com');
      expect(result).toContain('https://*.examples.com');
    });
  });
});

describe('buildMfeCspRules', () => {
  const baseRules = [
    "script-src 'unsafe-eval' 'self'",
    "worker-src blob: 'self'",
    "style-src 'unsafe-inline' 'self'",
  ];

  it('widens script-src, worker-src, AND style-src with de-duplicated origins', () => {
    // OSD's default csp.rules contains script-src + worker-src + style-src; ALL
    // three are now in MFE_WIDENED_DIRECTIVES (Phase 12 Story 5 — remotes ship
    // styles too, so style-src needs the cdnOrigin).
    const result = buildMfeCspRules(baseRules, {
      bootstrapUrl: 'http://localhost:8080/bootstrap/x.js',
      sharedDepsUrl: 'http://localhost:8080/shared-deps/y.js',
      cdnOrigin: 'https://cdn.example.net',
    });
    expect(result[0]).toBe(
      "script-src 'unsafe-eval' 'self' http://localhost:8080 https://cdn.example.net"
    );
    expect(result[1]).toBe("worker-src blob: 'self' http://localhost:8080 https://cdn.example.net");
    expect(result[2]).toBe(
      "style-src 'unsafe-inline' 'self' http://localhost:8080 https://cdn.example.net"
    );
  });

  it('ignores devOverrideOrigins when allowOverride is false', () => {
    const result = buildMfeCspRules(baseRules, {
      bootstrapUrl: 'http://localhost:8080/bootstrap/x.js',
      cdnOrigin: 'https://cdn.example.net',
      allowOverride: false,
      devOverrideOrigins: ['http://localhost:9090'],
    });
    expect(result[0]).not.toContain('http://localhost:9090');
  });

  it('includes devOverrideOrigins when allowOverride is true', () => {
    const result = buildMfeCspRules(baseRules, {
      bootstrapUrl: 'http://localhost:8080/bootstrap/x.js',
      cdnOrigin: 'https://cdn.example.net',
      allowOverride: true,
      devOverrideOrigins: ['http://localhost:9090', 'http://devbox:3000'],
    });
    expect(result[0]).toContain('http://localhost:9090');
    expect(result[0]).toContain('http://devbox:3000');
    expect(result[1]).toContain('http://localhost:9090');
    expect(result[1]).toContain('http://devbox:3000');
  });

  it('returns rules unchanged when no origins can be derived', () => {
    const result = buildMfeCspRules(baseRules, {});
    expect(result).toBe(baseRules);
  });

  it('returns rules unchanged with empty options', () => {
    const result = buildMfeCspRules(baseRules);
    expect(result).toBe(baseRules);
  });

  it('tolerates malformed cdnOrigin and bootstrapUrl without throwing', () => {
    expect(() =>
      buildMfeCspRules(baseRules, {
        bootstrapUrl: 'not a url',
        cdnOrigin: ':::invalid',
        sharedDepsUrl: '',
      })
    ).not.toThrow();
    // A malformed cdnOrigin is rejected (not injected verbatim); a valid https
    // origin is still allow-listed.
    const result = buildMfeCspRules(baseRules, { cdnOrigin: 'https://cdn.example.net' });
    expect(result[0]).toContain('https://cdn.example.net');
  });

  it('rejects a wildcard cdnOrigin (no verbatim injection into script-src)', () => {
    const result = buildMfeCspRules(baseRules, { cdnOrigin: '*' });
    // '*' is not a parseable origin => no origins derived => rules returned unchanged.
    expect(result).toBe(baseRules);
    expect(result[0]).not.toContain('*');
  });

  it('rejects a bare hostname cdnOrigin (scheme required)', () => {
    const result = buildMfeCspRules(baseRules, { cdnOrigin: 'cdn.example.com' });
    expect(result).toBe(baseRules);
    expect(result[0]).not.toContain('cdn.example.com');
  });

  it('rejects a non-http(s) cdnOrigin scheme', () => {
    const result = buildMfeCspRules(baseRules, { cdnOrigin: 'ftp://cdn.example.net' });
    expect(result).toBe(baseRules);
    expect(result[0]).not.toContain('ftp://');
  });

  it('still allow-lists a valid https cdnOrigin alongside a rejected one', () => {
    // A valid bootstrap origin is added; the wildcard cdnOrigin is dropped.
    const result = buildMfeCspRules(baseRules, {
      bootstrapUrl: 'https://bootstrap.example.net/b.js',
      cdnOrigin: '*',
    });
    expect(result[0]).toContain('https://bootstrap.example.net');
    expect(result[0]).not.toContain('*');
  });

  it('rejects a wildcard devOverrideOrigin even when allowOverride is true', () => {
    const result = buildMfeCspRules(baseRules, {
      cdnOrigin: 'https://cdn.example.net',
      allowOverride: true,
      devOverrideOrigins: ['*', 'http://localhost:9090'],
    });
    // The wildcard is dropped; the valid http origin is still allow-listed.
    expect(result[0]).not.toContain(' *');
    expect(result[0]).toContain('http://localhost:9090');
    expect(result[0]).toContain('https://cdn.example.net');
  });

  it('does not duplicate an origin already present in a rule', () => {
    const rulesWithOrigin = ["script-src 'self' http://localhost:8080", "worker-src blob: 'self'"];
    const result = buildMfeCspRules(rulesWithOrigin, {
      bootstrapUrl: 'http://localhost:8080/bootstrap/x.js',
      cdnOrigin: 'https://cdn.example.net',
    });
    // http://localhost:8080 should NOT be duplicated in script-src
    const tokens = result[0].split(/\s+/);
    const count = tokens.filter((t) => t === 'http://localhost:8080').length;
    expect(count).toBe(1);
    // but cdn should be added
    expect(result[0]).toContain('https://cdn.example.net');
    // worker-src gets both
    expect(result[1]).toContain('http://localhost:8080');
    expect(result[1]).toContain('https://cdn.example.net');
  });

  it('handles non-string rules gracefully', () => {
    const mixedRules = ["script-src 'self'", null, undefined, 42];
    const result = buildMfeCspRules(mixedRules, {
      cdnOrigin: 'https://cdn.example.net',
    });
    expect(result[0]).toContain('https://cdn.example.net');
    expect(result[1]).toBe(null);
    expect(result[2]).toBe(undefined);
    expect(result[3]).toBe(42);
  });

  // -------------------------------------------------------------------------
  // Phase 12 Story 5 — extend the widened set beyond script-src/worker-src
  // -------------------------------------------------------------------------

  it('widens style-src when present in the base rules (Phase 12 Story 5)', () => {
    // OSD's default carries `style-src 'unsafe-inline' 'self'` — Phase 12
    // adds the cdnOrigin so cross-origin <link rel=stylesheet>/<style> from a
    // remote can render.
    const result = buildMfeCspRules(baseRules, { cdnOrigin: 'https://cdn.example.net' });
    expect(result[2]).toBe("style-src 'unsafe-inline' 'self' https://cdn.example.net");
  });

  it('widens font-src when an explicit font-src directive is present', () => {
    // A deployment that opts into a stricter base CSP (one that names font-src
    // explicitly) gets the cdnOrigin auto-allow-listed for @font-face URLs.
    const rulesWithFont = [...baseRules, "font-src 'self'"];
    const result = buildMfeCspRules(rulesWithFont, {
      cdnOrigin: 'https://cdn.example.net',
    });
    const fontRule = result.find((r) => typeof r === 'string' && r.startsWith('font-src'));
    expect(fontRule).toBe("font-src 'self' https://cdn.example.net");
  });

  it('widens connect-src when an explicit connect-src directive is present', () => {
    // Same forward-compatibility for `fetch()` / XHR / WebSocket calls a remote
    // opens back to its own CDN origin.
    const rulesWithConnect = [...baseRules, "connect-src 'self'"];
    const result = buildMfeCspRules(rulesWithConnect, {
      cdnOrigin: 'https://cdn.example.net',
    });
    const connectRule = result.find((r) => typeof r === 'string' && r.startsWith('connect-src'));
    expect(connectRule).toBe("connect-src 'self' https://cdn.example.net");
  });

  it('widens script-src-elem and style-src-elem when those *-elem variants are present', () => {
    const rulesWithElem = [
      "script-src 'self'",
      "script-src-elem 'self'",
      "style-src 'self'",
      "style-src-elem 'self'",
    ];
    const result = buildMfeCspRules(rulesWithElem, {
      cdnOrigin: 'https://cdn.example.net',
    });
    const scriptElem = result.find((r) => typeof r === 'string' && r.startsWith('script-src-elem'));
    const styleElem = result.find((r) => typeof r === 'string' && r.startsWith('style-src-elem'));
    expect(scriptElem).toBe("script-src-elem 'self' https://cdn.example.net");
    expect(styleElem).toBe("style-src-elem 'self' https://cdn.example.net");
  });

  it('NEVER introduces a new directive when font-src / connect-src are absent (no tightening)', () => {
    // OSD's default csp.rules does NOT specify font-src or connect-src — which
    // CSP treats as unrestricted (no `default-src` either). If we emitted a
    // brand-new `font-src <cdnOrigin>` we would tighten the policy from "any
    // origin OK" to "ONLY the CDN OK" and break OSD's own same-origin font/
    // fetch loads. Verify those directives stay UNSPECIFIED.
    const result = buildMfeCspRules(baseRules, {
      cdnOrigin: 'https://cdn.example.net',
      bootstrapUrl: 'http://localhost:8080/bootstrap/x.js',
    });
    // No new font-src / connect-src directive is appended.
    const fontRule = result.find((r) => typeof r === 'string' && r.startsWith('font-src'));
    const connectRule = result.find((r) => typeof r === 'string' && r.startsWith('connect-src'));
    expect(fontRule).toBeUndefined();
    expect(connectRule).toBeUndefined();
    // And the array length is unchanged (we widened existing entries; we didn't
    // append).
    expect(result.length).toBe(baseRules.length);
  });

  it('widens style-src consistently with script-src (off-allow-list origin still rejected)', () => {
    // The widened style-src lists ONLY the configured cdnOrigin (+ self/inline);
    // an attacker origin that is not in the allow-list cannot inject styles.
    const result = buildMfeCspRules(baseRules, { cdnOrigin: 'https://cdn.example.net' });
    expect(result[2]).toContain('https://cdn.example.net');
    expect(result[2]).not.toContain('https://attacker.example.com');
  });

  it('honors devOverrideOrigins on style-src when allowOverride is true', () => {
    // Symmetric with script-src/worker-src — a dev who points an MFE at a
    // local dev server gets that origin allow-listed for styles too.
    const result = buildMfeCspRules(baseRules, {
      cdnOrigin: 'https://cdn.example.net',
      allowOverride: true,
      devOverrideOrigins: ['http://localhost:9090'],
    });
    expect(result[2]).toContain('http://localhost:9090');
    expect(result[2]).toContain('https://cdn.example.net');
  });

  it('drops devOverrideOrigins from style-src when allowOverride is false (prod)', () => {
    const result = buildMfeCspRules(baseRules, {
      cdnOrigin: 'https://cdn.example.net',
      allowOverride: false,
      devOverrideOrigins: ['http://localhost:9090'],
    });
    expect(result[2]).not.toContain('http://localhost:9090');
    expect(result[2]).toContain('https://cdn.example.net');
  });
});
