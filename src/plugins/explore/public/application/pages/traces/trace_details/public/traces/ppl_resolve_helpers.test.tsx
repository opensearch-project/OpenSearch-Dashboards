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
        ['attributes', [{ aws: { local: { service: 'fallback-service' } } }]],
        ['serviceName', ['legacy-service']],
      ]);

      expect(resolveServiceName(fieldMap, 0)).toBe('primary-service');
    });

    it('falls back to attributes.aws.local.service (secondary format)', () => {
      const fieldMap = new Map([
        ['resource', [{}]],
        ['attributes', [{ aws: { local: { service: 'fallback-service' } } }]],
        ['serviceName', ['legacy-service']],
      ]);

      expect(resolveServiceName(fieldMap, 0)).toBe('fallback-service');
    });

    it('falls back to serviceName (legacy format)', () => {
      const fieldMap = new Map([
        ['resource', [{}]],
        ['attributes', [{}]],
        ['serviceName', ['legacy-service']],
      ]);

      expect(resolveServiceName(fieldMap, 0)).toBe('legacy-service');
    });

    it('returns empty string when no service name found', () => {
      const fieldMap = new Map([
        ['resource', [{}]],
        ['attributes', [{}]],
      ]);

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
          .mockReturnValueOnce({ attributes: { service: { name: 'primary-service' } } })
          .mockReturnValueOnce({ aws: { local: { service: 'fallback-service' } } })
          .mockReturnValueOnce('legacy-service');

        expect(resolveServiceNameFromDatarows(getValueByName)).toBe('primary-service');
      });

      it('falls back to attributes.aws.local.service', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce({})
          .mockReturnValueOnce({ aws: { local: { service: 'fallback-service' } } })
          .mockReturnValueOnce('legacy-service');

        expect(resolveServiceNameFromDatarows(getValueByName)).toBe('fallback-service');
      });

      it('falls back to serviceName', () => {
        const getValueByName = jest
          .fn()
          .mockReturnValueOnce({})
          .mockReturnValueOnce({})
          .mockReturnValueOnce('legacy-service');

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
  });

  describe('resolveServiceNameFromSpan', () => {
    it('resolves from resource.attributes.service.name (primary format)', () => {
      const span = {
        resource: { attributes: { service: { name: 'primary-service' } } },
        attributes: { aws: { local: { service: 'fallback-service' } } },
        serviceName: 'legacy-service',
      };

      expect(resolveServiceNameFromSpan(span)).toBe('primary-service');
    });

    it('resolves from resource.attributes["service.name"] (alternative primary format)', () => {
      const span = {
        resource: { attributes: { 'service.name': 'alt-primary-service' } },
        attributes: { aws: { local: { service: 'fallback-service' } } },
        serviceName: 'legacy-service',
      };

      expect(resolveServiceNameFromSpan(span)).toBe('alt-primary-service');
    });

    it('falls back to attributes.aws.local.service (secondary format)', () => {
      const span = {
        resource: { attributes: {} },
        attributes: { aws: { local: { service: 'fallback-service' } } },
        serviceName: 'legacy-service',
      };

      expect(resolveServiceNameFromSpan(span)).toBe('fallback-service');
    });

    it('falls back to attributes["aws.local.service"] (alternative format)', () => {
      const span = {
        resource: { attributes: {} },
        attributes: { 'aws.local.service': 'alt-fallback-service' },
        serviceName: 'legacy-service',
      };

      expect(resolveServiceNameFromSpan(span)).toBe('alt-fallback-service');
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
});
