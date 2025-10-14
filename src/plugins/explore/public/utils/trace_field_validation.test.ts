/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  validateRequiredTraceFields,
  getMissingFieldsDescription,
  extractFieldFromRowData,
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
      expect(result.missingFields).toContain('parentSpanId');
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
});
