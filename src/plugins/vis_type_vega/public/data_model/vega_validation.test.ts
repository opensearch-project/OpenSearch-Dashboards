/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateVegaExpression } from './vega_validation';

describe('validateVegaExpression', () => {
  describe('legitimate expressions', () => {
    it('allows basic data access expressions', () => {
      const spec = {
        signals: [{ name: 'tooltip', update: 'datum.x' }],
      };
      expect(validateVegaExpression(spec)).toHaveLength(0);
    });

    it('allows scale and signal references', () => {
      const spec = {
        marks: [{ encode: { update: { x: { signal: "scale('x', datum.value)" } } } }],
      };
      expect(validateVegaExpression(spec)).toHaveLength(0);
    });

    it('allows tree/hierarchy data fields', () => {
      const spec = {
        marks: [
          {
            encode: {
              update: {
                x: { signal: 'datum.children' },
                y: { signal: 'datum.parent' },
              },
            },
          },
        ],
      };
      expect(validateVegaExpression(spec)).toHaveLength(0);
    });

    it('allows conditional expressions', () => {
      const spec = {
        signals: [{ name: 'color', update: "datum.value > 0 ? 'green' : 'red'" }],
      };
      expect(validateVegaExpression(spec)).toHaveLength(0);
    });

    it('allows object literals with non-computed keys matching blocked names', () => {
      const spec = {
        signals: [{ name: 'config', update: '{constructor: 1, self: 2}' }],
      };
      expect(validateVegaExpression(spec)).toHaveLength(0);
    });

    it('allows array access with numeric index', () => {
      const spec = {
        signals: [{ name: 'item', update: 'data[0].value' }],
      };
      expect(validateVegaExpression(spec)).toHaveLength(0);
    });

    it('allows computed member access with simple identifiers', () => {
      const spec = {
        signals: [{ name: 'val', update: 'datum[field]' }],
      };
      expect(validateVegaExpression(spec)).toHaveLength(0);
    });
  });

  describe('blocked property access', () => {
    it('blocks ownerDocument access via dot notation', () => {
      const spec = {
        signals: [{ name: 'xss', update: 'el.ownerDocument' }],
      };
      const results = validateVegaExpression(spec);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].reason).toContain('ownerDocument');
    });

    it('blocks ownerDocument access via bracket notation', () => {
      const spec = {
        signals: [{ name: 'xss', update: "el['ownerDocument']" }],
      };
      const results = validateVegaExpression(spec);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].reason).toContain('ownerDocument');
    });

    it('blocks defaultView access', () => {
      const spec = {
        signals: [{ name: 'xss', update: "doc['defaultView']" }],
      };
      const results = validateVegaExpression(spec);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].reason).toContain('defaultView');
    });

    it('blocks constructor access', () => {
      const spec = {
        signals: [{ name: 'xss', update: 'datum.constructor.constructor("return this")()' }],
      };
      const results = validateVegaExpression(spec);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].reason).toContain('constructor');
    });

    it('blocks innerHTML access', () => {
      const spec = {
        marks: [{ encode: { update: { text: { signal: 'el.innerHTML' } } } }],
      };
      const results = validateVegaExpression(spec);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].reason).toContain('innerHTML');
    });

    it('blocks event.view access', () => {
      const spec = {
        signals: [{ name: 'xss', on: [{ events: 'click', update: 'event.view' }] }],
      };
      const results = validateVegaExpression(spec);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].reason).toContain('view');
    });
  });

  describe('blocked identifiers', () => {
    it('blocks window identifier', () => {
      const spec = {
        signals: [{ name: 'xss', update: 'window.location' }],
      };
      const results = validateVegaExpression(spec);
      expect(results.some((r) => r.reason.includes('window'))).toBe(true);
    });

    it('blocks document identifier', () => {
      const spec = {
        signals: [{ name: 'xss', update: 'document.cookie' }],
      };
      const results = validateVegaExpression(spec);
      expect(results.some((r) => r.reason.includes('document'))).toBe(true);
    });

    it('blocks globalThis identifier', () => {
      const spec = {
        signals: [{ name: 'xss', update: 'globalThis.fetch' }],
      };
      const results = validateVegaExpression(spec);
      expect(results.some((r) => r.reason.includes('globalThis'))).toBe(true);
    });
  });

  describe('blocked function calls', () => {
    it('blocks eval calls', () => {
      const spec = {
        signals: [{ name: 'xss', update: "eval('alert(1)')" }],
      };
      const results = validateVegaExpression(spec);
      expect(results.some((r) => r.reason.includes('eval'))).toBe(true);
    });

    it('blocks Function constructor calls', () => {
      const spec = {
        signals: [{ name: 'xss', update: "Function('return this')()" }],
      };
      const results = validateVegaExpression(spec);
      expect(results.some((r) => r.reason.includes('Function'))).toBe(true);
    });

    it('blocks setTimeout calls', () => {
      const spec = {
        signals: [{ name: 'xss', update: "setTimeout('alert(1)', 0)" }],
      };
      const results = validateVegaExpression(spec);
      expect(results.some((r) => r.reason.includes('setTimeout'))).toBe(true);
    });

    it('blocks method-style dangerous calls', () => {
      const spec = {
        signals: [{ name: 'xss', update: "obj.eval('code')" }],
      };
      const results = validateVegaExpression(spec);
      expect(results.some((r) => r.reason.includes('eval'))).toBe(true);
    });

    it('blocks atob calls used for obfuscation', () => {
      const spec = {
        signals: [{ name: 'xss', update: "atob('b3duZXJEb2N1bWVudA==')" }],
      };
      const results = validateVegaExpression(spec);
      expect(results.some((r) => r.reason.includes('atob'))).toBe(true);
    });
  });

  describe('dynamic computed property access', () => {
    it('blocks string concatenation in computed properties', () => {
      const spec = {
        signals: [{ name: 'xss', update: "el['owner' + 'Document']" }],
      };
      const results = validateVegaExpression(spec);
      expect(results.some((r) => r.reason.includes('dynamic computed property'))).toBe(true);
    });

    it('blocks function calls in computed properties', () => {
      const spec = {
        signals: [{ name: 'xss', update: "el[atob('b3duZXJEb2N1bWVudA==')]" }],
      };
      const results = validateVegaExpression(spec);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('spec traversal', () => {
    it('checks expressions in nested marks', () => {
      const spec = {
        marks: [
          {
            type: 'rect',
            encode: {
              enter: {
                x: { signal: 'el.ownerDocument' },
              },
            },
          },
        ],
      };
      const results = validateVegaExpression(spec);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].location).toContain('marks');
    });

    it('checks calculate transforms', () => {
      const spec = {
        data: [
          {
            name: 'source',
            transform: [{ type: 'formula', expr: 'window.location', as: 'url' }],
          },
        ],
      };
      const results = validateVegaExpression(spec);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty results for non-expression fields', () => {
      const spec = {
        description: 'window.document is fine in non-expression fields',
        title: 'eval(this) is also fine here',
      };
      expect(validateVegaExpression(spec)).toHaveLength(0);
    });

    it('handles malformed specs gracefully', () => {
      expect(validateVegaExpression(null as any)).toHaveLength(0);
      expect(validateVegaExpression(undefined as any)).toHaveLength(0);
      expect(validateVegaExpression({} as any)).toHaveLength(0);
    });
  });
});
