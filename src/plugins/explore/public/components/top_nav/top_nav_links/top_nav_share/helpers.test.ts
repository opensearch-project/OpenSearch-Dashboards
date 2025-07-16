/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSharingDataFields, getSharingData } from './helpers';
import { ISearchSource } from '../../../../../../data/common';
import { LegacyState } from '../../../../application/utils/state_management/slices';
import { ExploreServices } from '../../../../types';

// Mock dependencies
jest.mock(
  '../../../../application/legacy/discover/application/view_components/utils/get_sort_for_search_source',
  () => ({
    getSortForSearchSource: jest.fn(() => [{ timestamp: { order: 'desc' } }]),
  })
);

describe('helpers', () => {
  describe('getSharingDataFields', () => {
    it('returns undefined searchFields when only _source is selected', async () => {
      const result = await getSharingDataFields(['_source'], false);

      expect(result).toEqual({
        searchFields: undefined,
      });
    });

    it('returns selected fields when multiple fields are selected', async () => {
      const selectedFields = ['field1', 'field2'];
      const result = await getSharingDataFields(selectedFields, false);

      expect(result).toEqual({
        searchFields: selectedFields,
        selectFields: selectedFields,
      });
    });

    it('includes time field when hideTimeColumn is false and timeFieldName is provided', async () => {
      const selectedFields = ['field1', 'field2'];
      const timeFieldName = 'timestamp';
      const result = await getSharingDataFields(selectedFields, false, timeFieldName);

      expect(result).toEqual({
        searchFields: [timeFieldName, ...selectedFields],
        selectFields: [timeFieldName, ...selectedFields],
      });
    });

    it('excludes time field when hideTimeColumn is true', async () => {
      const selectedFields = ['field1', 'field2'];
      const timeFieldName = 'timestamp';
      const result = await getSharingDataFields(selectedFields, true, timeFieldName);

      expect(result).toEqual({
        searchFields: selectedFields,
        selectFields: selectedFields,
      });
    });
  });

  describe('getSharingData', () => {
    const mockSearchSource = ({
      createCopy: jest.fn(() => ({
        getField: jest.fn((field) => {
          if (field === 'index') {
            return Promise.resolve({
              title: 'test-index',
              timeFieldName: 'timestamp',
              metaFields: ['_id', '_type'],
              fields: [
                { name: 'field1', type: 'string' },
                { name: 'field2', type: 'conflict' },
              ],
              id: 'test-index-id',
            });
          }
          return Promise.resolve(null);
        }),
        setField: jest.fn(),
      })),
      getSearchRequestBody: jest.fn(() => Promise.resolve({ query: { match_all: {} } })),
    } as unknown) as ISearchSource;

    const mockState: LegacyState = {
      columns: ['field1', 'field2'],
      sort: [['timestamp', 'desc']],
      savedSearch: undefined,
      savedQuery: undefined,
      interval: '1h',
      isDirty: false,
      lineCount: undefined,
    };

    const mockServices = ({
      uiSettings: {
        get: jest.fn((setting, defaultValue) => {
          if (setting === 'doc:hideTimeColumn') return false;
          if (setting === 'discover:sort:defaultOrder') return 'desc';
          return defaultValue;
        }),
      },
    } as unknown) as ExploreServices;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('processes search source and returns sharing data', async () => {
      const result = await getSharingData({
        searchSource: mockSearchSource,
        state: mockState,
        services: mockServices,
      });

      expect(result).toEqual({
        searchRequest: {
          index: 'test-index',
          body: { query: { match_all: {} } },
        },
        metaFields: ['_id', '_type'],
        conflictedTypesFields: ['field2'],
        indexPatternId: 'test-index-id',
      });
    });

    it('configures search source copy with correct fields', async () => {
      const mockCopy = {
        getField: jest.fn((field) => {
          if (field === 'index') {
            return Promise.resolve({
              title: 'test-index',
              timeFieldName: 'timestamp',
              metaFields: ['_id'],
              fields: [],
              id: 'test-id',
            });
          }
          return Promise.resolve(null);
        }),
        setField: jest.fn(),
      };

      (mockSearchSource as any).createCopy = jest.fn(() => mockCopy);

      await getSharingData({
        searchSource: mockSearchSource,
        state: mockState,
        services: mockServices,
      });

      expect(mockCopy.setField).toHaveBeenCalledWith('fields', ['timestamp', 'field1', 'field2']);
      expect(mockCopy.setField).toHaveBeenCalledWith('sort', [{ timestamp: { order: 'desc' } }]);
      expect(mockCopy.setField).toHaveBeenCalledWith('highlight', null);
      expect(mockCopy.setField).toHaveBeenCalledWith('highlightAll', undefined);
      expect(mockCopy.setField).toHaveBeenCalledWith('aggs', null);
      expect(mockCopy.setField).toHaveBeenCalledWith('size', undefined);
    });
  });
});
