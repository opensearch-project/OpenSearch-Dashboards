/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseHits } from './utils';
import { ParsedHit } from './types';

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
