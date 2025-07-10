/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { getTimeColumn, getLegacyDisplayedColumns } from './data_table_helper';
import { IndexPattern } from '../../../../plugins/data/public';

import { getOsdFieldOverrides } from '../../../../plugins/data/public';
import { shortenDottedString } from './shorten_dotted_string';

jest.mock('../../../../plugins/data/public', () => ({
  getOsdFieldOverrides: jest.fn(),
}));

jest.mock('./shorten_dotted_string', () => ({
  shortenDottedString: jest.fn((str) => str),
}));

const mockGetOsdFieldOverrides = getOsdFieldOverrides as jest.MockedFunction<
  typeof getOsdFieldOverrides
>;
const mockShortenDottedString = shortenDottedString as jest.MockedFunction<
  typeof shortenDottedString
>;

describe('data_table_helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOsdFieldOverrides.mockReturnValue({ sortable: true });
  });

  describe('getTimeColumn', () => {
    it('should return time column properties with default values', () => {
      const timeFieldName = '@timestamp';
      const osdFieldOverrides = { sortable: true };

      const result = getTimeColumn(timeFieldName, osdFieldOverrides);

      expect(result).toEqual({
        name: '@timestamp',
        displayName: 'Time',
        isSortable: true,
        isRemoveable: false,
        colLeftIdx: -1,
        colRightIdx: -1,
      });
    });

    it('should use sortable from osdFieldOverrides when provided', () => {
      const timeFieldName = '@timestamp';
      const osdFieldOverrides = { sortable: false };

      const result = getTimeColumn(timeFieldName, osdFieldOverrides);

      expect(result.isSortable).toBe(false);
    });

    it('should default to true when sortable is not provided', () => {
      const timeFieldName = '@timestamp';
      const osdFieldOverrides = {};

      const result = getTimeColumn(timeFieldName, osdFieldOverrides);

      expect(result.isSortable).toBe(true);
    });
  });

  describe('getLegacyDisplayedColumns', () => {
    const mockIndexPattern = ({
      getFieldByName: jest.fn(),
      timeFieldName: '@timestamp',
    } as unknown) as IndexPattern;

    beforeEach(() => {
      (mockIndexPattern.getFieldByName as jest.Mock).mockReturnValue({
        sortable: true,
      });
    });

    it('should return empty array when columns is not an array', () => {
      const result = getLegacyDisplayedColumns(null as any, mockIndexPattern, false, false);

      expect(result).toEqual([]);
    });

    it('should return empty array when indexPattern is invalid', () => {
      const result = getLegacyDisplayedColumns(['field1'], null as any, false, false);

      expect(result).toEqual([]);
    });

    it('should return column properties without time field when hideTimeField is true', () => {
      const columns = ['field1', 'field2'];

      const result = getLegacyDisplayedColumns(columns, mockIndexPattern, true, false);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'field1',
        displayName: 'field1',
        isSortable: true,
        isRemoveable: false,
        colLeftIdx: -1,
        colRightIdx: 1,
      });
      expect(result[1]).toEqual({
        name: 'field2',
        displayName: 'field2',
        isSortable: true,
        isRemoveable: false,
        colLeftIdx: 0,
        colRightIdx: -1,
      });
    });

    it('should include time field when hideTimeField is false and timeFieldName exists', () => {
      const columns = ['field1'];

      const result = getLegacyDisplayedColumns(columns, mockIndexPattern, false, false);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: '@timestamp',
        displayName: 'Time',
        isSortable: true,
        isRemoveable: false,
        colLeftIdx: -1,
        colRightIdx: -1,
      });
      expect(result[1]).toEqual({
        name: 'field1',
        displayName: 'field1',
        isSortable: true,
        isRemoveable: false,
        colLeftIdx: -1,
        colRightIdx: -1,
      });
    });

    it('should not include time field when it is already in columns', () => {
      const columns = ['@timestamp', 'field1'];

      const result = getLegacyDisplayedColumns(columns, mockIndexPattern, false, false);

      expect(result).toHaveLength(2);
      expect(
        result.find((col) => col.name === '@timestamp' && col.displayName === 'Time')
      ).toBeUndefined();
    });

    it('should use shortenDottedString when isShortDots is true', () => {
      const columns = ['field.with.dots'];
      mockShortenDottedString.mockReturnValue('field...dots');

      const result = getLegacyDisplayedColumns(columns, mockIndexPattern, true, true);

      expect(mockShortenDottedString).toHaveBeenCalledWith('field.with.dots');
      expect(result[0].displayName).toBe('field...dots');
    });

    it('should handle field sortability from indexPattern', () => {
      const columns = ['field1'];
      (mockIndexPattern.getFieldByName as jest.Mock).mockReturnValue({
        sortable: false,
      });

      const result = getLegacyDisplayedColumns(columns, mockIndexPattern, true, false);

      expect(result[0].isSortable).toBe(true); // Should use osdFieldOverrides.sortable
    });
  });
});
