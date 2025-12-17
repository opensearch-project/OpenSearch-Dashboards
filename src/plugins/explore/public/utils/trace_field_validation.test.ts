/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  validateRequiredTraceFields,
  getMissingFieldsDescription,
  extractFieldFromRowData,
  extractServiceNameFromRowData,
  extractJaegerTagValue,
  extractJaegerHttpStatusCode,
} from './trace_field_validation';

describe('trace_field_validation', () => {
  describe('validateRequiredTraceFields', () => {
    const createMockTraceData = (overrides: any = {}): any => ({
      spanId: 'span-123',
      parentSpanId: 'parent-span-456',
      serviceName: 'test-service',
      name: 'test-operation',
      startTime: '2023-01-01T00:00:00Z',
      endTime: '2023-01-01T00:01:00Z',
      status: { code: 0 },
      traceId: 'trace-789',
      ...overrides,
    });

    it('should return valid when all required fields are present', () => {
      const traceData = createMockTraceData();
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('should detect missing spanId', () => {
      const traceData = createMockTraceData({ spanId: undefined });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('spanId');
    });

    it('should detect missing parentSpanId when field is completely absent', () => {
      const traceData = createMockTraceData();
      delete traceData.parentSpanId; // Remove the field entirely
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('parentSpanId');
    });

    it('should accept empty string parentSpanId as valid (root spans)', () => {
      const traceData = createMockTraceData({ parentSpanId: '' });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).not.toContain('parentSpanId');
      expect(result.presentFields).toContain('parentSpanId');
    });

    it('should accept non-empty parentSpanId as valid (child spans)', () => {
      const traceData = createMockTraceData({ parentSpanId: 'parent-span-123' });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).not.toContain('parentSpanId');
      expect(result.presentFields).toContain('parentSpanId');
    });

    it('should detect missing serviceName', () => {
      const traceData = createMockTraceData({ serviceName: undefined, name: undefined });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('serviceName');
    });

    it('should detect missing name', () => {
      const traceData = createMockTraceData({ name: undefined });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('name');
    });

    it('should detect missing startTime', () => {
      const traceData = createMockTraceData({ startTime: undefined });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('startTime');
    });

    it('should detect missing endTime', () => {
      const traceData = createMockTraceData({ endTime: undefined });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('endTime');
    });

    it('should detect missing status.code when field is completely absent but still allow validation to pass', () => {
      const traceData = createMockTraceData();
      delete traceData.status; // Remove the field entirely
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toContain('status.code');
    });

    it('should accept status.code when present with any value', () => {
      const traceData = createMockTraceData({ status: { code: 2 } });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).not.toContain('status.code');
      expect(result.presentFields).toContain('status.code');
    });

    it('should accept empty status object as missing status.code but still allow validation to pass', () => {
      const traceData = createMockTraceData({ status: {} });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toContain('status.code');
    });

    it('should detect missing traceId', () => {
      const traceData = createMockTraceData({ traceId: undefined });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('traceId');
    });

    it('should detect multiple missing fields', () => {
      const traceData = createMockTraceData({
        spanId: undefined,
        serviceName: undefined,
        name: undefined,
        startTime: undefined,
      });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('spanId');
      expect(result.missingFields).toContain('serviceName');
      expect(result.missingFields).toContain('name');
      expect(result.missingFields).toContain('startTime');
      expect(result.missingFields.length).toBe(4);
    });

    it('should handle empty string values as missing', () => {
      const traceData = createMockTraceData({
        spanId: '',
        serviceName: '',
        name: '',
      });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('spanId');
      expect(result.missingFields).toContain('serviceName');
      expect(result.missingFields).toContain('name');
    });

    it('should handle null values as missing', () => {
      const traceData = createMockTraceData({
        spanId: null,
        parentSpanId: null,
      });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('spanId');
      // parentSpanId can be null for root spans, so it should not be considered missing
      expect(result.missingFields).not.toContain('parentSpanId');
    });

    it('should validate real OpenTelemetry trace data with empty parentSpanId for root span', () => {
      // Test with actual trace data structure from the user's example
      const rootSpanData = {
        traceId: '5fa33b1092745896490ababc0ad1085f',
        spanId: 'aa61c9fd77570245',
        parentSpanId: '', // Empty string for root span - should be valid
        serviceName: 'load-generator',
        name: 'user_add_to_cart',
        startTime: '2025-10-14 18:26:25.661094097',
        endTime: '2025-10-14 18:26:25.676477347',
        status: { code: 0 },
      };

      const result = validateRequiredTraceFields(rootSpanData as any);
      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
      expect(result.presentFields).toContain('parentSpanId');
    });

    it('should validate real OpenTelemetry trace data with non-empty parentSpanId for child span', () => {
      // Test with actual trace data structure from the user's example
      const childSpanData = {
        traceId: '5fa33b1092745896490ababc0ad1085f',
        spanId: '2eae1fb4e87a0727',
        parentSpanId: 'aa61c9fd77570245', // Non-empty for child span - should be valid
        serviceName: 'load-generator',
        name: 'GET',
        startTime: '2025-10-14 18:26:25.661450055',
        endTime: '2025-10-14 18:26:25.669245097',
        status: { code: 2 },
      };

      const result = validateRequiredTraceFields(childSpanData as any);
      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
      expect(result.presentFields).toContain('parentSpanId');
    });

    it('should handle completely empty object', () => {
      const result = validateRequiredTraceFields({} as any);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual([
        'spanId',
        'traceId',
        'parentSpanId',
        'serviceName',
        'name',
        'startTime',
        'endTime',
        'status.code',
      ]);
    });

    it('should handle nested field paths correctly', () => {
      const traceData = {
        spanId: 'span-123',
        parentSpanId: 'parent-span-456',
        serviceName: 'test-service',
        name: 'test-operation',
        startTime: '2023-01-01T00:00:00Z',
        endTime: '2023-01-01T00:01:00Z',
        status: { code: 0 },
        traceId: 'trace-789',
        nested: {
          field: {
            value: 'test',
          },
        },
      };

      const result = validateRequiredTraceFields(traceData as any);
      expect(result.isValid).toBe(true);
    });

    it('should handle status.code with value 0 as valid', () => {
      const traceData = createMockTraceData({ status: { code: 0 } });
      const result = validateRequiredTraceFields(traceData);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).not.toContain('status.code');
    });
  });

  describe('getMissingFieldsDescription', () => {
    it('should return descriptions for all missing fields', () => {
      const missingFields = ['spanId', 'serviceName', 'startTime'];
      const descriptions = getMissingFieldsDescription(missingFields);

      expect(descriptions).toHaveLength(3);
      expect(descriptions[0]).toEqual({
        name: 'spanId',
        description: 'Used for span selection and highlighting',
      });
      expect(descriptions[1]).toEqual({
        name: 'serviceName',
        description: 'Displayed as labels and used for color coding',
      });
      expect(descriptions[2]).toEqual({
        name: 'startTime',
        description: 'Positions spans on timeline',
      });
    });

    it('should handle empty array', () => {
      const descriptions = getMissingFieldsDescription([]);
      expect(descriptions).toEqual([]);
    });

    it('should handle unknown field names', () => {
      const missingFields = ['unknownField'];
      const descriptions = getMissingFieldsDescription(missingFields);

      expect(descriptions).toHaveLength(1);
      expect(descriptions[0]).toEqual({
        name: 'unknownField',
        description: 'Required field',
      });
    });

    it('should return descriptions for all supported fields', () => {
      const allFields = [
        'spanId',
        'parentSpanId',
        'serviceName',
        'name',
        'startTime',
        'endTime',
        'status.code',
        'traceId',
      ];
      const descriptions = getMissingFieldsDescription(allFields);

      expect(descriptions).toHaveLength(8);
      expect(descriptions.map((d) => d.name)).toEqual(allFields);
    });
  });

  describe('extractFieldFromRowData', () => {
    const createMockRowData = (data: any) => ({
      _index: 'test-index',
      _id: 'test-id',
      _score: 1.0,
      _source: data,
      ...data,
    });

    it('should extract field from direct property', () => {
      const rowData = createMockRowData({ spanId: 'test-span-id' });
      const result = extractFieldFromRowData(rowData, ['spanId']);

      expect(result).toBe('test-span-id');
    });

    it('should extract field from nested property', () => {
      const rowData = createMockRowData({ status: { code: 200 } });
      const result = extractFieldFromRowData(rowData, ['status.code']);

      expect(result).toBe('200');
    });

    it('should extract field from deeply nested property', () => {
      const rowData = createMockRowData({
        attributes: {
          http: {
            status_code: 404,
          },
        },
      });
      const result = extractFieldFromRowData(rowData, ['attributes.http.status_code']);

      expect(result).toBe('404');
    });

    it('should return empty string for missing property', () => {
      const rowData = createMockRowData({ spanId: 'test-span-id' });
      const result = extractFieldFromRowData(rowData, ['missingField']);

      expect(result).toBe('');
    });

    it('should return empty string for missing nested property', () => {
      const rowData = createMockRowData({ status: {} });
      const result = extractFieldFromRowData(rowData, ['status.code']);

      expect(result).toBe('');
    });

    it('should handle null/undefined rowData', () => {
      expect(extractFieldFromRowData(null as any, ['spanId'])).toBe('');
      expect(extractFieldFromRowData(undefined as any, ['spanId'])).toBe('');
    });

    it('should handle multiple field paths and return first match', () => {
      const rowData = createMockRowData({
        spanId: 'test-span-id',
        span_id: 'alternative-span-id',
      });
      const result = extractFieldFromRowData(rowData, ['missingField', 'spanId', 'span_id']);

      expect(result).toBe('test-span-id');
    });

    it('should handle array indices in path', () => {
      const rowData = createMockRowData({
        items: [{ id: 'first' }, { id: 'second' }],
      });
      const result = extractFieldFromRowData(rowData, ['items.0.id']);

      expect(result).toBe('first');
    });

    it('should handle status.code with value 0', () => {
      const rowData = createMockRowData({ status: { code: 0 } });
      const result = extractFieldFromRowData(rowData, ['status.code']);

      expect(result).toBe('0');
    });
  });

  describe('extractServiceNameFromRowData', () => {
    const createMockRowData = (data: any) => ({
      _index: 'test-index',
      _id: 'test-id',
      _score: 1.0,
      _source: data,
      ...data,
    });

    it('should extract service name from Jaeger format (process.serviceName)', () => {
      const rowData = createMockRowData({
        process: {
          serviceName: 'jaeger-service',
        },
      });
      const result = extractServiceNameFromRowData(rowData);
      expect(result).toBe('jaeger-service');
    });

    it('should extract service name from _source.process.serviceName', () => {
      const rowData = createMockRowData({
        _source: {
          process: {
            serviceName: 'jaeger-source-service',
          },
        },
      });
      const result = extractServiceNameFromRowData(rowData);
      expect(result).toBe('jaeger-source-service');
    });

    it('should fallback to DataPrepper format (resource.attributes.service.name)', () => {
      const rowData = createMockRowData({
        resource: {
          attributes: {
            service: {
              name: 'dataprepper-service',
            },
          },
        },
      });
      const result = extractServiceNameFromRowData(rowData);
      expect(result).toBe('dataprepper-service');
    });

    it('should prioritize Jaeger format over DataPrepper format', () => {
      const rowData = createMockRowData({
        process: {
          serviceName: 'jaeger-service',
        },
        resource: {
          attributes: {
            service: {
              name: 'dataprepper-service',
            },
          },
        },
      });
      const result = extractServiceNameFromRowData(rowData);
      expect(result).toBe('jaeger-service');
    });

    it('should extract from serviceName field when Jaeger and DataPrepper formats are not available', () => {
      const rowData = createMockRowData({
        serviceName: 'simple-service',
      });
      const result = extractServiceNameFromRowData(rowData);
      expect(result).toBe('simple-service');
    });

    it('should return empty string when no service name is found', () => {
      const rowData = createMockRowData({});
      const result = extractServiceNameFromRowData(rowData);
      expect(result).toBe('');
    });
  });

  describe('extractJaegerTagValue', () => {
    const createMockRowData = (data: any) => ({
      _index: 'test-index',
      _id: 'test-id',
      _score: 1.0,
      _source: data,
      ...data,
    });

    it('should extract tag value from span tags', () => {
      const rowData = createMockRowData({
        tags: [
          { key: 'http.status_code', value: '200', type: 'string' },
          { key: 'component', value: 'http-client', type: 'string' },
        ],
      });
      const result = extractJaegerTagValue(rowData, 'http.status_code');
      expect(result).toBe('200');
    });

    it('should extract tag value from process tags', () => {
      const rowData = createMockRowData({
        process: {
          tags: [
            { key: 'service.version', value: '1.2.3', type: 'string' },
            { key: 'environment', value: 'production', type: 'string' },
          ],
        },
      });
      const result = extractJaegerTagValue(rowData, 'service.version');
      expect(result).toBe('1.2.3');
    });

    it('should extract tag value from _source.tags', () => {
      const rowData = createMockRowData({
        _source: {
          tags: [{ key: 'user.id', value: 'user123', type: 'string' }],
        },
      });
      const result = extractJaegerTagValue(rowData, 'user.id');
      expect(result).toBe('user123');
    });

    it('should extract tag value from _source.process.tags', () => {
      const rowData = createMockRowData({
        _source: {
          process: {
            tags: [{ key: 'hostname', value: 'server01', type: 'string' }],
          },
        },
      });
      const result = extractJaegerTagValue(rowData, 'hostname');
      expect(result).toBe('server01');
    });

    it('should return empty string when tag is not found', () => {
      const rowData = createMockRowData({
        tags: [{ key: 'other.tag', value: 'other-value', type: 'string' }],
      });
      const result = extractJaegerTagValue(rowData, 'missing.tag');
      expect(result).toBe('');
    });

    it('should return empty string when tags array is empty', () => {
      const rowData = createMockRowData({ tags: [] });
      const result = extractJaegerTagValue(rowData, 'any.tag');
      expect(result).toBe('');
    });

    it('should return empty string when tags is not an array', () => {
      const rowData = createMockRowData({ tags: 'not-an-array' });
      const result = extractJaegerTagValue(rowData, 'any.tag');
      expect(result).toBe('');
    });

    it('should handle tag with missing value', () => {
      const rowData = createMockRowData({
        tags: [
          { key: 'incomplete.tag', type: 'string' }, // No value
        ],
      });
      const result = extractJaegerTagValue(rowData, 'incomplete.tag');
      expect(result).toBe('');
    });

    it('should handle tag with non-string value', () => {
      const rowData = createMockRowData({
        tags: [{ key: 'numeric.tag', value: 123, type: 'number' }],
      });
      const result = extractJaegerTagValue(rowData, 'numeric.tag');
      expect(result).toBe('');
    });

    it('should prioritize span tags over process tags', () => {
      const rowData = createMockRowData({
        tags: [{ key: 'duplicate.key', value: 'span-value', type: 'string' }],
        process: {
          tags: [{ key: 'duplicate.key', value: 'process-value', type: 'string' }],
        },
      });
      const result = extractJaegerTagValue(rowData, 'duplicate.key');
      expect(result).toBe('span-value');
    });
  });

  describe('extractJaegerHttpStatusCode', () => {
    const createMockRowData = (data: any) => ({
      _index: 'test-index',
      _id: 'test-id',
      _score: 1.0,
      _source: data,
      ...data,
    });

    it('should extract HTTP status code from Jaeger tags', () => {
      const rowData = createMockRowData({
        tags: [{ key: 'http.status_code', value: '404', type: 'string' }],
      });
      const result = extractJaegerHttpStatusCode(rowData);
      expect(result).toBe('404');
    });

    it('should fallback to standard HTTP status code fields', () => {
      const rowData = createMockRowData({
        attributes: {
          http: {
            status_code: 200,
          },
        },
      });
      const result = extractJaegerHttpStatusCode(rowData);
      expect(result).toBe('200');
    });

    it('should prioritize Jaeger tags over standard fields', () => {
      const rowData = createMockRowData({
        tags: [{ key: 'http.status_code', value: '500', type: 'string' }],
        attributes: {
          http: {
            status_code: 200,
          },
        },
      });
      const result = extractJaegerHttpStatusCode(rowData);
      expect(result).toBe('500');
    });

    it('should return empty string when no HTTP status code is found', () => {
      const rowData = createMockRowData({});
      const result = extractJaegerHttpStatusCode(rowData);
      expect(result).toBe('');
    });
  });

  describe('Jaeger Schema Integration Tests', () => {
    it('should validate complete Jaeger trace data', () => {
      const jaegerSpan = {
        traceID: '0c49a3cf243904fca1d2eb167903fd0d',
        spanID: 'C_o-npoBvkC6KKY-QGLb',
        parentSpanID: 'aa61c9fd77570245',
        duration: 8301, // microseconds
        process: {
          serviceName: 'frontend-proxy',
          tags: [
            { key: 'service.namespace', value: 'opentelemetry-demo', type: 'string' },
            { key: 'service.version', value: '2.1.3', type: 'string' },
          ],
        },
        startTime: 1763591468681804, // microseconds
        startTimeMillis: 1763591468681, // milliseconds
        operationName: 'router frontend egress',
        tags: [
          { key: 'http.protocol', value: 'HTTP/1.1', type: 'string' },
          { key: 'http.status_code', value: '200', type: 'string' },
        ],
      };

      const result = validateRequiredTraceFields(jaegerSpan as any);
      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);

      // Test service name extraction
      const serviceName = extractServiceNameFromRowData(jaegerSpan as any);
      expect(serviceName).toBe('frontend-proxy');

      // Test tag extraction
      const httpStatus = extractJaegerTagValue(jaegerSpan as any, 'http.status_code');
      expect(httpStatus).toBe('200');

      const serviceVersion = extractJaegerTagValue(jaegerSpan as any, 'service.version');
      expect(serviceVersion).toBe('2.1.3');
    });

    it('should handle Jaeger trace with _source wrapper', () => {
      const jaegerSpanWithSource = {
        _source: {
          traceID: '0c49a3cf243904fca1d2eb167903fd0d',
          spanID: 'C_o-npoBvkC6KKY-QGLb',
          process: {
            serviceName: 'wrapped-service',
          },
          operationName: 'wrapped operation',
          startTime: 1763591468681804,
          duration: 5000,
        },
      };

      const serviceName = extractServiceNameFromRowData(jaegerSpanWithSource as any);
      expect(serviceName).toBe('wrapped-service');
    });

    it('should validate Jaeger trace with missing optional fields', () => {
      const minimalJaegerSpan = {
        traceID: '0c49a3cf243904fca1d2eb167903fd0d',
        spanID: 'C_o-npoBvkC6KKY-QGLb',
        parentSpanID: '',
        process: {
          serviceName: 'minimal-service',
        },
        operationName: 'minimal operation',
        startTime: 1763591468681804,
        duration: 1000,
      };

      const result = validateRequiredTraceFields(minimalJaegerSpan as any);
      expect(result.isValid).toBe(true); // startTime + duration is sufficient for endTime in Jaeger
      expect(result.missingFields).not.toContain('endTime');
      expect(result.missingFields).toContain('status.code');
      expect(result.missingFields).not.toContain('serviceName');
      expect(result.missingFields).not.toContain('name');
    });
  });
});
