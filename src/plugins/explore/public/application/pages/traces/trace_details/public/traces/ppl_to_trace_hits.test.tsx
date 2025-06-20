/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { transformPPLDataToTraceHits, PPLResponse } from './ppl_to_trace_hits';

describe('ppl_to_trace_hits', () => {
  describe('convertTimestampToNanos', () => {
    it('converts string timestamp to nanoseconds', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'startTime',
            type: 'string',
            values: ['2025-05-29 03:11:25.29217459'],
          },
        ],
        size: 1,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result[0]?.sort[0]).toBeGreaterThan(0);
    });

    it('handles invalid timestamp gracefully', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'startTime',
            type: 'string',
            values: ['not-a-date'],
          },
        ],
        size: 1,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result[0]?.sort[0]).toBe(0);
    });
  });

  describe('extractStatusCode', () => {
    it('extracts status code from object', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'status',
            type: 'object',
            values: [{ code: 200, message: 'OK' }],
          },
        ],
        size: 1,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result[0]?.['status.code']).toBe(200);
    });

    it('handles numeric status directly', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'status',
            type: 'number',
            values: [404],
          },
        ],
        size: 1,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result[0]?.['status.code']).toBe(404);
    });

    it('returns 0 for invalid status', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'status',
            type: 'string',
            values: ['invalid'],
          },
        ],
        size: 1,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result[0]?.['status.code']).toBe(0);
    });
  });

  // Main transformation tests
  describe('transformPPLDataToTraceHits', () => {
    it('handles null/undefined response', () => {
      expect(transformPPLDataToTraceHits(null as any)).toEqual([]);
      expect(transformPPLDataToTraceHits(undefined as any)).toEqual([]);
    });

    it('handles empty response', () => {
      const pplResponse: PPLResponse = {
        fields: [],
        size: 0,
      };
      expect(transformPPLDataToTraceHits(pplResponse)).toEqual([]);
    });

    it('transforms datarows format correctly', () => {
      const pplResponse: PPLResponse = {
        schema: [
          { name: 'traceId', type: 'string', values: [] },
          { name: 'spanId', type: 'string', values: [] },
          { name: 'serviceName', type: 'string', values: [] },
        ],
        datarows: [
          ['trace1', 'span1', 'service1'],
          ['trace2', 'span2', 'service2'],
        ],
        fields: [],
        size: 2,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result).toHaveLength(2);
      expect(result[0]?.traceId).toBe('trace1');
      expect(result[1]?.traceId).toBe('trace2');
    });

    it('transforms fields format correctly', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'traceId',
            type: 'string',
            values: ['trace1', 'trace2'],
          },
          {
            name: 'spanId',
            type: 'string',
            values: ['span1', 'span2'],
          },
          {
            name: 'serviceName',
            type: 'string',
            values: ['service1', 'service2'],
          },
        ],
        size: 2,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result).toHaveLength(2);
      expect(result[0]?.traceId).toBe('trace1');
      expect(result[1]?.traceId).toBe('trace2');
    });

    it('handles nested body structure', () => {
      const pplResponse: PPLResponse = {
        type: 'data_frame',
        body: {
          fields: [
            {
              name: 'traceId',
              type: 'string',
              values: ['trace1'],
            },
          ],
          size: 1,
          name: 'test',
        },
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result).toHaveLength(1);
      expect(result[0]?.traceId).toBe('trace1');
    });

    it('preserves nested structures', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'traceId',
            type: 'string',
            values: ['trace1'],
          },
          {
            name: 'attributes',
            type: 'object',
            values: [{ key: 'value' }],
          },
          {
            name: 'resource',
            type: 'object',
            values: [{ resourceKey: 'resourceValue' }],
          },
          {
            name: 'instrumentationScope',
            type: 'object',
            values: [{ scopeKey: 'scopeValue' }],
          },
        ],
        size: 1,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result[0]?.attributes).toEqual({ key: 'value' });
      expect(result[0]?.resource).toEqual({ resourceKey: 'resourceValue' });
      expect(result[0]?.instrumentationScope).toEqual({ scopeKey: 'scopeValue' });
    });

    it('sorts results by start time', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'startTime',
            type: 'string',
            values: ['2025-05-29 03:11:25.29217459', '2025-05-29 03:11:24.29217459'],
          },
          {
            name: 'spanId',
            type: 'string',
            values: ['span1', 'span2'],
          },
        ],
        size: 2,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result).toHaveLength(2);
      expect(result[0].sort[0]).toBeLessThan(result[1].sort[0]);
    });
  });
});
