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
    });

    describe('inline code extraction', () => {
      it('should extract query from inline code with valid PromQL', () => {
        const text = 'You can use `sum by (job) (http_requests_total)` for this.';
        expect(extractQueryFromText(text)).toBe('sum by (job) (http_requests_total)');
      });

      it('should not extract non-PromQL inline code', () => {
        const text = 'The variable is called `myVariable`.';
        expect(extractQueryFromText(text)).toBeUndefined();
      });
    });

    describe('raw text extraction', () => {
      it('should extract raw PromQL query with function', () => {
        const text = 'rate(my_metric[5m])';
        expect(extractQueryFromText(text)).toBe('rate(my_metric[5m])');
      });

      it('should extract raw PromQL query with label selector', () => {
        const text = 'http_requests_total{job="api"}';
        expect(extractQueryFromText(text)).toBe('http_requests_total{job="api"}');
      });

      it('should extract raw PromQL query with aggregation', () => {
        const text = 'sum by (instance) (node_cpu_seconds_total)';
        expect(extractQueryFromText(text)).toBe('sum by (instance) (node_cpu_seconds_total)');
      });

      it('should extract first line only from multiline raw text', () => {
        const text = 'rate(http_requests_total[5m])\nsome explanation';
        expect(extractQueryFromText(text)).toBe('rate(http_requests_total[5m])');
      });
    });

    describe('edge cases', () => {
      it('should return undefined for empty string', () => {
        expect(extractQueryFromText('')).toBeUndefined();
      });

      it('should return undefined for undefined input', () => {
        expect(extractQueryFromText(undefined as any)).toBeUndefined();
      });

      it('should return undefined for plain text without PromQL', () => {
        const text = 'This is just some plain text without any queries.';
        expect(extractQueryFromText(text)).toBeUndefined();
      });

      it('should return undefined for empty code block', () => {
        const text = '```promql\n\n```';
        expect(extractQueryFromText(text)).toBeUndefined();
      });

      it('should return undefined for text that is too long', () => {
        const longText = 'a'.repeat(600);
        expect(extractQueryFromText(longText)).toBeUndefined();
      });

      it('should return undefined for text not starting with letter or underscore', () => {
        const text = '123_metric{label="value"}';
        expect(extractQueryFromText(text)).toBeUndefined();
      });
    });

    describe('PromQL pattern detection', () => {
      it('should detect rate function', () => {
        expect(extractQueryFromText('rate(metric[5m])')).toBe('rate(metric[5m])');
      });

      it('should detect sum function', () => {
        expect(extractQueryFromText('sum(metric)')).toBe('sum(metric)');
      });

      it('should detect histogram_quantile function', () => {
        expect(extractQueryFromText('histogram_quantile(0.9, metric)')).toBe(
          'histogram_quantile(0.9, metric)'
        );
      });

      it('should detect irate function', () => {
        expect(extractQueryFromText('irate(metric[5m])')).toBe('irate(metric[5m])');
      });

      it('should detect by aggregation', () => {
        expect(extractQueryFromText('sum by (label) (metric)')).toBe('sum by (label) (metric)');
      });

      it('should detect without aggregation', () => {
        expect(extractQueryFromText('avg without (instance) (metric)')).toBe(
          'avg without (instance) (metric)'
        );
      });

      it('should detect label selector', () => {
        expect(extractQueryFromText('metric{job="prometheus"}')).toBe('metric{job="prometheus"}');
      });

      it('should detect range selector', () => {
        expect(extractQueryFromText('metric[5m]')).toBe('metric[5m]');
      });
    });
  });

  describe('validateToolArgs', () => {
    describe('string length validation', () => {
      it('should return undefined for valid string length', () => {
        const args = { query: 'short string' };
        expect(validateToolArgs('search_metrics', args)).toBeUndefined();
      });

      it('should return error for string exceeding max length', () => {
        const args = { query: 'a'.repeat(1001) };
        const result = validateToolArgs('search_metrics', args);
        expect(result).toContain('exceeds maximum length');
        expect(result).toContain('query');
      });

      it('should validate all string arguments', () => {
        const args = { arg1: 'short', arg2: 'b'.repeat(1001) };
        const result = validateToolArgs('search_metrics', args);
        expect(result).toContain('arg2');
      });
    });

    describe('search_metrics validation', () => {
      it('should accept valid limit', () => {
        expect(validateToolArgs('search_metrics', { limit: 50 })).toBeUndefined();
      });

      it('should accept limit at minimum boundary', () => {
        expect(validateToolArgs('search_metrics', { limit: 1 })).toBeUndefined();
      });

      it('should accept limit at maximum boundary', () => {
        expect(validateToolArgs('search_metrics', { limit: 1000 })).toBeUndefined();
      });

      it('should reject limit below minimum', () => {
        const result = validateToolArgs('search_metrics', { limit: 0 });
        expect(result).toContain('Limit must be a number between 1 and 1000');
      });

      it('should reject limit above maximum', () => {
        const result = validateToolArgs('search_metrics', { limit: 1001 });
        expect(result).toContain('Limit must be a number between 1 and 1000');
      });

      it('should reject non-numeric limit', () => {
        const result = validateToolArgs('search_metrics', { limit: 'invalid' });
        expect(result).toContain('Limit must be a number between 1 and 1000');
      });

      it('should accept missing limit (optional)', () => {
        expect(validateToolArgs('search_metrics', {})).toBeUndefined();
      });
    });

    describe('search_labels validation', () => {
      it('should accept valid search_labels args', () => {
        expect(validateToolArgs('search_labels', { metric: 'http_requests' })).toBeUndefined();
      });

      it('should accept empty args for search_labels', () => {
        expect(validateToolArgs('search_labels', {})).toBeUndefined();
      });
    });

    describe('search_label_values validation', () => {
      it('should accept valid label name', () => {
        expect(validateToolArgs('search_label_values', { label: 'job' })).toBeUndefined();
      });

      it('should reject missing label', () => {
        const result = validateToolArgs('search_label_values', {});
        expect(result).toContain('Label name is required');
      });

      it('should reject empty string label', () => {
        const result = validateToolArgs('search_label_values', { label: '' });
        expect(result).toContain('Label name is required');
      });

      it('should reject whitespace-only label', () => {
        const result = validateToolArgs('search_label_values', { label: '   ' });
        expect(result).toContain('Label name is required');
      });

      it('should reject non-string label', () => {
        const result = validateToolArgs('search_label_values', { label: 123 });
        expect(result).toContain('Label name is required');
      });

      it('should accept label with metric filter', () => {
        expect(
          validateToolArgs('search_label_values', { label: 'instance', metric: 'up' })
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
