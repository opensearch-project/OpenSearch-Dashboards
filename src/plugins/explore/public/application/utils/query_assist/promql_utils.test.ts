/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractQueryFromText, validateToolArgs } from './promql_utils';
import { PromQLToolName } from './promql_tools';

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
        expect(validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, args)).toBeUndefined();
      });

      it('should return error for string exceeding max length', () => {
        const args = { query: 'a'.repeat(1001) };
        const result = validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, args);
        expect(result).toContain('exceeds maximum length');
        expect(result).toContain('query');
      });

      it('should validate all string arguments', () => {
        const args = { arg1: 'short', arg2: 'b'.repeat(1001) };
        const result = validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, args);
        expect(result).toContain('arg2');
      });
    });

    describe('search_prometheus_metadata validation', () => {
      it('should accept valid metricsLimit', () => {
        expect(
          validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, { metricsLimit: 50 })
        ).toBeUndefined();
      });

      it('should accept limit at minimum boundary', () => {
        expect(
          validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, { metricsLimit: 1 })
        ).toBeUndefined();
      });

      it('should accept limit at maximum boundary', () => {
        expect(
          validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, { labelsLimit: 1000 })
        ).toBeUndefined();
      });

      it('should reject metricsLimit below minimum', () => {
        const result = validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, {
          metricsLimit: 0,
        });
        expect(result).toContain('metricsLimit must be a number between 1 and 1000');
      });

      it('should reject labelsLimit above maximum', () => {
        const result = validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, {
          labelsLimit: 1001,
        });
        expect(result).toContain('labelsLimit must be a number between 1 and 1000');
      });

      it('should reject non-numeric valuesLimit', () => {
        const result = validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, {
          valuesLimit: 'invalid',
        });
        expect(result).toContain('valuesLimit must be a number between 1 and 1000');
      });

      it('should accept missing limits (optional)', () => {
        expect(validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, {})).toBeUndefined();
      });

      it('should accept query parameter with valid limits', () => {
        expect(
          validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, {
            query: 'cpu',
            metricsLimit: 20,
            labelsLimit: 10,
            valuesLimit: 5,
          })
        ).toBeUndefined();
      });

      it('should validate all limit arguments', () => {
        expect(
          validateToolArgs(PromQLToolName.SEARCH_PROMETHEUS_METADATA, {
            metricsLimit: 50,
            labelsLimit: 100,
            valuesLimit: 10,
          })
        ).toBeUndefined();
      });
    });
  });
});
