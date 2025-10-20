/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseHits, applySpanFilters } from './utils';
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
