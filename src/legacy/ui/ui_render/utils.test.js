/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { applyCspModifications } from './utils';

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
