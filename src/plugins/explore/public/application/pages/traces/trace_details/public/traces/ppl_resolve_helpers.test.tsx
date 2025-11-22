/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  convertTimestampToNanos,
  hasNanosecondPrecision,
  extractStatusCode,
  resolveServiceName,
  resolveStartTime,
  resolveEndTime,
  resolveTimestamp,
  resolveTime,
  resolveDuration,
  resolveInstrumentationScope,
  resolveServiceNameFromDatarows,
  resolveStartTimeFromDatarows,
  resolveEndTimeFromDatarows,
  resolveDurationFromDatarows,
  resolveInstrumentationScopeFromDatarows,
  isSpanError,
  resolveServiceNameFromSpan,
} from './ppl_resolve_helpers';

describe('ppl_resolve_helpers', () => {
  describe('convertTimestampToNanos', () => {
    it('converts string timestamp to nanoseconds', () => {
      const result = convertTimestampToNanos('2023-01-01T10:00:00.000Z');
      expect(result).toBeGreaterThan(0);
      expect(result).toBe(new Date('2023-01-01T10:00:00.000Z').getTime() * 1000000);
    });

    it('converts number timestamp to nanoseconds', () => {
      const timestamp = 1672574400000; // 2023-01-01T10:00:00.000Z in milliseconds
      const result = convertTimestampToNanos(timestamp);
      expect(result).toBe(timestamp * 1000000);
    });

    it('returns nanosecond timestamp as is when already in nanoseconds', () => {
      const nanoTimestamp = 1672574400000000000;
      const result = convertTimestampToNanos(nanoTimestamp);
      expect(result).toBe(nanoTimestamp);
    });

    it('handles invalid string timestamp gracefully', () => {
      const result = convertTimestampToNanos('invalid-timestamp');
      expect(result).toBe(0);
    });

    it('handles null/undefined timestamp', () => {
      expect(convertTimestampToNanos('')).toBe(0);
      expect(convertTimestampToNanos(null as any)).toBe(0);
      expect(convertTimestampToNanos(undefined as any)).toBe(0);
    });

    it('handles error during conversion', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = convertTimestampToNanos({
        toString: () => {
          throw new Error('toString error');
        },
      } as any);

      expect(result).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error converting timestamp to nanos:',
        expect.any(Object),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('hasNanosecondPrecision', () => {
    it('detects nanosecond precision for large numbers', () => {
      expect(hasNanosecondPrecision(1672574400000000000)).toBe(true);
      expect(hasNanosecondPrecision(1672574400000)).toBe(false);
    });

    it('detects nanosecond precision for long numeric strings', () => {
      expect(hasNanosecondPrecision('1672574400000000000')).toBe(true);
      expect(hasNanosecondPrecision('1672574400000')).toBe(false);
      expect(hasNanosecondPrecision('123456789012345')).toBe(true);
      expect(hasNanosecondPrecision('123456789012')).toBe(false);
    });

    it('detects nanosecond precision for high-precision ISO strings', () => {
      expect(hasNanosecondPrecision('2023-01-01T10:00:00.123456789Z')).toBe(true);
      expect(hasNanosecondPrecision('2023-01-01T10:00:00.123Z')).toBe(false);
      expect(hasNanosecondPrecision('2023-01-01T10:00:00.1234Z')).toBe(true);
    });

    it('detects 19-digit Unix nano timestamp patterns', () => {
      expect(hasNanosecondPrecision('1672574400123456789')).toBe(true);
      expect(hasNanosecondPrecision('167257440012345678')).toBe(true); // 18 digits is still considered high precision
    });

    it('returns false for null/undefined/empty values', () => {
      expect(hasNanosecondPrecision('')).toBe(false);
      expect(hasNanosecondPrecision(null as any)).toBe(false);
      expect(hasNanosecondPrecision(undefined as any)).toBe(false);
      expect(hasNanosecondPrecision(0)).toBe(false);
    });

    it('returns false for non-numeric strings', () => {
      expect(hasNanosecondPrecision('not-a-number')).toBe(false);
      expect(hasNanosecondPrecision('2023-01-01T10:00:00Z')).toBe(false);
    });
  });

  describe('extractStatusCode', () => {
    it('returns numeric status directly', () => {
      expect(extractStatusCode(200)).toBe(200);
      expect(extractStatusCode(404)).toBe(404);
      expect(extractStatusCode(0)).toBe(0);
    });

    it('extracts numeric code from status object', () => {
      expect(extractStatusCode({ code: 200 })).toBe(200);
      expect(extractStatusCode({ code: 404 })).toBe(404);
    });

    it('extracts status_code from status object', () => {
      expect(extractStatusCode({ status_code: 500 })).toBe(500);
    });

    it('handles string status codes from new format', () => {
      expect(extractStatusCode({ code: 'UNSET' })).toBe(0);
      expect(extractStatusCode({ code: 'OK' })).toBe(1);
      expect(extractStatusCode({ code: 'ERROR' })).toBe(2);
      expect(extractStatusCode({ code: 'unset' })).toBe(0);
      expect(extractStatusCode({ code: 'ok' })).toBe(1);
      expect(extractStatusCode({ code: 'error' })).toBe(2);
    });

    it('returns 0 for unknown string status codes', () => {
      expect(extractStatusCode({ code: 'UNKNOWN' })).toBe(0);
      expect(extractStatusCode({ code: 'invalid' })).toBe(0);
    });

    it('returns 0 for null/undefined/invalid status', () => {
      expect(extractStatusCode(null)).toBe(0);
      expect(extractStatusCode(undefined)).toBe(0);
      expect(extractStatusCode('')).toBe(0);
      expect(extractStatusCode({})).toBe(0);
    });
  });

  describe('resolveServiceName', () => {
    it('resolves service name from resource.attributes.service.name (primary format)', () => {
      const fieldMap = new Map([
        ['resource', [{ attributes: { service: { name: 'primary-service' } } }]],
        ['serviceName', ['legacy-service']],
      ]);

      expect(resolveServiceName(fieldMap, 0)).toBe('primary-service');
    });

    it('falls back to serviceName (legacy format)', () => {
      const fieldMap = new Map([
        ['resource', [{}]],
        ['serviceName', ['legacy-service']],
      ]);

      expect(resolveServiceName(fieldMap, 0)).toBe('legacy-service');
    });

    it('returns empty string when no service name found', () => {
      const fieldMap = new Map([['resource', [{}]]]);

      expect(resolveServiceName(fieldMap, 0)).toBe('');
    });

    it('handles missing fields gracefully', () => {
      const fieldMap = new Map();
      expect(resolveServiceName(fieldMap, 0)).toBe('');
    });
  });

  describe('resolveStartTime', () => {
    it('resolves startTimeUnixNano (new format)', () => {
      const fieldMap = new Map([
        ['startTimeUnixNano', ['1672574400000000000']],
        ['startTime', ['2023-01-01T10:00:00.000Z']],
      ]);

      expect(resolveStartTime(fieldMap, 0)).toBe('1672574400000000000');
    });

    it('falls back to startTime (legacy format)', () => {
      const fieldMap = new Map([['startTime', ['2023-01-01T10:00:00.000Z']]]);

      expect(resolveStartTime(fieldMap, 0)).toBe('2023-01-01T10:00:00.000Z');
    });

    it('returns empty string when no start time found', () => {
      const fieldMap = new Map();
      expect(resolveStartTime(fieldMap, 0)).toBe('');
    });
  });

  describe('resolveEndTime', () => {
    it('resolves endTimeUnixNano (new format)', () => {
      const fieldMap = new Map([
        ['endTimeUnixNano', ['1672574400100000000']],
        ['endTime', ['2023-01-01T10:00:00.100Z']],
      ]);

      expect(resolveEndTime(fieldMap, 0)).toBe('1672574400100000000');
    });

    it('falls back to endTime (legacy format)', () => {
      const fieldMap = new Map([['endTime', ['2023-01-01T10:00:00.100Z']]]);

      expect(resolveEndTime(fieldMap, 0)).toBe('2023-01-01T10:00:00.100Z');
    });

    it('returns empty string when no end time found', () => {
      const fieldMap = new Map();
      expect(resolveEndTime(fieldMap, 0)).toBe('');
    });
  });

  describe('resolveTimestamp', () => {
    it('resolves endTimeUnixNano for @timestamp compatibility', () => {
      const fieldMap = new Map([
        ['endTimeUnixNano', ['1672574400100000000']],
        ['@timestamp', ['2023-01-01T10:00:00.100Z']],
      ]);

      expect(resolveTimestamp(fieldMap, 0)).toBe('1672574400100000000');
    });

    it('falls back to @timestamp', () => {
      const fieldMap = new Map([['@timestamp', ['2023-01-01T10:00:00.100Z']]]);

      expect(resolveTimestamp(fieldMap, 0)).toBe('2023-01-01T10:00:00.100Z');
    });
  });

  describe('resolveTime', () => {
    it('resolves endTimeUnixNano for time compatibility', () => {
      const fieldMap = new Map([
        ['endTimeUnixNano', ['1672574400100000000']],
        ['time', ['2023-01-01T10:00:00.100Z']],
      ]);

      expect(resolveTime(fieldMap, 0)).toBe('1672574400100000000');
    });

    it('falls back to time', () => {
      const fieldMap = new Map([['time', ['2023-01-01T10:00:00.100Z']]]);

      expect(resolveTime(fieldMap, 0)).toBe('2023-01-01T10:00:00.100Z');
    });
  });

  describe('resolveDuration', () => {
    it('calculates duration from high-precision timestamps when no duration fields provided', () => {
      const fieldMap = new Map();

      const startTime = '1672574400000000000'; // Nanosecond precision
      const endTime = '1672574400100000000'; // Nanosecond precision

      const result = resolveDuration(fieldMap, 0, startTime, endTime);
      expect(result).toBe(100000000); // Calculated from timestamps
    });

    it('prefers provided duration fields for low-precision timestamps', () => {
      const fieldMap = new Map([
        ['durationNano', [50000000]],
        ['durationInNanos', [60000000]],
      ]);

      const startTime = '2023-01-01T10:00:00.000Z'; // Low precision
      const endTime = '2023-01-01T10:00:00.100Z'; // Low precision

      const result = resolveDuration(fieldMap, 0, startTime, endTime);
      expect(result).toBe(50000000); // Uses durationNano field
    });

    it('falls back to calculated duration from low-precision timestamps', () => {
      const fieldMap = new Map(); // No duration fields

      const startTime = '2023-01-01T10:00:00.000Z';
      const endTime = '2023-01-01T10:00:00.100Z';

      const result = resolveDuration(fieldMap, 0, startTime, endTime);
      expect(result).toBe(100000000); // Calculated from timestamps
    });

    it('uses durationInNanos when durationNano is not available', () => {
      const fieldMap = new Map([['durationInNanos', [75000000]]]);

      const startTime = '2023-01-01T10:00:00.000Z';
      const endTime = '2023-01-01T10:00:00.100Z';

      const result = resolveDuration(fieldMap, 0, startTime, endTime);
      expect(result).toBe(75000000);
    });

    it('returns 0 when no timestamps or duration fields available', () => {
      const fieldMap = new Map();
      const result = resolveDuration(fieldMap, 0, '', '');
      expect(result).toBe(0);
    });

    it('handles errors during high-precision calculation gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const fieldMap = new Map([['durationNano', [50000000]]]);

      // Invalid high-precision timestamps that will cause calculation error
      const result = resolveDuration(fieldMap, 0, 'invalid-nano', 'invalid-nano');
      expect(result).toBe(50000000); // Falls back to duration field

      consoleSpy.mockRestore();
    });

    it('handles errors during low-precision calculation gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const fieldMap = new Map([['durationNano', [50000000]]]);

      // This will trigger the low-precision path and then error handling
      const result = resolveDuration(fieldMap, 0, 'invalid', 'invalid');
      expect(result).toBe(50000000); // Falls back to duration field

      consoleSpy.mockRestore();
    });
  });

  describe('resolveInstrumentationScope', () => {
    it('resolves scope (new format)', () => {
      const fieldMap = new Map([
        ['scope', [{ name: 'test-scope', version: '1.0' }]],
        ['instrumentationScope', [{ name: 'legacy-scope' }]],
      ]);

      expect(resolveInstrumentationScope(fieldMap, 0)).toEqual({
        name: 'test-scope',
        version: '1.0',
      });
    });

    it('falls back to instrumentationScope (legacy format)', () => {
      const fieldMap = new Map([['instrumentationScope', [{ name: 'legacy-scope' }]]]);

      expect(resolveInstrumentationScope(fieldMap, 0)).toEqual({ name: 'legacy-scope' });
    });

    it('returns empty object when no scope found', () => {
      const fieldMap = new Map();
      expect(resolveInstrumentationScope(fieldMap, 0)).toEqual({});
    });
  });

  describe('datarows format resolvers', () => {
    describe('resolveServiceNameFromDatarows', () => {
      it('resolves service name from resource.attributes.service.name', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce(undefined) // process (Jaeger)
          .mockReturnValueOnce({ attributes: { service: { name: 'primary-service' } } }) // resource (DataPrepper)
          .mockReturnValueOnce('legacy-service'); // serviceName (fallback)

        expect(resolveServiceNameFromDatarows(getValueByName)).toBe('primary-service');
      });

      it('falls back to serviceName', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce(undefined) // process (Jaeger)
          .mockReturnValueOnce({}) // resource (DataPrepper, empty)
          .mockReturnValueOnce('legacy-service'); // serviceName (fallback)

        expect(resolveServiceNameFromDatarows(getValueByName)).toBe('legacy-service');
      });
    });

    describe('resolveStartTimeFromDatarows', () => {
      it('resolves startTimeUnixNano first', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce('1672574400000000000')
          .mockReturnValueOnce('2023-01-01T10:00:00.000Z');

        expect(resolveStartTimeFromDatarows(getValueByName)).toBe('1672574400000000000');
      });
    });

    describe('resolveEndTimeFromDatarows', () => {
      it('resolves endTimeUnixNano first', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce('1672574400100000000')
          .mockReturnValueOnce('2023-01-01T10:00:00.100Z');

        expect(resolveEndTimeFromDatarows(getValueByName)).toBe('1672574400100000000');
      });
    });

    describe('resolveDurationFromDatarows', () => {
      it('calculates duration from high-precision timestamps when no duration fields provided', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce(undefined) // durationNano
          .mockReturnValueOnce(undefined); // durationInNanos

        const startTime = '1672574400000000000';
        const endTime = '1672574400100000000';

        const result = resolveDurationFromDatarows(getValueByName, startTime, endTime);
        expect(result).toBe(100000000); // Calculated from timestamps
      });

      it('prefers provided duration fields for low-precision timestamps', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce(50000000) // durationNano
          .mockReturnValueOnce(60000000); // durationInNanos

        const startTime = '2023-01-01T10:00:00.000Z';
        const endTime = '2023-01-01T10:00:00.100Z';

        const result = resolveDurationFromDatarows(getValueByName, startTime, endTime);
        expect(result).toBe(50000000); // Uses durationNano field
      });
    });

    describe('resolveInstrumentationScopeFromDatarows', () => {
      it('resolves scope first', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce({ name: 'test-scope' })
          .mockReturnValueOnce({ name: 'legacy-scope' });

        expect(resolveInstrumentationScopeFromDatarows(getValueByName)).toEqual({
          name: 'test-scope',
        });
      });
    });
  });

  describe('isSpanError', () => {
    it('detects error from status.code field (legacy format)', () => {
      expect(isSpanError({ 'status.code': 2 })).toBe(true);
      expect(isSpanError({ 'status.code': 1 })).toBe(false);
      expect(isSpanError({ 'status.code': 0 })).toBe(false);
    });

    it('detects error from nested status object', () => {
      expect(isSpanError({ status: { code: 2 } })).toBe(true);
      expect(isSpanError({ status: { code: 'ERROR' } })).toBe(true);
      expect(isSpanError({ status: { code: 'OK' } })).toBe(false);
    });

    it('detects error from HTTP status codes (4xx and 5xx)', () => {
      expect(isSpanError({ attributes: { http: { status_code: 404 } } })).toBe(true);
      expect(isSpanError({ attributes: { http: { status_code: 500 } } })).toBe(true);
      expect(isSpanError({ attributes: { http: { status_code: 200 } } })).toBe(false);
      expect(isSpanError({ attributes: { http: { status_code: 301 } } })).toBe(false);
    });

    it('handles various HTTP status code formats', () => {
      expect(isSpanError({ 'attributes.http.status_code': 404 })).toBe(true);
      expect(isSpanError({ attributes: { 'http.status_code': 500 } })).toBe(true);
      expect(isSpanError({ attributes: { http: { response: { status_code: 400 } } } })).toBe(true);
      expect(isSpanError({ 'http.status_code': 503 })).toBe(true);
      expect(isSpanError({ statusCode: 422 })).toBe(true);
    });

    it('returns false for null/undefined span', () => {
      expect(isSpanError(null)).toBe(false);
      expect(isSpanError(undefined)).toBe(false);
    });

    it('returns false when no error indicators found', () => {
      expect(isSpanError({})).toBe(false);
      expect(isSpanError({ name: 'test-span' })).toBe(false);
    });

    describe('Jaeger error detection', () => {
      it('detects error from tag.error field', () => {
        expect(isSpanError({ tag: { error: 'true' } })).toBe(true);
        expect(isSpanError({ tag: { error: true } })).toBe(true);
        expect(isSpanError({ tag: { error: 'false' } })).toBe(false);
        expect(isSpanError({ tag: { error: false } })).toBe(false);
      });

      it('detects error from tags array with error tag', () => {
        expect(
          isSpanError({
            tags: [{ key: 'error', value: 'true' }],
          })
        ).toBe(true);
        expect(
          isSpanError({
            tags: [{ key: 'error', value: true }],
          })
        ).toBe(true);
        expect(
          isSpanError({
            tags: [{ key: 'error', value: 'false' }],
          })
        ).toBe(false);
      });

      it('detects gRPC error status codes', () => {
        // gRPC status code > 0 indicates error (0 = OK, >0 = error)
        expect(
          isSpanError({
            tags: [{ key: 'rpc.grpc.status_code', value: '4' }],
          })
        ).toBe(true);
        expect(
          isSpanError({
            tags: [{ key: 'rpc.grpc.status_code', value: '1' }],
          })
        ).toBe(true);
        expect(
          isSpanError({
            tags: [{ key: 'rpc.grpc.status_code', value: '0' }],
          })
        ).toBe(false);
        expect(
          isSpanError({
            tags: [{ key: 'rpc.grpc.status_code', value: 0 }],
          })
        ).toBe(false);
      });

      it('detects OpenTelemetry status description errors', () => {
        expect(
          isSpanError({
            tags: [
              {
                key: 'otel.status_description',
                value: '_MultiThreadedRendezvous: Deadline Exceeded',
              },
            ],
          })
        ).toBe(true);
        expect(
          isSpanError({
            tags: [{ key: 'otel.status_description', value: '' }],
          })
        ).toBe(false);
      });

      it('detects exception events', () => {
        expect(
          isSpanError({
            events: [{ name: 'exception' }],
          })
        ).toBe(true);
        expect(
          isSpanError({
            events: [{ attributes: { exception: { type: 'Error' } } }],
          })
        ).toBe(true);
        expect(
          isSpanError({
            events: [{ fields: [{ key: 'event', value: 'exception' }] }],
          })
        ).toBe(true);
      });

      it('detects Jaeger logs with exception events', () => {
        expect(
          isSpanError({
            logs: [
              {
                fields: [{ key: 'event', value: 'exception' }],
              },
            ],
          })
        ).toBe(true);
        expect(
          isSpanError({
            logs: [
              {
                fields: [{ key: 'event', value: 'message' }],
              },
            ],
          })
        ).toBe(false);
      });

      it('detects HTTP status codes from Jaeger tags', () => {
        expect(
          isSpanError({
            tags: [{ key: 'http.status_code', value: '404' }],
          })
        ).toBe(true);
        expect(
          isSpanError({
            tags: [{ key: 'http.status_code', value: '500' }],
          })
        ).toBe(true);
        expect(
          isSpanError({
            tags: [{ key: 'http.status_code', value: '200' }],
          })
        ).toBe(false);
      });

      it('detects HTTP status codes from Jaeger process tags', () => {
        expect(
          isSpanError({
            process: { tags: [{ key: 'http.status_code', value: '503' }] },
          })
        ).toBe(true);
        expect(
          isSpanError({
            process: { tags: [{ key: 'http.status_code', value: '201' }] },
          })
        ).toBe(false);
      });

      it('handles multiple error indicators correctly', () => {
        const spanWithMultipleErrors = {
          tag: { error: 'true' },
          tags: [{ key: 'rpc.grpc.status_code', value: '4' }],
          events: [{ name: 'exception' }],
        };
        expect(isSpanError(spanWithMultipleErrors)).toBe(true);
      });

      it('prioritizes any error indicator', () => {
        // Even if one indicator shows no error, others can still indicate error
        const spanMixed = {
          tag: { error: 'false' }, // No error
          tags: [{ key: 'rpc.grpc.status_code', value: '4' }], // But gRPC error
        };
        expect(isSpanError(spanMixed)).toBe(true);
      });
    });
  });

  describe('resolveServiceNameFromSpan', () => {
    it('resolves from Jaeger format (process.serviceName) with highest priority', () => {
      const span = {
        process: { serviceName: 'jaeger-service' },
        resource: { attributes: { service: { name: 'dataprepper-service' } } },
        serviceName: 'legacy-service',
      };

      expect(resolveServiceNameFromSpan(span)).toBe('jaeger-service');
    });

    it('resolves from resource.attributes.service.name (DataPrepper format)', () => {
      const span = {
        resource: { attributes: { service: { name: 'primary-service' } } },
        serviceName: 'legacy-service',
      };

      expect(resolveServiceNameFromSpan(span)).toBe('primary-service');
    });

    it('resolves from resource.attributes["service.name"]', () => {
      const span = {
        resource: { attributes: { 'service.name': 'alt-primary-service' } },
        serviceName: 'legacy-service',
      };

      expect(resolveServiceNameFromSpan(span)).toBe('alt-primary-service');
    });

    it('falls back to serviceName (legacy)', () => {
      const span = {
        serviceName: 'legacy-service',
        name: 'span-name',
      };

      expect(resolveServiceNameFromSpan(span)).toBe('legacy-service');
    });

    it('falls back to name when serviceName not available', () => {
      const span = {
        name: 'span-name',
      };

      expect(resolveServiceNameFromSpan(span)).toBe('span-name');
    });

    it('returns empty string for null/undefined span', () => {
      expect(resolveServiceNameFromSpan(null)).toBe('');
      expect(resolveServiceNameFromSpan(undefined)).toBe('');
    });

    it('returns empty string when no service identifiers found', () => {
      expect(resolveServiceNameFromSpan({})).toBe('');
    });
  });

  describe('Jaeger Duration Conversion', () => {
    describe('resolveDuration with Jaeger microsecond duration', () => {
      it('converts Jaeger microsecond duration to nanoseconds', () => {
        const fieldMap = new Map([
          ['duration', [8301]], // Jaeger microseconds
          ['durationNano', [50000000]], // Should not be used
        ]);

        const result = resolveDuration(fieldMap, 0, '', '');
        expect(result).toBe(8301000); // 8301 * 1000 = 8,301,000 nanoseconds
      });

      it('prioritizes Jaeger duration over other duration fields', () => {
        const fieldMap = new Map([
          ['duration', [5000]], // Jaeger microseconds
          ['durationNano', [10000000]], // Should be ignored
          ['durationInNanos', [15000000]], // Should be ignored
        ]);

        const result = resolveDuration(fieldMap, 0, '', '');
        expect(result).toBe(5000000); // 5000 * 1000 = 5,000,000 nanoseconds
      });

      it('falls back to other duration fields when Jaeger duration is not a number', () => {
        const fieldMap = new Map([
          ['duration', ['not-a-number']], // Invalid Jaeger duration
          ['durationNano', [7000000]], // Should be used
        ]);

        const result = resolveDuration(fieldMap, 0, '', '');
        expect(result).toBe(7000000);
      });

      it('falls back to other duration fields when Jaeger duration is null/undefined', () => {
        const fieldMap = new Map([
          ['duration', [null]], // Null Jaeger duration
          ['durationInNanos', [9000000]], // Should be used
        ]);

        const result = resolveDuration(fieldMap, 0, '', '');
        expect(result).toBe(9000000);
      });

      it('handles zero duration from Jaeger', () => {
        const fieldMap = new Map([['duration', [0]]]);

        const result = resolveDuration(fieldMap, 0, '', '');
        expect(result).toBe(0);
      });
    });

    describe('resolveDurationFromDatarows with Jaeger microsecond duration', () => {
      it('converts Jaeger microsecond duration to nanoseconds', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce(undefined) // durationNano
          .mockReturnValueOnce(undefined) // durationInNanos
          .mockReturnValueOnce(12345); // duration (Jaeger microseconds)

        const result = resolveDurationFromDatarows(getValueByName, '', '');
        expect(result).toBe(12345000); // 12345 * 1000 = 12,345,000 nanoseconds
      });

      it('prioritizes Jaeger duration over other duration fields', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce(8000000) // durationNano - should be ignored
          .mockReturnValueOnce(9000000) // durationInNanos - should be ignored
          .mockReturnValueOnce(3000); // duration (Jaeger microseconds)

        const result = resolveDurationFromDatarows(getValueByName, '', '');
        expect(result).toBe(3000000); // 3000 * 1000 = 3,000,000 nanoseconds
      });

      it('falls back to other duration fields when Jaeger duration is invalid', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce(6000000) // durationNano - should be used
          .mockReturnValueOnce(7000000) // durationInNanos
          .mockReturnValueOnce('invalid'); // duration (invalid)

        const result = resolveDurationFromDatarows(getValueByName, '', '');
        expect(result).toBe(6000000);
      });
    });
  });

  describe('Jaeger HTTP Status Code Extraction', () => {
    it('extracts HTTP status code from Jaeger span tags', () => {
      const span = {
        tags: [
          { key: 'http.status_code', value: '404', type: 'string' },
          { key: 'component', value: 'http-client', type: 'string' },
        ],
        attributes: { http: { status_code: 200 } }, // Should be ignored
      };

      // We need to use isSpanError which internally calls extractHttpStatusCode
      expect(isSpanError(span)).toBe(true); // 404 is >= 400, so it's an error
    });

    it('extracts HTTP status code from Jaeger process tags', () => {
      const span = {
        process: {
          tags: [{ key: 'http.status_code', value: '500', type: 'string' }],
        },
        attributes: { http: { status_code: 200 } }, // Should be ignored
      };

      expect(isSpanError(span)).toBe(true); // 500 is >= 400, so it's an error
    });

    it('prioritizes span tags over process tags for HTTP status code', () => {
      const span = {
        tags: [{ key: 'http.status_code', value: '200', type: 'string' }],
        process: {
          tags: [{ key: 'http.status_code', value: '500', type: 'string' }],
        },
      };

      expect(isSpanError(span)).toBe(false); // 200 from span tags is not an error
    });

    it('falls back to DataPrepper format when Jaeger tags are not available', () => {
      const span = {
        attributes: { http: { status_code: 403 } },
      };

      expect(isSpanError(span)).toBe(true); // 403 is >= 400, so it's an error
    });

    it('handles non-numeric HTTP status codes in Jaeger tags gracefully', () => {
      const span = {
        tags: [{ key: 'http.status_code', value: 'not-a-number', type: 'string' }],
        attributes: { http: { status_code: 500 } },
      };

      expect(isSpanError(span)).toBe(true); // Falls back to DataPrepper format
    });

    it('handles missing value in Jaeger HTTP status tag', () => {
      const span = {
        tags: [
          { key: 'http.status_code', type: 'string' }, // Missing value
        ],
        attributes: { http: { status_code: 404 } },
      };

      expect(isSpanError(span)).toBe(true); // Falls back to DataPrepper format
    });
  });
});
