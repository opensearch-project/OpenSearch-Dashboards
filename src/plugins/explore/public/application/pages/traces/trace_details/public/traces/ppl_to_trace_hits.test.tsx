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

    it('handles error during span processing in datarows format', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const pplResponse: PPLResponse = {
        schema: [
          { name: 'traceId', type: 'string', values: [] },
          { name: 'startTime', type: 'string', values: [] },
        ],
        datarows: [
          ['trace1', '2025-05-29 03:11:25.29217459'],
          // @ts-ignore - Testing error handling with null row
          null, // This will cause an error
          ['trace3', '2025-05-29 03:11:27.29217459'],
        ],
        fields: [],
        size: 3,
      };

      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result).toHaveLength(2); // Should skip the null row
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing span at index 1:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('handles error during span processing in fields format', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Create a response that will cause an error during processing
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'traceId',
            type: 'string',
            values: ['trace1'],
          },
        ],
        size: 1,
      };

      const result = transformPPLDataToTraceHits(pplResponse);

      expect(result).toHaveLength(1);
      expect(result[0]?.traceId).toBe('trace1');
      consoleSpy.mockRestore();
    });

    it('handles empty datarows', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const pplResponse: PPLResponse = {
        schema: [{ name: 'traceId', type: 'string', values: [] }],
        datarows: [],
        fields: [],
        size: 0,
      };

      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid datarows format response');

      consoleSpy.mockRestore();
    });

    it('handles response with no fields but has size', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const pplResponse: PPLResponse = {
        fields: undefined,
        size: 1,
      };

      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('PPL response has no data:', {
        hasFields: false,
        size: 1,
      });

      consoleSpy.mockRestore();
    });

    it('handles different timestamp formats in convertTimestampToNanos', () => {
      // Test with number timestamp
      const pplResponse1: PPLResponse = {
        fields: [
          {
            name: 'startTime',
            type: 'number',
            values: [1622246485292],
          },
        ],
        size: 1,
      };
      const result1 = transformPPLDataToTraceHits(pplResponse1);
      expect(result1[0]?.sort[0]).toBeGreaterThan(0);

      // Test with object timestamp
      const pplResponse2: PPLResponse = {
        fields: [
          {
            name: 'startTime',
            type: 'object',
            values: [new Date('2025-05-29T03:11:25.292Z')],
          },
        ],
        size: 1,
      };
      const result2 = transformPPLDataToTraceHits(pplResponse2);
      expect(result2[0]?.sort[0]).toBeGreaterThan(0);

      // Test with null timestamp
      const pplResponse3: PPLResponse = {
        fields: [
          {
            name: 'startTime',
            type: 'string',
            values: [null],
          },
        ],
        size: 1,
      };
      const result3 = transformPPLDataToTraceHits(pplResponse3);
      expect(result3[0]?.sort[0]).toBe(0);
    });

    it('handles timestamp conversion errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'startTime',
            type: 'string',
            values: [
              {
                toString: () => {
                  throw new Error('toString error');
                },
              },
            ],
          },
        ],
        size: 1,
      };

      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result[0]?.sort[0]).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error converting timestamp to nanos:',
        expect.any(Object),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('handles extractStatusCode with null status', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'status',
            type: 'object',
            values: [null],
          },
        ],
        size: 1,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result[0]?.['status.code']).toBe(0);
    });

    it('handles traceGroupFields with nested values', () => {
      const pplResponse: PPLResponse = {
        fields: [
          {
            name: 'traceId',
            type: 'string',
            values: ['trace1'],
          },
          {
            name: 'traceGroupFields',
            type: 'object',
            values: [
              {
                endTime: '2025-05-29T03:11:25.392Z',
                durationInNanos: 100000000,
                statusCode: 200,
              },
            ],
          },
          {
            name: 'durationInNanos',
            type: 'number',
            values: [50000000],
          },
        ],
        size: 1,
      };
      const result = transformPPLDataToTraceHits(pplResponse);
      expect(result[0]?.traceGroupFields.endTime).toBe('2025-05-29T03:11:25.392Z');
      expect(result[0]?.traceGroupFields.durationInNanos).toBe(100000000);
      expect(result[0]?.traceGroupFields.statusCode).toBe(200);
    });
  });
});
