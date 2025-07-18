/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { filterColumns } from './filter_columns';
import { IndexPattern } from '../../application/legacy/discover/opensearch_dashboards_services';
import { getIndexPatternFieldList } from '../../components/fields_selector/lib/get_index_pattern_field_list';
import { buildColumns } from '../../application/legacy/discover/application/utils/columns';

jest.mock('../../components/fields_selector/lib/get_index_pattern_field_list');
jest.mock('../../application/legacy/discover/application/utils/columns');

const mockGetIndexPatternFieldList = getIndexPatternFieldList as jest.MockedFunction<
  typeof getIndexPatternFieldList
>;
const mockBuildColumns = buildColumns as jest.MockedFunction<typeof buildColumns>;

describe('filterColumns', () => {
  const indexPatternMock = {
    fields: {
      getAll: () => [{ name: 'a' }, { name: 'c' }, { name: 'd' }],
    },
  } as IndexPattern;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildColumns.mockImplementation((cols) => cols);
  });

  it('should return built columns when modifyColumn is false and columns exist', () => {
    const columns = ['a', 'b'];
    const defaultColumns = ['a'];
    mockBuildColumns.mockReturnValue(['a', 'b']);

    const result = filterColumns(columns, indexPatternMock, defaultColumns, false);

    expect(mockBuildColumns).toHaveBeenCalledWith(['a', 'b']);
    expect(result).toEqual(['a', 'b']);
  });

  it('should return ["_source"] when modifyColumn is false and no columns', () => {
    const columns: string[] = [];
    const defaultColumns = ['a'];

    const result = filterColumns(columns, indexPatternMock, defaultColumns, false);

    expect(result).toEqual(['_source']);
  });

  it('should filter columns based on index pattern fields when modifyColumn is true and no fieldCounts', () => {
    const columns = ['a', 'e'];
    const defaultColumns = ['a', 'e'];
    mockBuildColumns.mockReturnValue(['a']);

    const result = filterColumns(columns, indexPatternMock, defaultColumns, true);

    expect(mockBuildColumns).toHaveBeenCalledWith(['a']);
    expect(result).toEqual(['a']);
  });

  it('should use getIndexPatternFieldList when fieldCounts is provided and modifyColumn is true', () => {
    const columns = ['a', 'b'];
    const fieldCounts = { a: 5, b: 3 };
    const defaultColumns = ['a'];
    mockGetIndexPatternFieldList.mockReturnValue([{ name: 'a' } as any, { name: 'b' } as any]);
    mockBuildColumns.mockReturnValue(['a', 'b']);

    const result = filterColumns(columns, indexPatternMock, defaultColumns, true, fieldCounts);

    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(indexPatternMock, fieldCounts);
    expect(mockBuildColumns).toHaveBeenCalledWith(['a', 'b']);
    expect(result).toEqual(['a', 'b']);
  });

  it('should combine columns and defaultColumns without duplicates', () => {
    const columns = ['a', 'b'];
    const fieldCounts = { a: 5, b: 3 };
    const defaultColumns = ['a', 'c'];
    mockGetIndexPatternFieldList.mockReturnValue([{ name: 'a' } as any, { name: 'c' } as any]);
    mockBuildColumns.mockReturnValue(['a', 'c']);

    const result = filterColumns(columns, indexPatternMock, defaultColumns, true, fieldCounts);

    expect(mockBuildColumns).toHaveBeenCalledWith(['a', 'c']);
    expect(result).toEqual(['a', 'c']);
  });

  it('should return adjustedColumns when they exist', () => {
    const columns = ['a', 'b'];
    const fieldCounts = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };
    const defaultColumns = ['a'];
    mockGetIndexPatternFieldList.mockReturnValue([
      { name: 'a' } as any,
      { name: 'b' } as any,
      { name: 'c' } as any,
      { name: 'd' } as any,
      { name: 'e' } as any,
      { name: 'f' } as any,
      { name: 'g' } as any,
      { name: 'h' } as any,
    ]);
    mockBuildColumns.mockReturnValue(['a', 'b']);

    const result = filterColumns(columns, indexPatternMock, defaultColumns, true, fieldCounts);

    expect(result).toEqual(['a', 'b']);
  });

  it('should handle undefined indexPattern when modifyColumn is true', () => {
    const columns = ['a', 'b'];
    const fieldCounts = { a: 5, b: 3 };
    const defaultColumns = ['a'];
    mockGetIndexPatternFieldList.mockReturnValue([]);
    mockBuildColumns.mockReturnValue([]);

    const result = filterColumns(columns, undefined, defaultColumns, true, fieldCounts);

    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(undefined, fieldCounts);
    expect(result).toEqual(['_source']);
  });
});
