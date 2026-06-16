/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCategoryLabel, OP_DEF_MAP, getOperationSiblings } from './operation_lookup';

describe('operation_lookup', () => {
  describe('getCategoryLabel', () => {
    it('returns Function for function ops', () => {
      expect(getCategoryLabel('abs')).toBe('Function');
    });

    it('returns Aggregation for aggregation ops', () => {
      expect(getCategoryLabel('sum')).toBe('Aggregation');
    });

    it('returns Binary operation for binary ops', () => {
      expect(getCategoryLabel('add')).toBe('Binary operation');
    });

    it('returns Literal for literal op', () => {
      expect(getCategoryLabel('literal')).toBe('Literal');
    });

    it('returns Operation for unknown op', () => {
      expect(getCategoryLabel('unknown_op')).toBe('Operation');
    });
  });

  describe('OP_DEF_MAP', () => {
    it('contains rate definition', () => {
      expect(OP_DEF_MAP.rate).toBeDefined();
      expect(OP_DEF_MAP.rate.id).toBe('rate');
    });

    it('contains sum definition', () => {
      expect(OP_DEF_MAP.sum).toBeDefined();
    });
  });

  describe('getOperationSiblings', () => {
    it('returns siblings for aggregation', () => {
      const siblings = getOperationSiblings('sum');
      expect(siblings.some((s) => s.id === 'avg')).toBe(true);
      expect(siblings.some((s) => s.id === 'count')).toBe(true);
    });

    it('returns empty array for unknown op', () => {
      expect(getOperationSiblings('unknown')).toEqual([]);
    });
  });
});
