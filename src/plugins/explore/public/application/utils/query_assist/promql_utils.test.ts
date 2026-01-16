/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractQueryFromText, validateToolArgs } from './promql_utils';

describe('promql_utils', () => {
  describe('extractQueryFromText', () => {
    describe('code block extraction', () => {
      it('should extract query from promql code block', () => {
        const text = '```promql\nrate(http_requests_total[5m])\n```';
        expect(extractQueryFromText(text)).toBe('rate(http_requests_total[5m])');
      });

      it('should extract query from generic code block', () => {
        const text = '```\nsum(rate(http_requests_total[5m]))\n```';
        expect(extractQueryFromText(text)).toBe('sum(rate(http_requests_total[5m]))');
      });

      it('should trim whitespace from extracted query', () => {
        const text = '```promql\n  rate(metric[5m])  \n```';
        expect(extractQueryFromText(text)).toBe('rate(metric[5m])');
      });

      it('should handle code block with surrounding text', () => {
        const text =
          'Here is your query:\n```promql\nhistogram_quantile(0.95, rate(http_request_duration[5m]))\n```\nThis calculates the 95th percentile.';
        expect(extractQueryFromText(text)).toBe(
          'histogram_quantile(0.95, rate(http_request_duration[5m]))'
        );
      });

      it('should extract multiple queries separated by semicolon and newline', () => {
        const text = '```\nrate(http_requests_total[5m]);\nsum(up)\n```';
        expect(extractQueryFromText(text)).toBe('rate(http_requests_total[5m]);\nsum(up)');
      });
    });

    describe('edge cases', () => {
      it('should return undefined for empty string', () => {
        expect(extractQueryFromText('')).toBeUndefined();
      });

      it('should return undefined for undefined input', () => {
        expect(extractQueryFromText(undefined as any)).toBeUndefined();
      });

      it('should return undefined for plain text without code block', () => {
        const text = 'This is just some plain text without any queries.';
        expect(extractQueryFromText(text)).toBeUndefined();
      });

      it('should return undefined for empty code block', () => {
        const text = '```promql\n\n```';
        expect(extractQueryFromText(text)).toBeUndefined();
      });

      it('should return undefined for text without code block', () => {
        const text = 'rate(http_requests_total[5m])';
        expect(extractQueryFromText(text)).toBeUndefined();
      });
    });
  });

  describe('validateToolArgs', () => {
    describe('string length validation', () => {
      it('should return undefined for valid string length', () => {
        const args = { query: 'short string' };
        expect(validateToolArgs('search_prometheus_metadata', args)).toBeUndefined();
      });

      it('should return error for string exceeding max length', () => {
        const args = { query: 'a'.repeat(1001) };
        const result = validateToolArgs('search_prometheus_metadata', args);
        expect(result).toContain('exceeds maximum length');
        expect(result).toContain('query');
      });

      it('should validate all string arguments', () => {
        const args = { arg1: 'short', arg2: 'b'.repeat(1001) };
        const result = validateToolArgs('search_prometheus_metadata', args);
        expect(result).toContain('arg2');
      });
    });

    describe('search_prometheus_metadata validation', () => {
      it('should accept valid limit', () => {
        expect(validateToolArgs('search_prometheus_metadata', { limit: 50 })).toBeUndefined();
      });

      it('should accept limit at minimum boundary', () => {
        expect(validateToolArgs('search_prometheus_metadata', { limit: 1 })).toBeUndefined();
      });

      it('should accept limit at maximum boundary', () => {
        expect(validateToolArgs('search_prometheus_metadata', { limit: 1000 })).toBeUndefined();
      });

      it('should reject limit below minimum', () => {
        const result = validateToolArgs('search_prometheus_metadata', { limit: 0 });
        expect(result).toContain('Limit must be a number between 1 and 1000');
      });

      it('should reject limit above maximum', () => {
        const result = validateToolArgs('search_prometheus_metadata', { limit: 1001 });
        expect(result).toContain('Limit must be a number between 1 and 1000');
      });

      it('should reject non-numeric limit', () => {
        const result = validateToolArgs('search_prometheus_metadata', { limit: 'invalid' });
        expect(result).toContain('Limit must be a number between 1 and 1000');
      });

      it('should accept missing limit (optional)', () => {
        expect(validateToolArgs('search_prometheus_metadata', {})).toBeUndefined();
      });

      it('should accept query parameter', () => {
        expect(
          validateToolArgs('search_prometheus_metadata', { query: 'cpu', limit: 20 })
        ).toBeUndefined();
      });
    });

    describe('unknown tool names', () => {
      it('should pass validation for unknown tool names', () => {
        expect(validateToolArgs('unknown_tool', { anyArg: 'value' })).toBeUndefined();
      });
    });
  });
});
