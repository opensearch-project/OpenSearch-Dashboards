/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDataViewFieldFilterable as isFilterable } from '..';
import { IDataViewFieldType } from '.';

const mockField = {
  name: 'foo',
  scripted: false,
  searchable: true,
  type: 'string',
} as IDataViewFieldType;

describe('isFilterable', () => {
  describe('types', () => {
    it('should return true for filterable types', () => {
      ['string', 'number', 'date', 'ip', 'boolean'].forEach((type) => {
        expect(isFilterable({ ...mockField, type })).toBe(true);
      });
    });

    it('should return false for filterable types if the field is not searchable', () => {
      ['string', 'number', 'date', 'ip', 'boolean'].forEach((type) => {
        expect(isFilterable({ ...mockField, type, searchable: false })).toBe(false);
      });
    });

    it('should return false for un-filterable types', () => {
      ['geo_point', 'geo_shape', 'attachment', 'murmur3', '_source', 'unknown', 'conflict'].forEach(
        (type) => {
          expect(isFilterable({ ...mockField, type })).toBe(false);
        }
      );
    });
  });

  it('should return true for scripted fields', () => {
    expect(isFilterable({ ...mockField, scripted: true, searchable: false })).toBe(true);
  });

  it('should return true for the _id field', () => {
    expect(isFilterable({ ...mockField, name: '_id' })).toBe(true);
  });
});
