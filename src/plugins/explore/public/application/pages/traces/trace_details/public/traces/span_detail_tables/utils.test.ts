/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseHits, applySpanFilters, isStatusMatch } from './utils';
import { ParsedHit } from './types';
import * as pplResolveHelpers from '../ppl_resolve_helpers';

describe('parseHits', () => {
  const mockHit: ParsedHit = {
    spanId: 'test-span-id',
    children: [],
    operationName: 'test-operation',
  };

  it('should parse valid JSON with hits.hits structure', () => {
    const payloadData = JSON.stringify({
      hits: {
        hits: [mockHit],
      },
    });

    const result = parseHits(payloadData);
    expect(result).toEqual([mockHit]);
  });

  it('should parse valid JSON array directly', () => {
    const payloadData = JSON.stringify([mockHit]);

    const result = parseHits(payloadData);
    expect(result).toEqual([mockHit]);
  });

  it('should return empty array for invalid JSON', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const payloadData = 'invalid json';

    const result = parseHits(payloadData);
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error processing payloadData:',
      expect.any(SyntaxError)
    );

    consoleSpy.mockRestore();
  });

  it('should return empty array for valid JSON without hits structure', () => {
    const payloadData = JSON.stringify({ data: 'test' });

    const result = parseHits(payloadData);
    expect(result).toEqual([]);
  });

  it('should return empty array for null hits.hits', () => {
    const payloadData = JSON.stringify({
      hits: {
        hits: null,
      },
    });

    const result = parseHits(payloadData);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = parseHits('');
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('applySpanFilters', () => {
  const mockSpans: ParsedHit[] = [
    {
      spanId: 'span-1',
      children: [],
      operationName: 'GET /api/users',
      serviceName: 'user-service',
      'status.code': 1,
      attributes: {
        http: {
          method: 'GET',
          status_code: 200,
        },
      },
    },
    {
      spanId: 'span-2',
      children: [],
      operationName: 'POST /api/orders',
      serviceName: 'order-service',
      'status.code': 2,
      attributes: {
        http: {
          method: 'POST',
          status_code: 500,
        },
      },
    },
    {
      spanId: 'span-3',
      children: [],
      operationName: 'GET /api/products',
      serviceName: 'product-service',
      'status.code': 1,
      attributes: {
        http: {
          method: 'GET',
          status_code: 404,
        },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all spans when no filters are applied', () => {
    const result = applySpanFilters(mockSpans, []);
    expect(result).toEqual(mockSpans);
  });

  it('should filter spans by simple field value', () => {
    const filters = [{ field: 'serviceName', value: 'user-service' }];
    const result = applySpanFilters(mockSpans, filters);
    expect(result).toEqual([mockSpans[0]]);
  });

  it('should filter spans by nested field value', () => {
    const filters = [{ field: 'attributes.http.method', value: 'POST' }];
    const result = applySpanFilters(mockSpans, filters);
    expect(result).toEqual([mockSpans[1]]);
  });

  it('should filter error spans using isError filter', () => {
    jest.spyOn(pplResolveHelpers, 'isSpanError').mockImplementation((span) => {
      return span['status.code'] === 2 || span.attributes?.http?.status_code >= 400;
    });

    const filters = [{ field: 'isError', value: true }];
    const result = applySpanFilters(mockSpans, filters);
    expect(result).toEqual([mockSpans[1], mockSpans[2]]);
    expect(pplResolveHelpers.isSpanError).toHaveBeenCalledTimes(3);
  });

  it('should apply multiple filters with AND logic', () => {
    const filters = [
      { field: 'attributes.http.method', value: 'GET' },
      { field: 'serviceName', value: 'user-service' },
    ];
    const result = applySpanFilters(mockSpans, filters);
    expect(result).toEqual([mockSpans[0]]);
  });

  it('should return empty array when no spans match filters', () => {
    const filters = [{ field: 'serviceName', value: 'non-existent-service' }];
    const result = applySpanFilters(mockSpans, filters);
    expect(result).toEqual([]);
  });

  it('should handle undefined nested field values', () => {
    const filters = [{ field: 'attributes.non.existent.field', value: 'test' }];
    const result = applySpanFilters(mockSpans, filters);
    expect(result).toEqual([]);
  });

  it('should handle empty spans array', () => {
    const filters = [{ field: 'serviceName', value: 'test' }];
    const result = applySpanFilters([], filters);
    expect(result).toEqual([]);
  });
});

describe('isStatusMatch', () => {
  const mockSpan: ParsedHit = {
    spanId: 'test-span',
    children: [],
    status: { code: 1 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for isError filter when span is error', () => {
    jest.spyOn(pplResolveHelpers, 'isSpanError').mockReturnValue(true);

    const result = isStatusMatch(mockSpan, 'isError', true);

    expect(result).toBe(true);
    expect(pplResolveHelpers.isSpanError).toHaveBeenCalledWith(mockSpan);
  });

  it('should return false for isError filter when span is not error', () => {
    jest.spyOn(pplResolveHelpers, 'isSpanError').mockReturnValue(false);

    const result = isStatusMatch(mockSpan, 'isError', true);

    expect(result).toBe(false);
  });

  it('should return true for status.code 2 when span is error', () => {
    jest.spyOn(pplResolveHelpers, 'isSpanError').mockReturnValue(true);

    const result = isStatusMatch(mockSpan, 'status.code', 2);

    expect(result).toBe(true);
    expect(pplResolveHelpers.isSpanError).toHaveBeenCalledWith(mockSpan);
  });

  it('should return true for status.code 1 when span is OK (not Error)', () => {
    jest.spyOn(pplResolveHelpers, 'isSpanError').mockReturnValue(false);

    const result = isStatusMatch(mockSpan, 'status.code', 1);

    expect(result).toBe(true);
    expect(pplResolveHelpers.isSpanError).toHaveBeenCalledWith(mockSpan);
  });

  it('should return true for status.code 0 when extractStatusCode returns 0', () => {
    jest.spyOn(pplResolveHelpers, 'extractStatusCode').mockReturnValue(0);

    const result = isStatusMatch(mockSpan, 'status.code', 0);

    expect(result).toBe(true);
    expect(pplResolveHelpers.extractStatusCode).toHaveBeenCalledWith(mockSpan.status);
  });

  it('should return false for status.code 0 when extractStatusCode returns non-zero', () => {
    jest.spyOn(pplResolveHelpers, 'extractStatusCode').mockReturnValue(1);

    const result = isStatusMatch(mockSpan, 'status.code', 0);

    expect(result).toBe(false);
  });

  it('should return false for unknown field', () => {
    const result = isStatusMatch(mockSpan, 'unknown.field', 'value');

    expect(result).toBe(false);
  });

  it('should return false for unknown status.code value', () => {
    const result = isStatusMatch(mockSpan, 'status.code', 99);

    expect(result).toBe(false);
  });
});
