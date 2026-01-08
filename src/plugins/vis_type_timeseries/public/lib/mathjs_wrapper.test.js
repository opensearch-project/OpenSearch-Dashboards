/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { evaluate, configureMathJs, MATH_THROW_MSG } from './mathjs_wrapper';

describe('mathjs_wrapper', () => {
  describe('configureMathJs', () => {
    beforeEach(() => {
      // Reset configuration for each test
      configureMathJs();
    });

    test('should allow basic arithmetic operations', () => {
      expect(evaluate('2 + 3')).toBe(5);
      expect(evaluate('10 - 4')).toBe(6);
      expect(evaluate('3 * 4')).toBe(12);
      expect(evaluate('15 / 3')).toBe(5);
    });

    test('should allow mathematical functions', () => {
      expect(evaluate('abs(-5)')).toBe(5);
      expect(evaluate('round(3.7)')).toBe(4);
      expect(evaluate('ceil(3.2)')).toBe(4);
      expect(evaluate('floor(3.8)')).toBe(3);
    });

    test('should support params scope', () => {
      const result = evaluate('params.a + params.b', { params: { a: 10, b: 20 } });
      expect(result).toBe(30);
    });

    test('should support variable substitution', () => {
      const result = evaluate('x * 2', { x: 5 });
      expect(result).toBe(10);
    });

    test('should support divide function', () => {
      const result = evaluate('divide(10, 2)');
      expect(result).toBe(5);
    });

    test('should support multiply function', () => {
      const result = evaluate('multiply(3, 4)');
      expect(result).toBe(12);
    });

    test('should support add function', () => {
      const result = evaluate('add(5, 3)');
      expect(result).toBe(8);
    });

    test('should support subtract function', () => {
      const result = evaluate('subtract(10, 3)');
      expect(result).toBe(7);
    });

    test('should handle complex expressions', () => {
      const result = evaluate('(params.a + params.b) / params.c', {
        params: { a: 10, b: 20, c: 5 },
      });
      expect(result).toBe(6);
    });

    test('should allow accessing _all variable', () => {
      const result = evaluate('params._all.a', {
        params: { _all: { a: { values: [42, 43, 44], timestamps: [1000, 2000, 3000] } } },
      });
      expect(result).toEqual({ values: [42, 43, 44], timestamps: [1000, 2000, 3000] });
    });

    test('should allow accessing _index variable', () => {
      const result = evaluate('params._index', { params: { _index: 5 } });
      expect(result).toBe(5);
    });

    test('should allow accessing _timestamp variable', () => {
      const result = evaluate('params._timestamp', { params: { _timestamp: 1000 } });
      expect(result).toBe(1000);
    });

    test('should allow accessing _interval variable', () => {
      const result = evaluate('params._interval', { params: { _interval: 60000 } });
      expect(result).toBe(60000);
    });
  });

  describe('Security restrictions', () => {
    beforeEach(() => {
      configureMathJs();
    });

    test('should throw on import() function', () => {
      expect(() => {
        evaluate('import({ pi: 3.14 }, { override: true })');
      }).toThrow(MATH_THROW_MSG);
    });

    test('should throw on createUnit() function', () => {
      expect(() => {
        evaluate('createUnit("foo")');
      }).toThrow(MATH_THROW_MSG);
    });

    test('should throw on evaluate() function', () => {
      expect(() => {
        evaluate('evaluate("(2+3)/4")');
      }).toThrow(MATH_THROW_MSG);
    });

    test('should throw on parse() function', () => {
      expect(() => {
        evaluate('[h = parse("x^2 + x")]');
      }).toThrow(MATH_THROW_MSG);
    });

    test('should throw on simplify() function', () => {
      expect(() => {
        evaluate('simplify("2 * 1 * x ^ (2 - 1)")');
      }).toThrow(MATH_THROW_MSG);
    });

    test('should throw on derivative() function', () => {
      expect(() => {
        evaluate('derivative("x^2", "x")');
      }).toThrow(MATH_THROW_MSG);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      configureMathJs();
    });

    test('should throw on syntax errors', () => {
      expect(() => {
        evaluate('2 + (');
      }).toThrow();
    });

    test('should throw on accessing undefined nested properties', () => {
      expect(() => {
        evaluate('params.nonexistent.value', { params: {} });
      }).toThrow();
    });

    test('should throw on undefined functions', () => {
      expect(() => {
        evaluate('notExistingFn(5)');
      }).toThrow();
    });
  });

  describe('Configuration idempotency', () => {
    test('should not reconfigure if already configured', () => {
      configureMathJs();
      const result1 = evaluate('2 + 3');

      // Call configure again
      configureMathJs();
      const result2 = evaluate('2 + 3');

      expect(result1).toBe(result2);
      expect(result1).toBe(5);
    });
  });
});
