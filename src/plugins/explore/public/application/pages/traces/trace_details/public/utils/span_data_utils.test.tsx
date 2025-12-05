/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  extractSpanIssues,
  getSpanIssueCount,
  getSpanOverviewData,
  formatSpanAttributes,
  getSpanAttributeCount,
  hasSpanEvents,
  sortAttributes,
} from './span_data_utils';

// Mock the helper_functions module
jest.mock('./helper_functions', () => ({
  isEmpty: jest.fn((value) => {
    return (
      value == null ||
      (value.hasOwnProperty && value.hasOwnProperty('length') && value.length === 0) ||
      (value.constructor === Object && Object.keys(value).length === 0)
    );
  }),
}));

describe('span_data_utils', () => {
  // Sample span data for testing
  const mockSpanWithError = {
    spanId: 'span-123',
    parentSpanId: 'parent-456',
    serviceName: 'test-service',
    name: 'test-operation',
    durationInNanos: 1000000000,
    startTime: '2023-01-01T00:00:00.000Z',
    endTime: '2023-01-01T00:00:01.000Z',
    'status.code': 2,
    'status.message': 'Internal server error',
    traceId: 'trace-789',
    traceGroup: 'test-trace-group',
    'http.method': 'GET',
    'http.url': 'https://example.com/api',
    'http.status_code': 500,
    events: [
      {
        name: 'database.error',
        timeUnixNano: '1672531200000000000',
        attributes: {
          'error.type': 'ConnectionTimeout',
          'error.message': 'Database connection timed out',
        },
      },
    ],
  };

  const mockSpanWithoutError = {
    spanId: 'span-456',
    serviceName: 'test-service',
    name: 'successful-operation',
    durationInNanos: 500000000,
    startTime: '2023-01-01T00:00:00.000Z',
    endTime: '2023-01-01T00:00:00.500Z',
    'status.code': 0,
    traceId: 'trace-789',
    'http.method': 'POST',
    'http.url': 'https://example.com/api/create',
    'http.status_code': 201,
    events: [
      {
        name: 'request.start',
        timeUnixNano: '1672531200000000000',
        attributes: {
          'request.id': 'req-123',
        },
      },
    ],
  };

  const mockSpanWithStatusObject = {
    spanId: 'span-789',
    serviceName: 'test-service',
    name: 'operation-with-status-object',
    durationInNanos: 750000000,
    startTime: '2023-01-01T00:00:00.000Z',
    endTime: '2023-01-01T00:00:00.750Z',
    status: {
      code: 2,
      message: 'Request failed',
    },
    traceId: 'trace-789',
    events: [],
  };

  describe('extractSpanIssues', () => {
    it('should return empty array for null or undefined span', () => {
      expect(extractSpanIssues(null)).toEqual([]);
      expect(extractSpanIssues(undefined)).toEqual([]);
    });

    it('should extract error status issue from span with status.code = 2', () => {
      const issues = extractSpanIssues(mockSpanWithError);

      expect(issues).toHaveLength(2); // Error status + error event

      const errorStatusIssue = issues.find((issue) => issue.type === 'error');
      expect(errorStatusIssue).toEqual({
        type: 'error',
        message: 'Span has error status',
        details: {
          statusCode: 2,
          statusMessage: 'Internal server error',
        },
      });
    });

    it('should extract error status issue from span with status object', () => {
      const issues = extractSpanIssues(mockSpanWithStatusObject);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toEqual({
        type: 'error',
        message: 'Span has error status',
        details: {
          statusCode: 2,
          statusMessage: 'Request failed',
        },
      });
    });

    it('should extract error events from span events', () => {
      const issues = extractSpanIssues(mockSpanWithError);

      const errorEventIssue = issues.find((issue) => issue.type === 'event');
      expect(errorEventIssue).toEqual({
        type: 'event',
        message: 'database.Error',
        timestamp: '1672531200000000000',
        details: mockSpanWithError.events[0],
      });
    });

    it('should handle events with exception in name', () => {
      const spanWithException = {
        ...mockSpanWithoutError,
        events: [
          {
            name: 'java.lang.nullpointerexception',
            timeUnixNano: '1672531200000000000',
            attributes: {
              'exception.type': 'NullPointerException',
              'exception.message': 'Null pointer encountered',
            },
          },
        ],
      };

      const issues = extractSpanIssues(spanWithException);

      expect(issues).toHaveLength(1);
      expect(issues[0].message).toBe('java.lang.nullpointerException');
    });

    it('should handle events with fault in name', () => {
      const spanWithFault = {
        ...mockSpanWithoutError,
        events: [
          {
            name: 'system.fault',
            timeUnixNano: '1672531200000000000',
            attributes: {
              'fault.type': 'SystemFault',
            },
          },
        ],
      };

      const issues = extractSpanIssues(spanWithFault);

      expect(issues).toHaveLength(1);
      expect(issues[0].message).toBe('system.fault');
    });

    it('should handle events without name', () => {
      const spanWithUnnamedErrorEvent = {
        ...mockSpanWithoutError,
        events: [
          {
            timeUnixNano: '1672531200000000000',
            attributes: {
              'error.type': 'UnknownError',
            },
          },
        ],
      };

      const issues = extractSpanIssues(spanWithUnnamedErrorEvent);

      expect(issues).toHaveLength(0); // Should not extract events without error-related names
    });

    it('should return empty array for span without errors or error events', () => {
      const issues = extractSpanIssues(mockSpanWithoutError);
      expect(issues).toEqual([]);
    });

    it('should handle span without events array', () => {
      const spanWithoutEvents = {
        ...mockSpanWithoutError,
        events: undefined,
      };

      const issues = extractSpanIssues(spanWithoutEvents);
      expect(issues).toEqual([]);
    });

    it('should handle span with non-array events', () => {
      const spanWithInvalidEvents = {
        ...mockSpanWithoutError,
        events: 'not-an-array',
      };

      const issues = extractSpanIssues(spanWithInvalidEvents);
      expect(issues).toEqual([]);
    });
  });

  describe('getSpanIssueCount', () => {
    it('should return correct count of issues', () => {
      expect(getSpanIssueCount(mockSpanWithError)).toBe(2);
      expect(getSpanIssueCount(mockSpanWithoutError)).toBe(0);
      expect(getSpanIssueCount(mockSpanWithStatusObject)).toBe(1);
    });

    it('should return 0 for null or undefined span', () => {
      expect(getSpanIssueCount(null)).toBe(0);
      expect(getSpanIssueCount(undefined)).toBe(0);
    });
  });

  describe('getSpanOverviewData', () => {
    it('should return null for null or undefined span', () => {
      expect(getSpanOverviewData(null)).toBeNull();
      expect(getSpanOverviewData(undefined)).toBeNull();
    });

    it('should extract overview data from span with error', () => {
      const overview = getSpanOverviewData(mockSpanWithError);

      expect(overview).toEqual({
        spanId: 'span-123',
        parentSpanId: 'parent-456',
        serviceName: 'test-service',
        operationName: 'test-operation',
        duration: 1000000000,
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:00:01.000Z',
        hasError: true,
        statusCode: 2,
      });
    });

    it('should extract overview data from span without error', () => {
      const overview = getSpanOverviewData(mockSpanWithoutError);

      expect(overview).toEqual({
        spanId: 'span-456',
        parentSpanId: undefined,
        serviceName: 'test-service',
        operationName: 'successful-operation',
        duration: 500000000,
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:00:00.500Z',
        hasError: false,
        statusCode: undefined,
      });
    });

    it('should handle span with status object', () => {
      const overview = getSpanOverviewData(mockSpanWithStatusObject);

      expect(overview).toEqual({
        spanId: 'span-789',
        parentSpanId: undefined,
        serviceName: 'test-service',
        operationName: 'operation-with-status-object',
        duration: 750000000,
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:00:00.750Z',
        hasError: true,
        statusCode: 2,
      });
    });

    it('should handle span with missing fields', () => {
      const minimalSpan = {
        spanId: 'minimal-span',
      };

      const overview = getSpanOverviewData(minimalSpan);

      expect(overview).toEqual({
        spanId: 'minimal-span',
        parentSpanId: undefined,
        serviceName: '',
        operationName: '',
        duration: 0,
        startTime: '',
        endTime: '',
        hasError: false,
        statusCode: undefined,
      });
    });
  });

  describe('formatSpanAttributes', () => {
    it('should return empty object for null or undefined span', () => {
      expect(formatSpanAttributes(null)).toEqual({});
      expect(formatSpanAttributes(undefined)).toEqual({});
    });

    it('should filter out overview fields and return attributes', () => {
      const attributes = formatSpanAttributes(mockSpanWithError);

      // Should include HTTP attributes but exclude overview fields
      expect(attributes['http.method']).toBe('GET');
      expect(attributes['http.url']).toBe('https://example.com/api');
      expect(attributes['http.status_code']).toBe(500);

      // Should not include overview fields
      expect(attributes).not.toHaveProperty('spanId');
      expect(attributes).not.toHaveProperty('serviceName');
      expect(attributes).not.toHaveProperty('name');
      expect(attributes).not.toHaveProperty('durationInNanos');
      expect(attributes).not.toHaveProperty('startTime');
      expect(attributes).not.toHaveProperty('endTime');
      expect(attributes).not.toHaveProperty('events');
      expect(attributes).not.toHaveProperty('status.code');
      expect(attributes).not.toHaveProperty('status.message');
    });

    it('should flatten nested objects', () => {
      const spanWithNestedAttributes = {
        spanId: 'test-span',
        serviceName: 'test-service',
        resource: {
          'service.name': 'my-service',
          'service.version': '1.0.0',
          deployment: {
            environment: 'production',
          },
        },
        tags: {
          'user.id': '12345',
          'request.type': 'api',
        },
      };

      const attributes = formatSpanAttributes(spanWithNestedAttributes);

      expect(attributes['resource.service.name']).toBe('my-service');
      expect(attributes['resource.service.version']).toBe('1.0.0');
      expect(attributes['resource.deployment.environment']).toBe('production');
      expect(attributes['tags.user.id']).toBe('12345');
      expect(attributes['tags.request.type']).toBe('api');
    });

    it('should handle arrays in attributes', () => {
      const spanWithArrays = {
        spanId: 'test-span',
        tags: ['tag1', 'tag2', 'tag3'],
        metadata: {
          labels: ['label1', 'label2'],
        },
      };

      const attributes = formatSpanAttributes(spanWithArrays);

      expect(attributes.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(attributes['metadata.labels']).toEqual(['label1', 'label2']);
    });
  });

  describe('getSpanAttributeCount', () => {
    it('should return correct count of attributes', () => {
      const count = getSpanAttributeCount(mockSpanWithError);
      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });

    it('should return 0 for null or undefined span', () => {
      expect(getSpanAttributeCount(null)).toBe(0);
      expect(getSpanAttributeCount(undefined)).toBe(0);
    });

    it('should return 0 for span with only overview fields', () => {
      const spanWithOnlyOverviewFields = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'test-operation',
        durationInNanos: 1000000,
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:00:01.000Z',
      };

      expect(getSpanAttributeCount(spanWithOnlyOverviewFields)).toBe(0);
    });
  });

  describe('hasSpanEvents', () => {
    it('should return true for span with events', () => {
      expect(hasSpanEvents(mockSpanWithError)).toBe(true);
      expect(hasSpanEvents(mockSpanWithoutError)).toBe(true);
    });

    it('should return false for span without events', () => {
      const spanWithoutEvents = {
        spanId: 'test-span',
        serviceName: 'test-service',
      };

      expect(hasSpanEvents(spanWithoutEvents)).toBe(false);
    });

    it('should return false for span with empty events array', () => {
      const spanWithEmptyEvents = {
        spanId: 'test-span',
        serviceName: 'test-service',
        events: [],
      };

      expect(hasSpanEvents(spanWithEmptyEvents)).toBe(false);
    });

    it('should return false for span with non-array events', () => {
      const spanWithInvalidEvents = {
        spanId: 'test-span',
        serviceName: 'test-service',
        events: 'not-an-array',
      };

      expect(hasSpanEvents(spanWithInvalidEvents)).toBe(false);
    });

    it('should return false for null or undefined span', () => {
      expect(hasSpanEvents(null)).toBe(false);
      expect(hasSpanEvents(undefined)).toBe(false);
    });
  });

  describe('sortAttributes', () => {
    it('should sort attributes with non-empty values first', () => {
      const attributes = {
        'empty.string': '',
        'valid.string': 'test-value',
        'empty.array': [],
        'valid.array': ['item1', 'item2'],
        'empty.object': {},
        'valid.object': { key: 'value' },
        'null.value': null,
        'undefined.value': undefined,
        'valid.number': 42,
        'zero.number': 0,
      };

      const sorted = sortAttributes(attributes);

      // Non-empty values should come first
      const nonEmptyEntries = sorted.filter(([, value]) => {
        return !(
          value == null ||
          (value.hasOwnProperty && value.hasOwnProperty('length') && value.length === 0) ||
          (value.constructor === Object && Object.keys(value).length === 0)
        );
      });

      const emptyEntries = sorted.filter(([, value]) => {
        return (
          value == null ||
          (value.hasOwnProperty && value.hasOwnProperty('length') && value.length === 0) ||
          (value.constructor === Object && Object.keys(value).length === 0)
        );
      });

      // Non-empty entries should come before empty entries
      expect(sorted.slice(0, nonEmptyEntries.length)).toEqual(
        expect.arrayContaining(nonEmptyEntries)
      );
      expect(sorted.slice(nonEmptyEntries.length)).toEqual(expect.arrayContaining(emptyEntries));
    });

    it('should sort alphabetically within same emptiness category', () => {
      const attributes = {
        'z.valid': 'value-z',
        'a.valid': 'value-a',
        'm.valid': 'value-m',
        'z.empty': '',
        'a.empty': null,
        'm.empty': undefined,
      };

      const sorted = sortAttributes(attributes);

      // Check that valid entries are sorted alphabetically
      const validEntries = sorted.filter(([, value]) => value != null && value !== '');
      expect(validEntries[0][0]).toBe('a.valid');
      expect(validEntries[1][0]).toBe('m.valid');
      expect(validEntries[2][0]).toBe('z.valid');
    });

    it('should handle empty attributes object', () => {
      const sorted = sortAttributes({});
      expect(sorted).toEqual([]);
    });

    it('should handle attributes with mixed data types', () => {
      const attributes = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        nullValue: null,
        undefinedValue: undefined,
      };

      const sorted = sortAttributes(attributes);

      expect(sorted).toHaveLength(7);
      expect(Array.isArray(sorted)).toBe(true);
      expect(sorted.every((entry) => Array.isArray(entry) && entry.length === 2)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle span with circular references gracefully', () => {
      const circularSpan: any = {
        spanId: 'circular-span',
        serviceName: 'test-service',
      };
      circularSpan.self = circularSpan;

      // These functions should not throw errors even with circular references
      expect(() => extractSpanIssues(circularSpan)).not.toThrow();
      expect(() => getSpanIssueCount(circularSpan)).not.toThrow();
      expect(() => getSpanOverviewData(circularSpan)).not.toThrow();
      expect(() => hasSpanEvents(circularSpan)).not.toThrow();
    });

    it('should handle span with very large nested objects', () => {
      const largeNestedSpan: any = {
        spanId: 'large-span',
        serviceName: 'test-service',
        metadata: {},
      };

      // Create a deeply nested object
      let current: any = largeNestedSpan.metadata;
      for (let i = 0; i < 100; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      expect(() => formatSpanAttributes(largeNestedSpan)).not.toThrow();
      expect(() => getSpanAttributeCount(largeNestedSpan)).not.toThrow();
    });

    it('should handle span with special characters in field names', () => {
      const spanWithSpecialChars = {
        spanId: 'special-span',
        'field-with-dashes': 'value1',
        'field.with.dots': 'value2',
        field_with_underscores: 'value3',
        'field with spaces': 'value4',
        'field@with#symbols$': 'value5',
      };

      const attributes = formatSpanAttributes(spanWithSpecialChars);

      expect(attributes['field-with-dashes']).toBe('value1');
      expect(attributes['field.with.dots']).toBe('value2');
      expect(attributes.field_with_underscores).toBe('value3');
      expect(attributes['field with spaces']).toBe('value4');
      expect(attributes['field@with#symbols$']).toBe('value5');
    });
  });
});
