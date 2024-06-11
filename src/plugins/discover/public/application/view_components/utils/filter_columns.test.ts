/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { filterColumns } from './filter_columns';
import { IndexPattern } from '../../../opensearch_dashboards_services';

describe('filterColumns', () => {
  const indexPatternMock = {
    fields: {
      getAll: () => [{ name: 'a' }, { name: 'c' }, { name: 'd' }],
    },
  } as IndexPattern;

  it('should return columns that exist in the index pattern fields when MODIFY_COLUMN_ON_SWITCH is true', () => {
    const columns = ['a', 'b'];
    const result = filterColumns(columns, indexPatternMock, ['a'], true);
    expect(result).toEqual(['a']);
  });

  it('should return all of the columns when MODIFY_COLUMN_ON_SWITCH is false', () => {
    const columns = ['a', 'b'];
    const result = filterColumns(columns, indexPatternMock, ['a'], false);
    expect(result).toEqual(['a', 'b']);
  });

  it('should return defualt columns if columns are empty', () => {
    const result = filterColumns([], indexPatternMock, ['a'], false);
    expect(result).toEqual(['_source']);
  });

  it('should return defaultColumns if no columns exist in the index pattern fields when MODIFY_COLUMN_ON_SWITCH is true', () => {
    const columns = ['b', 'e'];
    const result = filterColumns(columns, indexPatternMock, ['e'], true);
    expect(result).toEqual(['_source']);
  });

  it('should return defaultColumns if no columns and indexPattern is undefined', () => {
    const columns = ['b', 'e'];
    const result = filterColumns(columns, undefined, ['a'], true);
    expect(result).toEqual(['_source']);
  });
});
