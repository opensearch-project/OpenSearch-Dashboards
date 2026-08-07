/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isPlainObject,
  removeType,
  synthesizeSeqNo,
  normalizeTotalHits,
} from './normalization_utils';

describe('normalization_utils', () => {
  describe('isPlainObject', () => {
    it('returns true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ key: 'value' })).toBe(true);
    });

    it('returns false for null', () => {
      expect(isPlainObject(null)).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject([1, 2, 3])).toBe(false);
    });

    it('returns false for primitives', () => {
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(42)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
    });

    it('returns false for Buffer', () => {
      expect(isPlainObject(Buffer.from('test'))).toBe(false);
    });

    it('returns false for serialized Buffer format', () => {
      expect(isPlainObject({ type: 'Buffer', data: [1, 2, 3] })).toBe(false);
    });

    it('returns true for objects with type field that is not Buffer', () => {
      expect(isPlainObject({ type: 'keyword' })).toBe(true);
    });
  });

  describe('removeType', () => {
    it('removes _type from a document', () => {
      const doc = { _index: 'test', _type: '_doc', _id: '1' };
      expect(removeType(doc)).toEqual({ _index: 'test', _id: '1' });
    });

    it('returns doc unchanged when no _type', () => {
      const doc = { _index: 'test', _id: '1' };
      expect(removeType(doc)).toEqual({ _index: 'test', _id: '1' });
    });

    it('returns null/undefined unchanged', () => {
      expect(removeType(null)).toBeNull();
      expect(removeType(undefined)).toBeUndefined();
    });
  });

  describe('synthesizeSeqNo', () => {
    it('synthesizes _seq_no from _version when _seq_no is missing', () => {
      const doc = { _id: '1', _version: 7 };
      synthesizeSeqNo(doc);
      expect(doc).toEqual({ _id: '1', _version: 7, _seq_no: 7, _primary_term: 1 });
    });

    it('does not overwrite existing _seq_no', () => {
      const doc = { _id: '1', _version: 7, _seq_no: 10, _primary_term: 2 };
      synthesizeSeqNo(doc);
      expect(doc._seq_no).toBe(10);
      expect(doc._primary_term).toBe(2);
    });

    it('does nothing when _version is absent', () => {
      const doc = { _id: '1' };
      synthesizeSeqNo(doc);
      expect(doc).toEqual({ _id: '1' });
    });
  });

  describe('normalizeTotalHits', () => {
    it('converts number to object format', () => {
      expect(normalizeTotalHits(42)).toEqual({ value: 42, relation: 'eq' });
    });

    it('passes through object format', () => {
      const total = { value: 100, relation: 'gte' };
      expect(normalizeTotalHits(total)).toBe(total);
    });

    it('returns zero for undefined', () => {
      expect(normalizeTotalHits(undefined)).toEqual({ value: 0, relation: 'eq' });
    });
  });
});
