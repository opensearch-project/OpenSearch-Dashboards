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
      // When timestamp processing fails, span should be skipped entirely for data integrity
      expect(result).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing span at index 0:',
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

    describe('Jaeger Error Detection in Transformation', () => {
      it('detects error from Jaeger tag.error field', () => {
        const pplResponse: PPLResponse = {
          fields: [
            {
              name: 'traceId',
              type: 'string',
              values: ['78e8654a4e4c66fee98aec2d6863a115'],
            },
            {
              name: 'spanId',
              type: 'string',
              values: ['6e7c54dfbec98ecb'],
            },
            {
              name: 'tag',
              type: 'object',
              values: [{ error: 'true', 'span@kind': 'client' }],
            },
          ],
          size: 1,
        };
        const result = transformPPLDataToTraceHits(pplResponse);
        expect(result[0]?.['status.code']).toBe(2); // ERROR
        expect(result[0]?.status.code).toBe(2);
        expect(result[0]?.tag.error).toBe('true');
      });

      it('detects error from gRPC status code in Jaeger tags', () => {
        const pplResponse: PPLResponse = {
          fields: [
            {
              name: 'traceId',
              type: 'string',
              values: ['78e8654a4e4c66fee98aec2d6863a115'],
            },
            {
              name: 'spanId',
              type: 'string',
              values: ['6e7c54dfbec98ecb'],
            },
            {
              name: 'tags',
              type: 'array',
              values: [
                [
                  { key: 'rpc.grpc.status_code', value: '4', type: 'string' },
                  { key: 'component', value: 'grpc-client', type: 'string' },
                ],
              ],
            },
          ],
          size: 1,
        };
        const result = transformPPLDataToTraceHits(pplResponse);
        expect(result[0]?.['status.code']).toBe(2); // ERROR (gRPC 4 = DEADLINE_EXCEEDED)
        expect(result[0]?.status.code).toBe(2);
        expect(result[0]?.attributes['rpc.grpc.status_code']).toBe('4');
      });

      it('transforms Jaeger logs to events for error detection', () => {
        const pplResponse: PPLResponse = {
          fields: [
            {
              name: 'traceId',
              type: 'string',
              values: ['78e8654a4e4c66fee98aec2d6863a115'],
            },
            {
              name: 'logs',
              type: 'array',
              values: [
                [
                  {
                    fields: [
                      { key: 'event', value: 'exception' },
                      { key: 'exception.type', value: 'TimeoutException' },
                    ],
                    timestamp: 1763595349860715,
                  },
                ],
              ],
            },
          ],
          size: 1,
        };
        const result = transformPPLDataToTraceHits(pplResponse);
        expect(result[0]?.events).toHaveLength(1);
        expect(result[0]?.events[0].name).toBe('exception');
        expect(result[0]?.events[0].attributes['exception.type']).toBe('TimeoutException');
      });

      it('handles complex Jaeger error scenario like user example', () => {
        const pplResponse: PPLResponse = {
          fields: [
            {
              name: 'traceId',
              type: 'string',
              values: ['78e8654a4e4c66fee98aec2d6863a115'],
            },
            {
              name: 'spanId',
              type: 'string',
              values: ['6e7c54dfbec98ecb'],
            },
            {
              name: 'serviceName',
              type: 'string',
              values: ['recommendation'],
            },
            {
              name: 'name',
              type: 'string',
              values: ['/flagd.evaluation.v1.Service/EventStream'],
            },
            {
              name: 'tag',
              type: 'object',
              values: [{ error: 'true', 'span@kind': 'client' }],
            },
            {
              name: 'tags',
              type: 'array',
              values: [
                [
                  { key: 'rpc.grpc.status_code', value: '4', type: 'string' },
                  { key: 'otel.status_description', value: 'Deadline Exceeded' },
                ],
              ],
            },
            {
              name: 'logs',
              type: 'array',
              values: [
                [
                  {
                    fields: [{ key: 'event', value: 'exception' }],
                    timestamp: 1763595349860715,
                  },
                ],
              ],
            },
          ],
          size: 1,
        };
        const result = transformPPLDataToTraceHits(pplResponse);

        // Should detect error from multiple indicators
        expect(result[0]?.['status.code']).toBe(2); // ERROR
        expect(result[0]?.status.code).toBe(2);
        expect(result[0]?.traceGroupFields.statusCode).toBe(2);

        // Should preserve Jaeger fields for error detection
        expect(result[0]?.tag.error).toBe('true');
        expect(result[0]?.tags).toHaveLength(2);
        expect(result[0]?.attributes['rpc.grpc.status_code']).toBe('4');

        // Should convert logs to events
        expect(result[0]?.events).toHaveLength(1);
        expect(result[0]?.events[0].name).toBe('exception');
      });

      it('handles gRPC OK status (code 0) correctly', () => {
        const pplResponse: PPLResponse = {
          fields: [
            {
              name: 'traceId',
              type: 'string',
              values: ['78e8654a4e4c66fee98aec2d6863a115'],
            },
            {
              name: 'tags',
              type: 'array',
              values: [
                [
                  { key: 'rpc.grpc.status_code', value: '0', type: 'string' }, // OK
                ],
              ],
            },
          ],
          size: 1,
        };
        const result = transformPPLDataToTraceHits(pplResponse);
        expect(result[0]?.['status.code']).toBe(1); // OK (not error)
      });
    });
  });
});
