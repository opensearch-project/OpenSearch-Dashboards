/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseLogHits } from './ppl_to_log_hits';

describe('ppl_to_log_hits', () => {
  describe('parseLogHits', () => {
    it('handles fields format response', () => {
      const response = {
        type: 'data_frame',
        body: {
          fields: [
            { name: '@timestamp', values: ['2025-01-01T00:00:00Z'] },
            { name: 'time', values: ['2025-01-01T00:00:00Z'] },
            { name: 'spanId', values: ['span1'] },
            { name: 'severityText', values: ['ERROR'] },
            { name: 'severityNumber', values: [2] },
            { name: 'body', values: ['Error message'] },
            { name: 'traceId', values: ['trace1'] },
          ],
          size: 1,
        },
      };

      const result = parseLogHits(response);

      expect(result).toHaveLength(1);
      expect(result[0]._source).toEqual({
        '@timestamp': '2025-01-01T00:00:00Z',
        time: '2025-01-01T00:00:00Z',
        spanId: 'span1',
        severityText: 'ERROR',
        severityNumber: 2,
        body: 'Error message',
        traceId: 'trace1',
        'severity.text': 'ERROR',
        'severity.number': 2,
      });
    });

    it('handles datarows format response', () => {
      const response = {
        schema: [
          { name: '@timestamp' },
          { name: 'time' },
          { name: 'spanId' },
          { name: 'severityText' },
          { name: 'severityNumber' },
          { name: 'body' },
          { name: 'traceId' },
        ],
        datarows: [
          [
            '2025-01-01T00:00:00Z',
            '2025-01-01T00:00:00Z',
            'span1',
            'ERROR',
            2,
            'Error message',
            'trace1',
          ],
        ],
      };

      const result = parseLogHits(response);

      expect(result).toHaveLength(1);
      expect(result[0]._source).toEqual({
        '@timestamp': '2025-01-01T00:00:00Z',
        time: '2025-01-01T00:00:00Z',
        spanId: 'span1',
        severityText: 'ERROR',
        severityNumber: 2,
        body: 'Error message',
        traceId: 'trace1',
        'severity.text': 'ERROR',
        'severity.number': 2,
      });
    });

    it('handles standard hits format response', () => {
      const response = {
        hits: {
          hits: [
            {
              _index: 'logs',
              _id: 'log_1',
              _score: 1,
              _source: {
                '@timestamp': '2025-01-01T00:00:00Z',
                time: '2025-01-01T00:00:00Z',
                spanId: 'span1',
                severityText: 'ERROR',
                severityNumber: 2,
                body: 'Error message',
                traceId: 'trace1',
              },
            },
          ],
        },
      };

      const result = parseLogHits(response);

      expect(result).toHaveLength(1);
      expect(result[0]._source).toEqual({
        '@timestamp': '2025-01-01T00:00:00Z',
        time: '2025-01-01T00:00:00Z',
        spanId: 'span1',
        severityText: 'ERROR',
        severityNumber: 2,
        body: 'Error message',
        traceId: 'trace1',
      });
    });

    it('uses time field when @timestamp is null', () => {
      const response = {
        type: 'data_frame',
        body: {
          fields: [
            { name: '@timestamp', values: [null] },
            { name: 'time', values: ['2025-01-01T00:00:00Z'] },
            { name: 'spanId', values: ['span1'] },
          ],
          size: 1,
        },
      };

      const result = parseLogHits(response);

      expect(result).toHaveLength(1);
      expect(result[0]._source['@timestamp']).toBe('2025-01-01T00:00:00Z');
    });

    it('uses observedTimestamp when @timestamp and time are null', () => {
      const response = {
        type: 'data_frame',
        body: {
          fields: [
            { name: '@timestamp', values: [null] },
            { name: 'time', values: [null] },
            { name: 'observedTimestamp', values: ['2025-01-01T00:00:00Z'] },
            { name: 'spanId', values: ['span1'] },
          ],
          size: 1,
        },
      };

      const result = parseLogHits(response);

      expect(result).toHaveLength(1);
      expect(result[0]._source['@timestamp']).toBe('2025-01-01T00:00:00Z');
    });

    it('handles empty response', () => {
      const result = parseLogHits({});
      expect(result).toEqual([]);
    });

    it('handles null response', () => {
      const result = parseLogHits(null);
      expect(result).toEqual([]);
    });

    it('handles invalid response format', () => {
      const result = parseLogHits({ invalid: 'format' });
      expect(result).toEqual([]);
    });

    it('handles empty fields array', () => {
      const response = {
        type: 'data_frame',
        body: {
          fields: [],
          size: 0,
        },
      };

      const result = parseLogHits(response);
      expect(result).toEqual([]);
    });

    it('handles empty datarows array', () => {
      const response = {
        schema: [],
        datarows: [],
      };

      const result = parseLogHits(response);
      expect(result).toEqual([]);
    });
  });
});
