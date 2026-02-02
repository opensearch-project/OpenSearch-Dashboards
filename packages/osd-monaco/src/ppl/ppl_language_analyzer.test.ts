/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer, getPPLLanguageAnalyzer } from './ppl_language_analyzer';

describe('PPLLanguageAnalyzer', () => {
  let analyzer: PPLLanguageAnalyzer;

  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  describe('Tokenizer', () => {
    it('should tokenize simple search query', () => {
      const query = 'search source=logs';

      const result = analyzer.tokenize(query);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('search');
      expect(result[0].value).toBe('search');
    });

    it('should tokenize search with pipe query', () => {
      const query = 'search source=logs | head 10';

      const result = analyzer.tokenize(query);

      expect(result.length).toBeGreaterThan(2);
      expect(result.some((token) => token.type === 'search')).toBe(true);
      expect(result.some((token) => token.type === 'pipe')).toBe(true);
      expect(result.some((token) => token.type === 'head')).toBe(true);
    });

    it('should tokenize stats query', () => {
      const query = 'search source=nginx | stats count() by status';

      const result = analyzer.tokenize(query);

      expect(result.length).toBeGreaterThan(5);
      expect(result.some((token) => token.type === 'stats')).toBe(true);
      expect(result.some((token) => token.type === 'count')).toBe(true);
      expect(result.some((token) => token.type === 'by')).toBe(true);
    });

    it('should tokenize where clause query', () => {
      const query = 'search source=logs | where status=200';

      const result = analyzer.tokenize(query);

      expect(result.length).toBeGreaterThan(4);
      expect(result.some((token) => token.type === 'where')).toBe(true);
    });

    it('should handle empty query', () => {
      const query = '';

      const result = analyzer.tokenize(query);

      expect(result).toEqual([]);
    });

    it('should tokenize multiline query', () => {
      const query = `search source=logs
      | where status > 200
      | head 5`;

      const result = analyzer.tokenize(query);

      expect(result.length).toBeGreaterThan(6);
      expect(result.some((token) => token.line > 1)).toBe(true);
    });
  });

  describe('Validator', () => {
    it('should validate correct simple search query', () => {
      const query = 'search source=logs';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate correct search with head query', () => {
      const query = 'search source=logs | head 10';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate correct stats query', () => {
      const query = 'search source=nginx | stats count() by status';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate correct where query', () => {
      const query = 'search source=logs | where status=200 | head 5';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect syntax error in invalid command', () => {
      const query = 'search source=logs | invalid_command';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty('message');
      expect(result.errors[0]).toHaveProperty('line');
      expect(result.errors[0]).toHaveProperty('column');
    });

    it('should detect syntax error in incomplete query', () => {
      const query = 'search source=logs |';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect syntax error in malformed where clause', () => {
      const query = 'search source=logs | where';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect syntax error in malformed stats command', () => {
      const query = 'search source=logs | stats';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty query validation', () => {
      const query = '';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(true);
    });

    it('should detect multiple syntax errors', () => {
      const query = 'invalid_start | invalid_command | another_invalid';

      const result = analyzer.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Query Scenarios', () => {
    it('should handle complex aggregation query', () => {
      const query =
        'source=logs | stats avg(response_time) as avg_time, count() as total by status_code | sort - avg_time';

      const validationResult = analyzer.validate(query);
      const tokenResult = analyzer.tokenize(query);

      expect(tokenResult.length).toBeGreaterThan(10);
      expect(validationResult.isValid).toBe(true);
    });

    it('should handle query with multiple where conditions', () => {
      const query = 'search source=logs | where status > 200 and response_time < 1000 | head 20';

      const validationResult = analyzer.validate(query);
      const tokenResult = analyzer.tokenize(query);

      expect(tokenResult.length).toBeGreaterThan(8);
      expect(validationResult.isValid).toBe(true);
    });
  });
});

describe('getPPLLanguageAnalyzer singleton', () => {
  it('should return the same instance on multiple calls', () => {
    const instance1 = getPPLLanguageAnalyzer();
    const instance2 = getPPLLanguageAnalyzer();

    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(PPLLanguageAnalyzer);
  });

  it('should return valid analyzer instance', () => {
    const instance = getPPLLanguageAnalyzer();
    const query = 'search source=test';

    const result = instance.validate(query);

    expect(result.isValid).toBe(true);
  });
});
